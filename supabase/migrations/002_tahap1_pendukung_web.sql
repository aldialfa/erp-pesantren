-- Migrasi 002: fungsi & kebijakan pendukung untuk aplikasi web Tahap 1

-- Daftar izin milik pengguna yang sedang login
create or replace function public.my_permissions()
returns setof text language sql stable security definer set search_path = public as $$
  select p.code from public.permissions p
  where public.is_super_admin()
  union
  select p.code from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid()
$$;
revoke all on function public.my_permissions() from public, anon;
grant execute on function public.my_permissions() to authenticated;

-- Aktifkan satu tahun ajaran secara atomik (menonaktifkan yang lain)
create or replace function public.set_active_academic_year(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_inst uuid;
begin
  if not public.has_permission('academic.manage') then
    raise exception 'Tidak memiliki izin';
  end if;
  select institution_id into v_inst from public.academic_years where id = p_id;
  if v_inst is null or v_inst <> public.current_institution_id() then
    raise exception 'Tahun ajaran tidak ditemukan';
  end if;
  update public.academic_years set is_active = false
    where institution_id = v_inst and is_active and id <> p_id;
  update public.academic_years set is_active = true where id = p_id;
end $$;
revoke all on function public.set_active_academic_year(uuid) from public, anon;
grant execute on function public.set_active_academic_year(uuid) to authenticated;

-- Admin pengguna boleh melihat & mengaktifkan akun baru yang belum punya lembaga
drop policy users_select on public.app_users;
create policy users_select on public.app_users for select to authenticated
  using (id = auth.uid()
    or ((institution_id = public.current_institution_id() or institution_id is null)
        and public.has_permission('users.view')));

drop policy users_update_admin on public.app_users;
create policy users_update_admin on public.app_users for update to authenticated
  using ((institution_id = public.current_institution_id() or institution_id is null)
         and public.has_permission('users.manage'))
  with check (institution_id = public.current_institution_id());

-- Hanya Super Admin yang boleh memberi/mencabut peran super_admin
drop policy ur_write on public.user_roles;
create policy ur_write on public.user_roles for all to authenticated
  using (institution_id = public.current_institution_id()
         and public.has_permission('users.manage')
         and (public.is_super_admin()
              or role_id <> (select id from public.roles where code = 'super_admin')))
  with check (institution_id = public.current_institution_id()
         and public.has_permission('users.manage')
         and (public.is_super_admin()
              or role_id <> (select id from public.roles where code = 'super_admin')));
