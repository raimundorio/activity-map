-- Groups (orgs/teams)
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text not null default '#3b82f6',
  created_at timestamptz default now()
);

-- Profiles (one per auth user)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz default now()
);

-- Pins
create table public.pins (
  id uuid default gen_random_uuid() primary key,
  lat double precision not null,
  lng double precision not null,
  title text not null,
  description text,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Attachments
create table public.attachments (
  id uuid default gen_random_uuid() primary key,
  pin_id uuid references public.pins(id) on delete cascade not null,
  type text check (type in ('image', 'video', 'file', 'link')) not null,
  url text not null,
  name text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.pins enable row level security;
alter table public.attachments enable row level security;

-- Groups: public read
create policy "groups_read_public" on public.groups for select using (true);

-- Profiles: public read, own write
create policy "profiles_read_public" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Pins: public read, authenticated insert (own), own delete
create policy "pins_read_public" on public.pins for select using (true);
create policy "pins_insert_own" on public.pins for insert with check (auth.uid() = user_id);
create policy "pins_delete_own" on public.pins for delete using (auth.uid() = user_id);

-- Attachments: public read, insert if pin owner, delete if pin owner
create policy "attachments_read_public" on public.attachments for select using (true);
create policy "attachments_insert_pin_owner" on public.attachments for insert
  with check (auth.uid() = (select user_id from public.pins where id = pin_id));
create policy "attachments_delete_pin_owner" on public.attachments for delete
  using (auth.uid() = (select user_id from public.pins where id = pin_id));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Supabase Storage bucket for pin attachments (run in Supabase Dashboard > Storage)
-- insert into storage.buckets (id, name, public) values ('pin-attachments', 'pin-attachments', true);
