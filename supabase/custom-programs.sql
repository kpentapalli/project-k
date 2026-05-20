-- Custom Programs — user-created blank-slate programs
-- Run once in Supabase SQL Editor.

-- 1. Extend programs table with owner tracking
alter table public.programs
  add column if not exists owner_id        uuid references public.profiles(id) on delete cascade,
  add column if not exists is_user_created boolean not null default false;

-- 2. Replace programs SELECT: active admin programs OR user's own custom programs
drop policy if exists "authenticated users read active programs" on public.programs;
create policy "authenticated users read active programs"
  on public.programs for select
  using (
    auth.uid() is not null
    and (
      (is_active = true and not is_user_created)
      or (is_user_created and owner_id = auth.uid())
      or public.is_admin()
    )
  );

-- 3. Users can create their own custom programs
drop policy if exists "users create own programs" on public.programs;
create policy "users create own programs"
  on public.programs for insert
  with check (
    is_user_created = true
    and owner_id = auth.uid()
  );

-- 4. Users can update their own custom programs (to add/remove exercises)
drop policy if exists "users update own programs" on public.programs;
create policy "users update own programs"
  on public.programs for update
  using (is_user_created = true and owner_id = auth.uid());

-- 5. Users can delete their own custom programs
drop policy if exists "users delete own programs" on public.programs;
create policy "users delete own programs"
  on public.programs for delete
  using (is_user_created = true and owner_id = auth.uid());

-- 6. Users can self-assign (required for custom program activation)
drop policy if exists "users self-assign programs" on public.program_assignments;
create policy "users self-assign programs"
  on public.program_assignments for insert
  with check (user_id = auth.uid());

-- 7. Users can update their own assignments (mark active → completed on switch)
drop policy if exists "users update own assignment" on public.program_assignments;
create policy "users update own assignment"
  on public.program_assignments for update
  using (user_id = auth.uid());
