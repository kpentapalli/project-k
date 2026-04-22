# Project K — Fix Log

---

## F001 — Vite scaffold couldn't run interactively
**Problem:** `npm create vite` requires an interactive terminal, cancelled in non-TTY shell.  
**Fix:** Built the project structure manually (package.json, vite.config.js, src files) instead of using the scaffold CLI.

---

## F002 — Schema SQL failed with "relation already exists"
**Problem:** Running `schema.sql` failed because some tables already existed from a prior partial run.  
**Fix:** Updated all `CREATE TABLE` statements to `CREATE TABLE IF NOT EXISTS`, added `DROP POLICY IF EXISTS` before every `CREATE POLICY`, and `DROP TRIGGER IF EXISTS` before the trigger.

---

## F003 — Admin promotion SQL failed with invalid UUID
**Problem:** Ran `update profiles set role = 'admin' where id = 'kpentapalli'` — used username instead of UUID.  
**Fix:** Rewrote query to look up by email: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'kpentapalli@gmail.com');`

---

## F004 — Login failed with "Invalid username or token"
**Problem:** GitHub no longer accepts passwords for git push — requires a Personal Access Token or GitHub CLI.  
**Fix:** User pushed using token as password. Git push succeeded.

---

## F005 — Could not log into the app with Supabase dashboard credentials
**Problem:** Supabase dashboard login credentials don't work for app auth. No auth user existed in the project.  
**Fix:** Created user via Supabase → Authentication → Users → Add User with the correct email and a new password.

---

## F006 — Intake form reset after clicking "Submit & Get Started"
**Root cause 1:** Profile row didn't exist (trigger didn't fire for users created via Supabase dashboard), so the `update` call silently failed.  
**Root cause 2:** After successful update, the profile in AuthContext wasn't refreshed, so `ProtectedRoute` still saw `intake_completed: false` and redirected back to `/intake`.  
**Fix:**
- Changed `update` to `upsert` with the user's id so the row is created if it doesn't exist
- Added `refreshProfile()` to AuthContext and called it after successful intake submission before navigating to `/dashboard`
- Changed error message to show actual Supabase error for easier debugging

---

## F007 — Intake upsert blocked by RLS ("new row violates row-level security policy")
**Problem:** No `INSERT` policy existed on the `profiles` table. Upsert tried to insert a new row and was blocked.  
**Fix:** Added policy in Supabase SQL Editor:
```sql
create policy "users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());
```

---

## F008 — Admin tab showed no users
**Problem:** Admin dashboard query filtered `role = 'user'` only, so the admin user (Kalyan) didn't appear.  
**Fix:** Removed the `.eq('role', 'user')` filter so all profiles are shown.

---

## F009 — 8 programs shown instead of 4
**Problem:** `scripts/seed.js` was run twice, creating duplicate programs.  
**Fix:** Ran SQL to delete duplicates, keeping the oldest copy of each program:
```sql
delete from public.programs
where id not in (
  select min(id::text)::uuid
  from public.programs
  group by name
);
```

---

## F010 — App redirected to intake form on every page refresh
**Root cause:** Race condition in `ProtectedRoute`. On refresh, the session loaded before the profile fetch completed. With `profile = null`, `isAdmin` and `intakeCompleted` were both `false`, triggering a redirect to `/intake`.  
**Fix:** Changed `profile` initial state from `null` to `undefined`. Updated `loading` condition to also wait for profile:
```javascript
const loading = session === undefined || (session !== null && profile === undefined)
```
This keeps the app in a loading state until both session and profile are fully resolved before any routing decisions are made.

---

## F011 — Admin role overwritten by intake upsert
**Problem:** When the intake form upserted the profile row (which didn't exist), it used the default role `'user'`, overwriting the previously set `'admin'` role (which had actually updated 0 rows since the profile didn't exist yet at that point).  
**Fix:** Re-ran the admin promotion SQL after the profile row was created by the intake upsert:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'kpentapalli@gmail.com');
```

---

## F015 — Auth emails linking to localhost instead of Vercel app
**Problem:** Password reset and invite emails sent to users contained `localhost` links, making them unusable.  
**Root cause:** Supabase defaults the Site URL to `http://localhost:5173` (Vite's dev server).  
**Fix:** In Supabase → Authentication → URL Configuration:
- Set **Site URL** to `https://project-k-ten-mu.vercel.app`
- Add `https://project-k-ten-mu.vercel.app/**` to **Redirect URLs**

---

## F013 — Feedback button: feedback table missing
**Problem:** After deploying the feedback button, submitting feedback failed because the `feedback` table didn't exist in Supabase yet.  
**Fix:** Added SQL to create the table with RLS policies (insert for all authenticated users, select for admin only). Run in Supabase SQL Editor.

---

## F014 — Intake form appearing on every login
**Problem:** After signing in, `navigate('/')` fired immediately before the profile finished loading from Supabase. ProtectedRoute briefly saw `profile = null` → `isAdmin = false` → `intakeCompleted = false` → redirected to `/intake`.  
**Fix:** Removed `navigate('/')` from the login submit handler. Added a `useEffect` in Login.jsx that navigates only after both `session` and `profile` are fully loaded (i.e., `!authLoading && session && profile !== undefined`).

---

## F012 — Duplicate program assignment on SQL insert
**Problem:** A program assignment already existed for the admin user. Running an `INSERT` hit the unique constraint on `user_id`.  
**Fix:** Used `UPDATE` instead of `INSERT`:
```sql
update public.program_assignments
set program_id = (select id from public.programs where name = 'The 6-Week Cut'),
    start_date = current_date
where user_id = (select id from auth.users where email = 'kpentapalli@gmail.com');
```
