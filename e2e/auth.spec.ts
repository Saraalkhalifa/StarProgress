import { test, expect } from '@playwright/test';
import { resetStorage, loginAsParticipant, loginAsAdmin, loginAsMainAdmin } from './helpers';

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test('home page shows login buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /participant/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /admin/i }).first()).toBeVisible();
});

test('participant can log in with username', async ({ page }) => {
  await loginAsParticipant(page, 'sara', 'Sara@2026');
  await expect(page).toHaveURL(/\/participant/);
});

test('participant can log in with second account', async ({ page }) => {
  await loginAsParticipant(page, 'ali', 'ali@2026');
  await expect(page).toHaveURL(/\/participant/);
});

test('admin can log in', async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page).toHaveURL(/\/admin/);
});

test('main admin can log in', async ({ page }) => {
  await loginAsMainAdmin(page);
  await expect(page).toHaveURL(/\/admin/);
});

test('wrong password shows error', async ({ page }) => {
  await page.goto('/login/participant');
  await page.getByPlaceholder('sara').fill('sara');
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
  await page.getByRole('button', { name: /sign in as participant/i }).click();
  await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
});

test('participant cannot access admin route', async ({ page }) => {
  await loginAsParticipant(page);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/participant/);
});

test('participant sign-up creates pending account', async ({ page }) => {
  await page.goto('/signup');
  await page.getByPlaceholder('Your name').fill('Test User');
  await page.getByPlaceholder('e.g. sara_2026').fill('testuser123');
  const passwords = page.getByPlaceholder('••••••••');
  await passwords.first().fill('TestPass@1');
  await passwords.last().fill('TestPass@1');
  await page.getByRole('button', { name: /request account/i }).click();
  // Should show pending confirmation
  await expect(page.getByText(/pending approval/i)).toBeVisible();
});

test('pending account cannot log in', async ({ page }) => {
  // Create pending account first
  await page.goto('/signup');
  await page.getByPlaceholder('Your name').fill('Pending User');
  await page.getByPlaceholder('e.g. sara_2026').fill('pendinguser');
  const passwords = page.getByPlaceholder('••••••••');
  await passwords.first().fill('Pending@123');
  await passwords.last().fill('Pending@123');
  await page.getByRole('button', { name: /request account/i }).click();
  await expect(page.getByText(/pending approval/i)).toBeVisible();

  // Try to login with the pending account
  await page.goto('/login/participant');
  await page.getByPlaceholder('sara').fill('pendinguser');
  await page.getByPlaceholder('••••••••').fill('Pending@123');
  await page.getByRole('button', { name: /sign in as participant/i }).click();
  await expect(page.getByText(/pending|awaiting|approval/i)).toBeVisible();
  await expect(page).not.toHaveURL(/\/participant/);
});

test('log out redirects to home', async ({ page }) => {
  await loginAsParticipant(page);
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL('/');
});
