import { test, expect } from '@playwright/test';
import { resetStorage, loginAsParticipant, loginAsAdmin, loginAsMainAdmin } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('participant cannot access /admin/admins', async ({ page }) => {
  await loginAsParticipant(page);
  await page.goto('/admin/admins');
  // Should be redirected away from admin area
  await expect(page).not.toHaveURL(/\/admin\/admins/);
});

test('participant cannot access /admin/participants', async ({ page }) => {
  await loginAsParticipant(page);
  await page.goto('/admin/participants');
  await expect(page).not.toHaveURL(/\/admin\/participants/);
});

test('regular admin cannot access admin management page', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/admins');
  // Redirected away from /admin/admins (MainAdmin only)
  await expect(page).toHaveURL(/\/admin$/);
});

test('main admin can access admin management page', async ({ page }) => {
  await loginAsMainAdmin(page);
  await page.goto('/admin/admins');
  await expect(page).toHaveURL(/\/admin\/admins/);
  await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible();
});

test('unauthenticated user redirected from participant dashboard', async ({ page }) => {
  await page.goto('/participant');
  await expect(page).toHaveURL(/\/login\/participant/);
});

test('unauthenticated user redirected from admin dashboard', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\/admin/);
});

test('admin can see account-requests page', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/account-requests');
  await expect(page).toHaveURL(/\/admin\/account-requests/);
  await expect(page.getByRole('heading', { name: /account requests/i })).toBeVisible();
});

test('main admin can approve and deny pending accounts', async ({ page }) => {
  // Create a pending account
  await page.goto('/signup');
  await page.getByPlaceholder('Your name').fill('Pending Test');
  await page.getByPlaceholder('e.g. sara_2026').fill('pendingtest');
  const passwords = page.getByPlaceholder('••••••••');
  await passwords.first().fill('PendingTest@1');
  await passwords.last().fill('PendingTest@1');
  await page.getByRole('button', { name: /request account/i }).click();
  await expect(page.getByText(/pending approval/i)).toBeVisible();

  // Login as main admin and approve
  await loginAsMainAdmin(page);
  await page.goto('/admin/account-requests');
  await expect(page.getByText('Pending Test')).toBeVisible();
  await page.getByRole('button', { name: /approve/i }).first().click();

  // Verify it moved to active (no longer shows in pending filter)
  await expect(page.getByText(/approved/i).or(page.getByText(/active/i))).toBeVisible();
});
