# Star Progress Full App Quality Reviewer and Fixer

You are a senior full-stack engineer doing a complete A-to-Z quality review of **Star Progress** — a multi-user Islamic achievement app deployed at `saraalkhalifa.github.io/StarProgress/`.

Your job is to inspect, test, clean, fix, and verify every part of the app. Work methodically through each step below. Never skip a step. Fix bugs as you find them. Report blockers clearly.

---

## Security rules (enforce at all times)

- Never expose `.env`, private keys, service role keys, or SMTP/API secrets
- Never reset the real Supabase database automatically
- Never hard-delete Supabase Auth users unless the user explicitly requests it
- Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- Never commit `.env` files or SMTP credentials
- Never skip git hooks (`--no-verify`)
- Never force-push unless the user explicitly approves

---

## App context

| Attribute | Value |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 |
| Router | HashRouter (GitHub Pages, base `/StarProgress/`) |
| State | Zustand v5 with persist (`sp_auth_v2`) |
| Auth | Supabase Auth (PKCE flow) |
| Email redirect | `VITE_APP_URL/#/auth/callback` |
| Deployment | GitHub Pages via GitHub Actions |

**Dual-mode architecture:**
- **Demo mode** — all data in localStorage (`sp_*` keys). Active when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are blank.
- **Supabase mode** — real PostgreSQL + Supabase Auth. Active when both env vars are set.
- `isSupabaseConfigured` flag in `src/lib/supabase.ts` controls which mode is active.

**Main Admin account:**
- Username: `Mainadmin`
- Email: `sara.alkhalifa288@gmail.com`
- Password: `MainAdmin@2026`
- Role: `main_admin`
- Status: `approved` / `active`

**Old demo accounts that must NOT exist:** `Sara.admin`, `MainAdmin`, `fatima`, `sara`, `ali`

---

## Step 1 — Inspect (always start here)

Read these files before touching any code:

```
src/lib/sampleData.ts             ← seed users, activities, badges
src/lib/storage.ts                ← localStore + supabaseStore adapters
src/lib/supabase.ts               ← isSupabaseConfigured flag
src/contexts/DataContext.tsx      ← softDeleteUser(), restoreUser(), refresh()
src/store/useAuthStore.ts         ← login, signup, email_confirmed_at check, deleted check
src/App.tsx                       ← all routes including /auth/callback, /admin/archived
src/types/index.ts                ← User interface, AccountStatus union
src/pages/AuthCallback.tsx        ← PKCE code exchange (exchangeCodeForSession)
src/pages/ParticipantSignup.tsx   ← emailRedirectTo via VITE_APP_URL
src/pages/AdminSignup.tsx         ← emailRedirectTo via VITE_APP_URL
src/pages/admin/ArchivedUsers.tsx ← Main Admin only, soft-deleted users
src/components/layout/AdminLayout.tsx ← nav includes "Archived" for main_admin only
```

Answer from the code (do not guess):

1. Is `isSupabaseConfigured` true or false in this environment?
2. Does `sampleData.ts` have `Mainadmin` as the sole `main_admin`?
3. Are old demo accounts (`Sara.admin`, `MainAdmin`, `fatima`, `sara`, `ali`) absent from `sampleData.ts`?
4. Are all routes registered in `App.tsx`, including `/auth/callback` and `/admin/archived`?
5. Does `useAuthStore.ts` check `email_confirmed_at` before allowing login in Supabase mode?
6. Does `useAuthStore.ts` block login if `accountStatus === 'deleted'` or `isDeleted === true`?
7. Does `getUsers()` in `storage.ts` filter out `is_deleted=true` rows?
8. Does `getArchivedUsers()` exist in `storage.ts` and return only `is_deleted=true` rows?
9. Does `softDeleteUser()` in `DataContext.tsx` read `currentUser?.id` from Zustand internally?
10. Does `AdminLayout.tsx` show the "Archived" nav item only for `main_admin`?

Record all "NO" answers — each is a potential bug.

---

## Step 2 — Clean demo leftovers

Search for and remove any references to old demo accounts:

```bash
grep -r "Sara\.admin\|MainAdmin\b" src/ --include="*.ts" --include="*.tsx" -l
grep -r '"fatima"\|"sara"\|"ali"' src/lib/sampleData.ts
```

If found in `sampleData.ts` or any seed/migration code, replace with the real Main Admin (`Mainadmin`) or remove entirely. Do not remove references in comments that document what was removed.

---

## Step 3 — Test Main Admin login and capabilities

Login with `Mainadmin` / `MainAdmin@2026`.

Verify:
- [ ] Login succeeds without "pending approval" block
- [ ] Dashboard loads, role displayed as Main Admin
- [ ] Nav shows: Dashboard, Participants, Admins, Activities, Submissions, Leaderboard, **Archived**
- [ ] "Archived" nav item appears ONLY for main_admin (not for regular admin)
- [ ] Can navigate to `/admin/archived` without redirect
- [ ] ArchivedUsers page loads (shows spinner then empty state or list)
- [ ] ArchivedUsers header shows count like "0 archived — 0 participants, 0 admins"

---

## Step 4 — Test participant signup and approval flow

1. Sign up a new participant account with a real email address
2. Success screen must show "Check Your Email" (📧), NOT "Account Pending Approval" (⏳)
3. In Supabase mode: verify the email link arrives and redirects to `/#/auth/callback`
4. `AuthCallback` page handles the PKCE code — shows "Email Verified" then redirects to login
5. Attempt login before email verification → error "Please verify your email before logging in"
6. After email verification and admin approval → login succeeds, participant dashboard loads
7. Unverified participant → login blocked with clear message

---

## Step 5 — Test admin signup and approval flow

1. Sign up a new admin account with a real email address
2. Success screen shows "Check Your Email" (same as participant)
3. In Supabase mode: email link + callback flow works
4. Main Admin approves the new admin
5. Admin logs in, sees admin dashboard
6. Regular admin nav must NOT show "Archived" (main_admin only)
7. Regular admin cannot access `/admin/archived` or `/admin/admins` — redirected away

---

## Step 6 — Test soft delete and archive

**As main_admin:**
1. View Participants list → only active (non-deleted) participants visible
2. Click Remove on a test participant → confirm dialog appears
3. Confirm dialog text: "This participant will be removed from active lists, leaderboards, dashboards, and login access. Their historical records will be kept privately for audit purposes. Are you sure?"
4. Confirm → participant disappears from active list
5. Navigate to Archived Users → deleted participant appears with removal date and "Removed by" name
6. Click Restore → participant reappears in active list, disappears from archive
7. Attempt to delete main_admin via URL manipulation → blocked by RLS or UI guard

**As regular admin:**
1. Can soft-delete a participant → confirm dialog appears, works
2. Remove button does NOT appear for other admins or main_admin
3. Cannot access `/admin/archived` → redirected away
4. Cannot access `/admin/admins` → redirected away

**Confirm dialog for admin removal (Main Admin only):**
"This admin will lose access to admin features. Their previous actions will remain in audit history. Are you sure?"

---

## Step 7 — Test activity management

1. Main Admin creates a new activity (title, description, points, deadline)
2. Activity appears in participant's activity list
3. Admin edits an activity → changes reflect immediately
4. Admin deletes an activity → removed from list
5. Past-deadline activity cannot be submitted by participants

---

## Step 8 — Test activity submission and approval

1. Participant submits an activity (with optional evidence)
2. Submission appears in Admin's pending queue
3. Admin approves → participant's points increase, submission marked accepted
4. Admin rejects → points unchanged, participant sees rejection
5. Admin can un-approve a previously approved submission

---

## Step 9 — Test points and leaderboards

1. Leaderboard shows only active, non-deleted participants
2. Soft-deleted participants do NOT appear (even if they had points before deletion)
3. Points ordered correctly (highest to lowest)
4. Participant's own rank shows correctly on their dashboard
5. After restoring a deleted participant, they reappear on the leaderboard

---

## Step 10 — Test account persistence

1. Log in as any user, close the tab, reopen → still logged in (Zustand persist `sp_auth_v2`)
2. Logout → state cleared, redirected to login
3. Access `/admin/*` while logged out → redirected to login
4. Access participant dashboard while logged out → redirected to login
5. In Supabase mode: session expiry → graceful redirect, no crash

---

## Step 11 — Test language and UI

1. Toggle to Arabic → all visible text switches to Arabic
2. Layout switches to RTL (right-to-left)
3. Toggle back to English → LTR restored, no layout artifacts
4. Check mobile viewport (375px wide) — nav, cards, tables are responsive
5. Check for missing translation keys (raw `t('...')` key strings visible in UI)
6. Confirm all new keys exist: `nav.archived`, `auth.checkEmailTitle`, `auth.checkEmailDesc`, `auth.verifying`, `auth.emailVerified`, `errors.emailNotVerified`, `errors.profileNotFound`

---

## Step 12 — Fix bugs

For each bug found in steps 1–11:

1. Identify the exact file and line number
2. Understand the root cause (do not guess)
3. Write the minimal fix — no unrelated changes
4. Verify the fix does not break adjacent behavior
5. Add a Vitest test if the bug was logic-level

**Common areas to check:**
- `useAuthStore.ts` — `email_confirmed_at` check, `isDeleted`/`deleted` account status check, role-based redirect after login
- `storage.ts` — `.eq('is_deleted', false)` in `getUsers()`, no filter in `findByIdentifier()`, `getArchivedUsers()` returns only deleted
- `DataContext.tsx` — `softDeleteUser` reads `currentUser?.id` from `useAuthStore.getState()` internally
- `App.tsx` — `/auth/callback` route exists, `/admin/archived` wrapped in `<MainAdminRoute>`
- `sampleData.ts` — no old demo credentials, `Mainadmin` is the only main_admin
- `ParticipantSignup.tsx` / `AdminSignup.tsx` — `emailRedirectTo` set to `${VITE_APP_URL}/#/auth/callback`

---

## Step 13 — Run checks

Run all four in sequence. Fix all errors before proceeding:

```bash
npm run lint        # ESLint — zero errors allowed, zero warnings
npx tsc --noEmit    # TypeScript — zero type errors
npm run test        # Vitest — all tests must pass
npm run build       # Production build — must succeed cleanly
```

Expected test files:
- `src/lib/__tests__/emailVerification.test.ts` — 10 tests
- `src/lib/__tests__/softDelete.test.ts` — 18 tests

Do not skip or suppress failing tests. Do not use `// @ts-ignore` to silence errors.

---

## Step 14 — GitHub safety check (before any push)

1. Run `git status` — look for unexpected files
2. Confirm `.env` is in `.gitignore` and NOT staged
3. Scan staged changes for secrets:
   ```bash
   git diff --cached | grep -i "service_role\|smtp_pass\|api_key\|secret\|password"
   ```
4. If anything sensitive appears → remove immediately, do NOT commit
5. Ask the user before pushing: "Ready to push. Confirm?"

---

## Final report format

```
## Star Progress Quality Review — [date]

### Mode
Demo mode / Supabase mode (which was active)

### Inspection results
- Mainadmin is sole main_admin in sampleData: YES / NO
- Old demo accounts absent: YES / NO
- /auth/callback route registered: YES / NO
- /admin/archived route registered: YES / NO
- email_confirmed_at check in login: YES / NO
- Deleted account login block: YES / NO
- is_deleted filter in getUsers(): YES / NO
- getArchivedUsers() exists: YES / NO

### Bugs found and fixed
| File:Line | Bug | Fix Applied |

### Bugs found but NOT fixed (need user input)
(description + why user input is needed)

### Manual test results
- Main Admin login (Mainadmin): ✅ / ❌
- "Archived" nav item (main_admin only): ✅ / ❌
- Participant signup email screen: ✅ / ❌
- Email verification callback (Supabase only): ✅ / ❌ / N/A
- Soft delete participant: ✅ / ❌
- Archived Users page shows deleted user: ✅ / ❌
- Restore from archive: ✅ / ❌
- Regular admin cannot see Archived nav: ✅ / ❌
- Leaderboard excludes deleted users: ✅ / ❌
- Language toggle (EN/AR + RTL): ✅ / ❌
- Mobile responsive: ✅ / ❌

### Quality checks
- npm run lint:      PASS / FAIL (N errors)
- npx tsc --noEmit: PASS / FAIL (N errors)
- npm run test:     PASS / FAIL (N/N tests)
- npm run build:    PASS / FAIL

### Pending manual steps (user must do in Supabase Dashboard)
(list any Supabase Dashboard configuration needed)

### Status
CLEAN / NEEDS FIXES / BLOCKED
```
