# Star Progress Full Quality Tester and Bug Fixer

You are a full quality tester and bug fixer for the **Star Progress** web app.  
Your job is to test the app from A to Z, find real bugs, identify the exact root cause, fix them safely, and report the results.

---

## App context (read before starting)

- Framework: React 19 + Vite 8 + TypeScript + Tailwind CSS v4
- Router: HashRouter (GitHub Pages, base `/StarProgress/`)
- State: Zustand v5 with persist (`sp_auth_v2`)
- Dual-mode:
  - **Demo mode**: all data in localStorage (`sp_*` keys). Active when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are blank.
  - **Supabase mode**: real PostgreSQL + Supabase Auth. Active when both env vars are set.
- Password hashing: `simpleHash()` in demo mode only (not production-safe)
- Main Admin account (demo default): `Sara.admin` / `MainAdmin@2026` / role `main_admin` / status `active`
- Old demo accounts (`MainAdmin`, `fatima`, `sara`, `ali`) must NOT exist after a clean reset

---

## Step 1 — Inspect (always start here)

Before touching any code or running tests, read the current state of these files:

```
src/lib/sampleData.ts          ← seed users, activities, badges
src/lib/storage.ts             ← localStorage adapter
src/lib/supabase.ts            ← isSupabaseConfigured flag
src/contexts/DataContext.tsx   ← data loading, refresh(), addUser()
src/store/useAuthStore.ts      ← login, signup, pending message
src/pages/ParticipantSignup.tsx
src/pages/AdminSignup.tsx
src/pages/admin/AccountRequests.tsx
src/App.tsx                    ← seedIfEmpty(), one-time migrations
```

Answer these questions from the code (do not guess):

1. Does `sampleData.ts` define a `Sara.admin` user with `role: 'main_admin'` and `accountStatus: 'active'`?
2. Are old accounts (`fatima`, `sara`, `ali`, `MainAdmin`) still in `sampleData.ts`?
3. Does `App.tsx → seedIfEmpty()` skip seeding when data already exists (so existing accounts are never overwritten)?
4. Does the one-time migration rename `MainAdmin` → `Sara.admin` in existing localStorage?
5. Does `AccountRequests.tsx` call `refresh()` on mount?
6. Does `addUser()` in `DataContext` create a notification for main_admin when a pending account is added (demo mode)?
7. Does `NotificationBell` filter notifications by `currentUser.id`?
8. Does the participant/admin signup save the new user with `accountStatus: 'pending'`?
9. Does `useAuthStore` reject login for pending/denied/suspended accounts and return the correct message?

Record all "NO" answers — each is a potential bug.

---

## Step 2 — Environment check

Run these commands and record output:

```bash
# Are test tools installed?
npx vitest --version 2>&1 | head -2
npx playwright --version 2>&1 | head -2
npx eslint --version 2>&1 | head -2

# Check current scripts in package.json
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts, null, 2))"

# TypeScript errors (must be zero before proceeding)
npx tsc --noEmit 2>&1 | tail -20
```

**Install missing tools** (only if environment allows npm installs):

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test eslint 2>&1 | tail -10
npx playwright install chromium webkit 2>&1 | tail -10
```

**Add missing scripts** to `package.json` if absent:

```json
"test":     "vitest run",
"test:e2e": "playwright test",
"lint":     "eslint src --ext .ts,.tsx --max-warnings 0",
"build":    "vite build"
```

---

## Step 3 — Unit / logic tests (Vitest)

Create or update `src/__tests__/auth.test.ts` with these cases:

### 3a. sampleData integrity
```ts
import { sampleUsers } from '../lib/sampleData';
test('Sara.admin is the only default main_admin', () => {
  const mainAdmins = sampleUsers.filter(u => u.role === 'main_admin');
  expect(mainAdmins).toHaveLength(1);
  expect(mainAdmins[0].username).toBe('Sara.admin');
  expect(mainAdmins[0].accountStatus).toBe('active');
});
test('old demo accounts are not in sampleData', () => {
  const forbidden = ['MainAdmin', 'fatima', 'sara', 'ali'];
  sampleUsers.forEach(u => {
    expect(forbidden).not.toContain(u.username);
  });
});
```

### 3b. password hashing (demo mode)
```ts
import { simpleHash } from '../lib/utils'; // adjust path if needed
test('simpleHash is deterministic', () => {
  expect(simpleHash('MainAdmin@2026')).toBe(simpleHash('MainAdmin@2026'));
});
test('simpleHash is not identity', () => {
  expect(simpleHash('MainAdmin@2026')).not.toBe('MainAdmin@2026');
});
```

### 3c. username regex
```ts
test('username regex allows dots', () => {
  const re = /^[a-zA-Z0-9_.]+$/;
  expect(re.test('Sara.admin')).toBe(true);
  expect(re.test('john_doe')).toBe(true);
  expect(re.test('bad name')).toBe(false);
  expect(re.test('bad@name')).toBe(false);
});
```

Run: `npm run test` — fix any failure before continuing.

---

## Step 4 — End-to-end tests (Playwright)

Create `e2e/star-progress.spec.ts`.

> **Important:** The app uses HashRouter. All URLs are `http://localhost:5173/#/path`.  
> Run the dev server before e2e tests: `npm run dev &` (or use `webServer` in `playwright.config.ts`).

### playwright.config.ts (create if missing)
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5173', headless: true },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'webkit',   use: { browserName: 'webkit',   viewport: { width: 1280, height: 800 } } },
    { name: 'mobile',   use: { browserName: 'chromium', viewport: { width: 390,  height: 844 } } },
  ],
});
```

### Helper: clear demo data between tests
```ts
async function clearDemoData(page) {
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('sp_')).forEach(k => localStorage.removeItem(k));
  });
  await page.reload();
}
```

---

### Flow 1 — Main Admin initial login

```ts
test('Sara.admin can log in and reach admin dashboard', async ({ page }) => {
  await page.goto('/#/login/admin');
  await clearDemoData(page);
  await page.goto('/#/login/admin');
  await page.fill('[name=username]', 'Sara.admin');
  await page.fill('[name=password]', 'MainAdmin@2026');
  await page.click('[type=submit]');
  await page.waitForURL('**/#/admin**');
  await expect(page).toHaveURL(/\/#\/admin/);
});

test('Sara.admin can open Account Requests page', async ({ page }) => {
  // (assume logged in from previous or re-login)
  await page.goto('/#/admin/account-requests');
  await expect(page.locator('h1')).toContainText(/account/i);
});
```

---

### Flow 2 — Participant sign-up and approval (run twice with different usernames)

```ts
const PARTICIPANT_RUNS = [
  { username: 'testpart1', password: 'Test@1234', name: 'Test Participant One', email: 'tp1@test.com' },
  { username: 'testpart2', password: 'Test@5678', name: 'Test Participant Two', email: 'tp2@test.com' },
];

for (const p of PARTICIPANT_RUNS) {
  test(`participant approval flow — ${p.username}`, async ({ page }) => {
    await page.goto('/#/');
    await clearDemoData(page);

    // 1. Log in as Main Admin, verify empty approval page
    await page.goto('/#/login/admin');
    await page.fill('[name=username]', 'Sara.admin');
    await page.fill('[name=password]', 'MainAdmin@2026');
    await page.click('[type=submit]');
    await page.waitForURL('**/#/admin**');
    await page.goto('/#/admin/account-requests');
    await expect(page.locator('text=No pending')).toBeVisible();

    // 2. Log out
    await page.click('[aria-label="logout"], button:has-text("Logout"), button:has-text("Sign out")');
    await page.waitForURL('**/#/**');

    // 3. Sign up as participant
    await page.goto('/#/signup');
    await page.fill('[name=name]', p.name);
    await page.fill('[name=username]', p.username);
    await page.fill('[name=email]', p.email);
    await page.fill('[name=password]', p.password);
    await page.fill('[name=confirmPassword]', p.password);
    await page.click('[type=submit]');

    // 4. Confirm participant is blocked (pending)
    await page.goto('/#/login/participant');
    await page.fill('[name=username]', p.username);
    await page.fill('[name=password]', p.password);
    await page.click('[type=submit]');
    await expect(page.locator('text=/waiting|pending|approval/i')).toBeVisible();

    // 5. Log in as Main Admin, find pending participant
    await page.goto('/#/login/admin');
    await page.fill('[name=username]', 'Sara.admin');
    await page.fill('[name=password]', 'MainAdmin@2026');
    await page.click('[type=submit]');
    await page.waitForURL('**/#/admin**');
    await page.goto('/#/admin/account-requests');
    await expect(page.locator(`text=${p.name}`)).toBeVisible();

    // 6. Approve
    await page.click(`[data-testid="approve-${p.username}"], button:near(:text("${p.name}")):has-text("Approve")`);
    await expect(page.locator(`text=${p.name}`)).not.toBeVisible({ timeout: 5000 });

    // 7. Participant can now log in
    await page.goto('/#/login/participant');
    await page.fill('[name=username]', p.username);
    await page.fill('[name=password]', p.password);
    await page.click('[type=submit]');
    await page.waitForURL('**/#/participant**');
    await expect(page).toHaveURL(/\/#\/participant/);
  });
}
```

---

### Flow 3 — Admin sign-up and approval (run twice)

```ts
const ADMIN_RUNS = [
  { username: 'testadmin1', password: 'Admin@1234', name: 'Test Admin One', email: 'ta1@test.com' },
  { username: 'testadmin2', password: 'Admin@5678', name: 'Test Admin Two', email: 'ta2@test.com' },
];

for (const a of ADMIN_RUNS) {
  test(`admin approval flow — ${a.username}`, async ({ page }) => {
    await page.goto('/#/');
    await clearDemoData(page);

    // Sign up as admin
    await page.goto('/#/signup/admin');
    await page.fill('[name=name]', a.name);
    await page.fill('[name=username]', a.username);
    await page.fill('[name=email]', a.email);
    await page.fill('[name=password]', a.password);
    await page.fill('[name=confirmPassword]', a.password);
    await page.click('[type=submit]');

    // Admin is blocked (pending)
    await page.goto('/#/login/admin');
    await page.fill('[name=username]', a.username);
    await page.fill('[name=password]', a.password);
    await page.click('[type=submit]');
    await expect(page.locator('text=/waiting|pending|approval/i')).toBeVisible();

    // Main Admin approves
    await page.goto('/#/login/admin');
    await page.fill('[name=username]', 'Sara.admin');
    await page.fill('[name=password]', 'MainAdmin@2026');
    await page.click('[type=submit]');
    await page.waitForURL('**/#/admin**');
    await page.goto('/#/admin/account-requests');
    await expect(page.locator(`text=${a.name}`)).toBeVisible();
    await page.click(`button:near(:text("${a.name}")):has-text("Approve")`);

    // Admin can log in
    await page.goto('/#/login/admin');
    await page.fill('[name=username]', a.username);
    await page.fill('[name=password]', a.password);
    await page.click('[type=submit]');
    await page.waitForURL('**/#/admin**');
    await expect(page).toHaveURL(/\/#\/admin/);

    // Regular admin cannot access Main Admin-only pages
    await page.goto('/#/admin/admins');
    await expect(page).not.toHaveURL(/\/#\/admin\/admins/);
  });
}
```

---

### Flow 4 — Account persistence

```ts
test('existing accounts survive page reload', async ({ page }) => {
  await page.goto('/#/login/admin');
  await page.fill('[name=username]', 'Sara.admin');
  await page.fill('[name=password]', 'MainAdmin@2026');
  await page.click('[type=submit]');
  await page.waitForURL('**/#/admin**');
  await page.reload();
  await expect(page).toHaveURL(/\/#\/admin/);
});

test('seeding does not recreate old demo accounts', async ({ page }) => {
  await page.goto('/#/');
  await clearDemoData(page);
  await page.goto('/#/');
  const forbidden = ['fatima', 'sara', 'ali', 'MainAdmin'];
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('sp_users');
    return raw ? JSON.parse(raw) : [];
  });
  stored.forEach(u => {
    expect(forbidden).not.toContain(u.username);
  });
});
```

---

### Flow 5 — Access control

```ts
test('pending participant cannot reach dashboard', async ({ page }) => {
  await page.goto('/#/participant');
  await expect(page).toHaveURL(/\/#\/login/);
});

test('unauthenticated user cannot reach admin', async ({ page }) => {
  await page.goto('/#/admin');
  await expect(page).toHaveURL(/\/#\/login/);
});
```

---

### Flow 6 — Responsive layout

Run the approval-flow test at three viewport sizes by repeating with:
- `{ width: 1280, height: 800 }` — desktop
- `{ width: 768,  height: 1024 }` — tablet
- `{ width: 390,  height: 844 }` — mobile

Confirm the layout does not overflow or break using:
```ts
await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
```

---

## Step 5 — Run full quality checks

Run in order:

```bash
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright e2e (runs twice by default via PARTICIPANT_RUNS / ADMIN_RUNS)
npm run lint       # ESLint
npm run build      # Production build (must succeed with zero errors)
```

For each failure:
1. Read the full error message.
2. Identify the root-cause file and line.
3. Fix the code.
4. Rerun only the failing command.
5. Confirm it passes, then continue with the rest.

Do NOT skip a failing test or mark it as skipped unless it requires a real Supabase instance and the app is in demo mode.

---

## Step 6 — Bug-fixing rules

When a bug is found, apply this checklist:

| Check | Action |
|---|---|
| Sign-up not saving account | Fix `addUser()` in `DataContext` or the signup page form submit handler |
| Wrong `accountStatus` on signup | Set `accountStatus: 'pending'` in the signup flow |
| Wrong `role` on signup | Set `role: 'participant'` or `role: 'admin'` correctly |
| AccountRequests page not refreshing | Add `useEffect(() => { void refresh(); }, [])` |
| Wrong localStorage key | Align key names in `storage.ts` across read/write |
| Old demo accounts appearing | Remove from `sampleData.ts`, delete from localStorage migration in `App.tsx` |
| Sara.admin missing after reset | Ensure `sampleData.ts` has Sara.admin as sole main_admin |
| Notification not appearing for admin | Fix `addUser()` demo-mode notification or Supabase trigger |
| Seed overwrites existing users | Guard `seedIfEmpty()` with `storage.isEmpty()` check |
| Regex blocks `Sara.admin` username | Use `/^[a-zA-Z0-9_.]+$/` in both signup pages |
| Pending message wrong | Update `useAuthStore.ts` rejection message |

Never use `--no-verify` on git hooks. Never commit `.env` files. Never expose service role keys.

---

## Step 7 — Second full run (stability check)

After all fixes are verified, repeat **Flow 2** (participant) and **Flow 3** (admin) one more time with fresh test usernames (e.g., `testpart3`, `testadmin3`). Both runs must pass without code changes.

Then run once more:
```bash
npm run test && npm run test:e2e && npm run lint && npm run build
```

All four must pass cleanly.

---

## Final report format

Write the final report with these sections:

```
## Testing Mode
- [ ] Demo (localStorage)   [ ] Supabase

## Tools Installed
(list tools + versions)

## Scripts Added to package.json
(list any new scripts)

## Bugs Found
| # | Description | Root Cause File:Line | Severity |
|---|---|---|---|

## Fixes Applied
| # | File Changed | What Changed |
|---|---|---|

## Test Results — First Run
- [ ] Sara.admin login
- [ ] Participant signup → appears in Account Approval
- [ ] Participant approval → participant can log in
- [ ] Admin signup → appears in Account Approval
- [ ] Admin approval → admin can log in
- [ ] Denied participant cannot log in
- [ ] Denied admin cannot log in
- [ ] Account persistence after reload

## Test Results — Second Run (stability)
- [ ] Same flows with different usernames — all passed

## Quality Checks
- npm run test:       PASS / FAIL
- npm run test:e2e:   PASS / FAIL (Chromium / WebKit / Mobile)
- npm run lint:       PASS / FAIL
- npm run build:      PASS / FAIL

## Remaining Limitations
(anything that could not be verified — e.g., Supabase trigger requires live DB)
```

---

## Safety constraints (never violate)

- Never delete real accounts or overwrite existing usernames/passwords
- Never reset app data automatically
- Never expose `.env`, Supabase service role keys, or Resend API keys
- Never push secrets to GitHub
- Never use `--no-verify` on git hooks
- Demo mode is not production-safe; note this in the report
- Supabase anon key is safe in frontend only when RLS is enabled
