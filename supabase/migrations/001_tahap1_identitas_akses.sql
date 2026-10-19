-- =====================================================================
-- SIM-PESANTREN ERP — Migrasi 001: Identitas, Hak Akses, RLS, Audit
-- Target: Supabase (PostgreSQL). Jalankan di SQL Editor atau via CLI.
-- Zona waktu aplikasi: Asia/Jakarta (disimpan sebagai timestamptz/UTC).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABEL INTI
-- ---------------------------------------------------------------------
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  address text,
  phone text,
  email text,
  report_header text,
  timezone text not null default 'Asia/Jakarta',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profil pengguna; kata sandi dikelola Supabase Auth (auth.users)
create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id),
  full_name text not null default '',
  email text,
  phone text,
  is_active boolean not null default false,  -- harus diaktifkan admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.app_users (institution_id);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- contoh: finance.approve
  module text not null,
  action text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.app_users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  institution_id uuid not null references public.institutions(id),
  granted_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index on public.user_roles (institution_id);

create table public.application_settings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (institution_id, key)
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,                 -- contoh: 2026/2027
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date > start_date),
  unique (institution_id, name)
);
-- Hanya satu tahun ajaran aktif per lembaga
create unique index academic_years_one_active
  on public.academic_years (institution_id) where is_active;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  institution_id uuid,
  user_id uuid,
  action text not null,               -- INSERT / UPDATE / DELETE
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (institution_id, created_at desc);
create index on public.audit_logs (table_name, record_id);

-- ---------------------------------------------------------------------
-- 2. FUNGSI BANTU (SECURITY DEFINER, search_path dikunci)
-- ---------------------------------------------------------------------
create or replace function public.current_institution_id()
returns uuid language sql stable security definer set search_path = public as $$
  select institution_id from public.app_users
  where id = auth.uid() and is_active
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.app_users u on u.id = ur.user_id
    where ur.user_id = auth.uid() and r.code = 'super_admin' and u.is_active
  )
$$;

create or replace function public.has_permission(p_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin() or exists (
    select 1
    from public.user_roles ur
    join public.app_users u on u.id = ur.user_id and u.is_active
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.code = p_code
  )
$$;

revoke all on function public.current_institution_id(), public.is_super_admin(),
  public.has_permission(text) from public, anon;
grant execute on function public.current_institution_id(), public.is_super_admin(),
  public.has_permission(text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. TRIGGER: updated_at, profil otomatis, anti-eskalasi, audit
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_institutions_upd before update on public.institutions
  for each row execute function public.set_updated_at();
create trigger trg_app_users_upd before update on public.app_users
  for each row execute function public.set_updated_at();
create trigger trg_settings_upd before update on public.application_settings
  for each row execute function public.set_updated_at();

-- Profil dibuat saat pengguna mendaftar; NONAKTIF sampai disetujui admin
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Pengguna biasa tidak boleh mengubah status aktif / lembaganya sendiri
create or replace function public.guard_app_users()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_permission('users.manage') then
    if new.is_active is distinct from old.is_active
       or new.institution_id is distinct from old.institution_id
       or new.id is distinct from old.id then
      raise exception 'Tidak diizinkan mengubah status atau lembaga pengguna';
    end if;
  end if;
  return new;
end $$;

create trigger trg_guard_app_users before update on public.app_users
  for each row execute function public.guard_app_users();

-- Audit generik (tidak mencatat password/token; tabel ini tidak memuatnya)
create or replace function public.audit_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb;
  v_inst uuid;
begin
  v_row := to_jsonb(coalesce(new, old));
  v_inst := nullif(v_row->>'institution_id','')::uuid;
  insert into public.audit_logs
    (institution_id, user_id, action, table_name, record_id, old_data, new_data)
  values (
    coalesce(v_inst, public.current_institution_id()),
    auth.uid(), tg_op, tg_table_name,
    coalesce(v_row->>'id', v_row->>'user_id'),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['institutions','app_users','user_roles',
    'role_permissions','application_settings','academic_years']
  loop
    execute format('create trigger trg_audit_%1$s after insert or update or delete
      on public.%1$s for each row execute function public.audit_trigger()', t);
  end loop;
end $$;

-- Audit log tidak boleh diubah/dihapus
create or replace function public.audit_immutable()
returns trigger language plpgsql as $$
begin raise exception 'audit_logs bersifat append-only'; end $$;
create trigger trg_audit_immutable before update or delete on public.audit_logs
  for each row execute function public.audit_immutable();

-- ---------------------------------------------------------------------
-- 4. DATA AWAL: PERAN & IZIN
-- ---------------------------------------------------------------------
insert into public.roles (code, name) values
  ('super_admin','Super Admin/Master'),
  ('pimpinan','Pimpinan Pesantren'),
  ('bendahara','Bendahara'),
  ('admin_santri','Admin Santri'),
  ('admin_akademik','Admin Akademik'),
  ('ustadz','Ustadz/Ustadzah'),
  ('wali_kelas','Wali Kelas'),
  ('petugas_sdm','Petugas SDM'),
  ('petugas_toko','Petugas Toko/Kantin'),
  ('wali_santri','Wali Santri');

insert into public.permissions (code, module, action)
select m || '.' || a, m, a
from unnest(array['users','settings','students','guardians','employees',
  'finance','invoices','payments','payroll','inventory','sales',
  'academic','scores','attendance','tahfidz','report_cards',
  'reports','announcements','audit']) m,
     unnest(array['view','create','update','approve','cancel','export','manage']) a;

-- Super Admin: lewat bypass is_super_admin(), tetapi dipetakan juga agar eksplisit
insert into public.role_permissions
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'super_admin';

-- Pemetaan awal peran lain (sesuaikan lewat halaman Hak Akses)
with map(role_code, module, actions) as (values
  ('pimpinan','reports',array['view','export']),
  ('pimpinan','finance',array['view']),
  ('pimpinan','students',array['view']),
  ('pimpinan','academic',array['view']),
  ('pimpinan','report_cards',array['view','approve']),
  ('bendahara','finance',array['view','create','update','approve','cancel','export']),
  ('bendahara','invoices',array['view','create','update','cancel']),
  ('bendahara','payments',array['view','create','cancel','export']),
  ('bendahara','reports',array['view','export']),
  ('admin_santri','students',array['view','create','update','export']),
  ('admin_santri','guardians',array['view','create','update','approve']),
  ('admin_akademik','academic',array['view','create','update','manage']),
  ('admin_akademik','scores',array['view','update','approve']),
  ('admin_akademik','report_cards',array['view','create','update','approve','export']),
  ('admin_akademik','attendance',array['view']),
  ('admin_akademik','tahfidz',array['view','approve']),
  ('ustadz','scores',array['view','create','update']),
  ('ustadz','attendance',array['view','create','update']),
  ('ustadz','tahfidz',array['view','create','update']),
  ('wali_kelas','scores',array['view']),
  ('wali_kelas','attendance',array['view']),
  ('wali_kelas','report_cards',array['view','update']),
  ('petugas_sdm','employees',array['view','create','update','export']),
  ('petugas_sdm','payroll',array['view','create','update','export']),
  ('petugas_toko','inventory',array['view','create','update']),
  ('petugas_toko','sales',array['view','create','cancel'])
)
insert into public.role_permissions
select r.id, p.id
from map m
join public.roles r on r.code = m.role_code
join public.permissions p on p.module = m.module and p.action = any (m.actions);

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.institutions enable row level security;
alter table public.app_users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.application_settings enable row level security;
alter table public.academic_years enable row level security;
alter table public.audit_logs enable row level security;

-- institutions
create policy inst_select on public.institutions for select to authenticated
  using (id = public.current_institution_id());
create policy inst_update on public.institutions for update to authenticated
  using (id = public.current_institution_id() and public.has_permission('settings.manage'))
  with check (id = public.current_institution_id());

-- app_users
create policy users_select on public.app_users for select to authenticated
  using (id = auth.uid()
    or (institution_id = public.current_institution_id() and public.has_permission('users.view')));
create policy users_update_self on public.app_users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy users_update_admin on public.app_users for update to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('users.manage'))
  with check (institution_id = public.current_institution_id());

-- roles & permissions: referensi, dapat dibaca semua pengguna login
create policy roles_select on public.roles for select to authenticated using (true);
create policy perms_select on public.permissions for select to authenticated using (true);

-- role_permissions: baca semua, ubah hanya Super Admin
create policy rp_select on public.role_permissions for select to authenticated using (true);
create policy rp_write on public.role_permissions for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- user_roles
create policy ur_select on public.user_roles for select to authenticated
  using (user_id = auth.uid()
    or (institution_id = public.current_institution_id() and public.has_permission('users.view')));
create policy ur_write on public.user_roles for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('users.manage'))
  with check (institution_id = public.current_institution_id() and public.has_permission('users.manage'));

-- application_settings
create policy set_select on public.application_settings for select to authenticated
  using (institution_id = public.current_institution_id());
create policy set_write on public.application_settings for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('settings.manage'))
  with check (institution_id = public.current_institution_id() and public.has_permission('settings.manage'));

-- academic_years
create policy ay_select on public.academic_years for select to authenticated
  using (institution_id = public.current_institution_id());
create policy ay_write on public.academic_years for all to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('academic.manage'))
  with check (institution_id = public.current_institution_id() and public.has_permission('academic.manage'));

-- audit_logs: hanya baca, hanya yang berizin
create policy audit_select on public.audit_logs for select to authenticated
  using (institution_id = public.current_institution_id() and public.has_permission('audit.view'));

-- ---------------------------------------------------------------------
-- 6. SUPER ADMIN PERTAMA (jalankan MANUAL sekali, lihat panduan)
-- ---------------------------------------------------------------------
-- Langkah: (a) buat pengguna lewat Dashboard Supabase > Authentication > Users
--          (b) ganti nilai di bawah, lalu jalankan di SQL Editor.
--
-- do $$
-- declare v_inst uuid; v_user uuid;
-- begin
--   select id into v_user from auth.users where email = 'EMAIL_ADMIN@contoh.id';
--   insert into public.institutions (name) values ('NAMA PESANTREN') returning id into v_inst;
--   update public.app_users set institution_id = v_inst, is_active = true,
--     full_name = 'Super Admin' where id = v_user;
--   insert into public.user_roles (user_id, role_id, institution_id)
--   select v_user, id, v_inst from public.roles where code = 'super_admin';
-- end $$;
--
-- Catatan: guard_app_users tidak memblokir eksekusi di SQL Editor (auth.uid() null).
