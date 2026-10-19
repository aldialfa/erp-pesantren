-- Migrasi 003: Tahap 2 — santri, wali, pegawai, kelas, asrama

create table public.dormitories (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  capacity int check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id),
  level text not null,                       -- jenjang
  name text not null,
  homeroom_user_id uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  unique (institution_id, academic_year_id, name)
);
create index on public.classes (academic_year_id);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  nis text not null,
  full_name text not null,
  photo_path text,
  birth_place text,
  birth_date date,
  gender char(1) not null check (gender in ('L','P')),
  address text,
  phone text,
  admission_date date,
  program text,
  dormitory_id uuid references public.dormitories(id),
  status text not null default 'aktif' check (status in ('aktif','lulus','pindah','nonaktif')),
  archived_at timestamptz,
  created_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_nis_unique unique (institution_id, nis)
);
-- Cegah data ganda (nama + tanggal lahir sama dalam satu lembaga)
create unique index students_dup_identity
  on public.students (institution_id, lower(full_name), birth_date) where birth_date is not null;
create index on public.students (institution_id, status);
create index on public.students (dormitory_id);

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid references public.app_users(id),  -- akun portal (opsional)
  full_name text not null,
  phone text,
  address text,
  occupation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index guardians_one_per_user on public.guardians (institution_id, user_id) where user_id is not null;

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  relation text not null check (relation in ('ayah','ibu','wali')),
  status text not null default 'menunggu' check (status in ('menunggu','disetujui','ditolak')),
  approved_by uuid references public.app_users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, guardian_id)
);
create index on public.student_guardians (guardian_id);

create table public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id),
  created_at timestamptz not null default now(),
  unique (student_id, academic_year_id)       -- satu kelas per tahun ajaran
);
create index on public.class_enrollments (class_id);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid references public.app_users(id),
  nip text not null,
  full_name text not null,
  photo_path text,
  position text,
  work_unit text,
  start_date date,
  status text not null default 'aktif' check (status in ('aktif','cuti','nonaktif')),
  phone text,
  email text,
  address text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, nip)
);

-- Data rekening dipisah agar izinnya lebih ketat (izin payroll)
create table public.employee_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique references public.employees(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  updated_at timestamptz not null default now()
);

-- Trigger updated_at & audit
do $$
declare t text;
begin
  foreach t in array array['students','guardians','employees','employee_bank_accounts'] loop
    execute format('create trigger trg_%1$s_upd before update on public.%1$s
      for each row execute function public.set_updated_at()', t);
  end loop;
  foreach t in array array['dormitories','classes','students','guardians','student_guardians',
                           'class_enrollments','employees'] loop
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$s
      for each row execute function public.audit_trigger()', t);
  end loop;
end $$;

-- Pencatat persetujuan wali
create or replace function public.stamp_guardian_approval()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.approved_by := auth.uid();
    new.approved_at := now();
  end if;
  return new;
end $$;
create trigger trg_sg_approval before update on public.student_guardians
  for each row execute function public.stamp_guardian_approval();

-- ---------------------------------------------------------------------
-- Fungsi bantu
-- ---------------------------------------------------------------------
create or replace function public.is_guardian_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.student_guardians sg
    join public.guardians g on g.id = sg.guardian_id
    where sg.student_id = p_student and sg.status = 'disetujui' and g.user_id = auth.uid()
  )
$$;
revoke all on function public.is_guardian_of(uuid) from public, anon;
grant execute on function public.is_guardian_of(uuid) to authenticated;

-- Tambah wali + hubungkan ke santri (status menunggu persetujuan), atomik.
-- Jika email akun sudah punya data wali, data tersebut dipakai ulang (satu wali, banyak anak).
create or replace function public.add_guardian_link(
  p_student uuid, p_name text, p_relation text, p_phone text, p_address text, p_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_inst uuid := public.current_institution_id(); v_user uuid; v_guardian uuid;
begin
  if not public.has_permission('guardians.create') then raise exception 'Tidak memiliki izin'; end if;
  if not exists (select 1 from public.students where id = p_student and institution_id = v_inst) then
    raise exception 'Santri tidak ditemukan';
  end if;
  if p_relation not in ('ayah','ibu','wali') then raise exception 'Hubungan tidak valid'; end if;
  if nullif(trim(p_email),'') is not null then
    select u.id into v_user from public.app_users u
      where lower(u.email) = lower(trim(p_email)) and u.institution_id = v_inst and u.is_active;
    if v_user is null then raise exception 'Akun dengan email itu belum aktif di lembaga ini'; end if;
    select id into v_guardian from public.guardians where institution_id = v_inst and user_id = v_user;
  end if;
  if v_guardian is null then
    if nullif(trim(p_name),'') is null then raise exception 'Nama wali wajib diisi'; end if;
    insert into public.guardians (institution_id, user_id, full_name, phone, address)
      values (v_inst, v_user, trim(p_name), nullif(trim(p_phone),''), nullif(trim(p_address),''))
      returning id into v_guardian;
  end if;
  insert into public.student_guardians (institution_id, student_id, guardian_id, relation)
    values (v_inst, p_student, v_guardian, p_relation);
  return v_guardian;
end $$;
revoke all on function public.add_guardian_link(uuid,text,text,text,text,text) from public, anon;
grant execute on function public.add_guardian_link(uuid,text,text,text,text,text) to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.dormitories enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.employees enable row level security;
alter table public.employee_bank_accounts enable row level security;

-- Nama asrama & kelas tidak sensitif: terbaca oleh anggota lembaga
create policy dorm_select on public.dormitories for select to authenticated
  using (institution_id = public.current_institution_id());
create policy dorm_write on public.dormitories for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('students.update'))
  with check (institution_id = public.current_institution_id() and public.has_permission('students.update'));

create policy cls_select on public.classes for select to authenticated
  using (institution_id = public.current_institution_id());
create policy cls_write on public.classes for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('academic.manage'))
  with check (institution_id = public.current_institution_id() and public.has_permission('academic.manage'));

-- Santri: staf berizin, atau wali yang hubungannya sudah disetujui
create policy stu_select on public.students for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.has_permission('students.view') or public.is_guardian_of(id)));
create policy stu_insert on public.students for insert to authenticated
  with check (institution_id = public.current_institution_id() and public.has_permission('students.create'));
create policy stu_update on public.students for update to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('students.update'))
  with check (institution_id = public.current_institution_id());
-- Sengaja tanpa kebijakan DELETE: santri diarsipkan, tidak dihapus.

create policy grd_select on public.guardians for select to authenticated
  using (institution_id = public.current_institution_id()
         and (user_id = auth.uid() or public.has_permission('students.view') or public.has_permission('guardians.view')));
create policy grd_update on public.guardians for update to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('guardians.update'))
  with check (institution_id = public.current_institution_id());
-- INSERT guardians hanya lewat add_guardian_link()

create policy sg_select on public.student_guardians for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.has_permission('students.view') or public.has_permission('guardians.view')
              or exists (select 1 from public.guardians g where g.id = guardian_id and g.user_id = auth.uid())));
create policy sg_update on public.student_guardians for update to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('guardians.approve'))
  with check (institution_id = public.current_institution_id());
create policy sg_delete on public.student_guardians for delete to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('guardians.update'));

create policy enr_select on public.class_enrollments for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.has_permission('students.view') or public.has_permission('academic.view')
              or public.is_guardian_of(student_id)));
create policy enr_write on public.class_enrollments for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('academic.manage'))
  with check (institution_id = public.current_institution_id() and public.has_permission('academic.manage'));

create policy emp_select on public.employees for select to authenticated
  using (institution_id = public.current_institution_id()
         and (public.has_permission('employees.view') or user_id = auth.uid()));
create policy emp_insert on public.employees for insert to authenticated
  with check (institution_id = public.current_institution_id() and public.has_permission('employees.create'));
create policy emp_update on public.employees for update to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('employees.update'))
  with check (institution_id = public.current_institution_id());

create policy bank_select on public.employee_bank_accounts for select to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('payroll.view'));
create policy bank_write on public.employee_bank_accounts for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('payroll.update'))
  with check (institution_id = public.current_institution_id() and public.has_permission('payroll.update'));

-- Tambahan pemetaan izin untuk peran yang memerlukan data santri/pegawai
insert into public.role_permissions
select r.id, p.id from (values
  ('admin_akademik','students','view'),
  ('wali_kelas','students','view'),
  ('bendahara','students','view'),
  ('pimpinan','employees','view'),
  ('pimpinan','guardians','view'),
  ('admin_santri','guardians','view')
) m(rc, md, ac)
join public.roles r on r.code = m.rc
join public.permissions p on p.module = m.md and p.action = m.ac
on conflict do nothing;
