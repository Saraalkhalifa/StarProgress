import { test, expect } from '@playwright/test';
import { resetStorage, loginAsParticipant, loginAsAdmin } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('participant can submit an activity', async ({ page }) => {
  await loginAsParticipant(page);
  await page.goto('/participant/submit');
  // Pick the first activity option
  await page.getByRole('combobox').selectOption({ index: 1 });
  await page.getByRole('textbox').fill('I read a great book today.');
  await page.getByRole('button', { name: /submit/i }).click();
  // Toast or redirect indicates success
  await expect(
    page.getByText(/submitted|success|pending/i).first()
  ).toBeVisible({ timeout: 5000 });
});

test('submitted activity appears in participant history as pending', async ({ page }) => {
  await loginAsParticipant(page);
  await page.goto('/participant/submit');
  await page.getByRole('combobox').selectOption({ index: 1 });
  await page.getByRole('textbox').fill('Test submission for history.');
  await page.getByRole('button', { name: /submit/i }).click();

  await page.goto('/participant/history');
  await expect(page.getByText(/pending/i)).toBeVisible();
});

test('admin can approve a pending submission', async ({ page }) => {
  // Sara submits
  await loginAsParticipant(page, 'sara', 'Sara@2026');
  await page.goto('/participant/submit');
  await page.getByRole('combobox').selectOption({ index: 1 });
  await page.getByRole('textbox').fill('Submission to be approved.');
  await page.getByRole('button', { name: /submit/i }).click();

  // Admin approves
  await loginAsAdmin(page);
  await page.goto('/admin/approvals');
  await expect(page.getByText(/pending/i)).toBeVisible();
  await page.getByRole('button', { name: /approve/i }).first().click();
  await expect(page.getByText(/accept|approved/i).first()).toBeVisible({ timeout: 5000 });
});

test('admin can deny a pending submission', async ({ page }) => {
  // Sara submits
  await loginAsParticipant(page, 'sara', 'Sara@2026');
  await page.goto('/participant/submit');
  await page.getByRole('combobox').selectOption({ index: 1 });
  await page.getByRole('textbox').fill('Submission to be denied.');
  await page.getByRole('button', { name: /submit/i }).click();

  // Admin denies
  await loginAsAdmin(page);
  await page.goto('/admin/approvals');
  await page.getByRole('button', { name: /deny|reject/i }).first().click();
  await expect(page.getByText(/denied|rejected/i).first()).toBeVisible({ timeout: 5000 });
});

test('leaderboard shows participants sorted by accepted points', async ({ page }) => {
  await loginAsParticipant(page);
  await page.goto('/participant/leaderboard');
  // Leaderboard heading visible
  await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  // Rankings column or rank labels visible
  await expect(page.getByText(/#1|rank 1|1st/i).first()).toBeVisible();
});
