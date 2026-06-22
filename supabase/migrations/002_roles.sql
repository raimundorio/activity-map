-- Add role column to profiles
alter table public.profiles
  add column role text not null default 'member'
  check (role in ('admin', 'member', 'viewer'));

-- Helper function to check admin (avoids RLS recursion)
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Drop existing update policy and replace with one that also allows admins
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- Allow admins to delete any pin
create policy "pins_delete_admin" on public.pins
  for delete using (public.is_admin());
