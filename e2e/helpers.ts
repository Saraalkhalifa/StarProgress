import { Page } from '@playwright/test';

/** Reset localStorage so each test starts with clean demo seed. */
export async function resetStorage(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sp_'))
      .forEach(k => localStorage.removeItem(k));
  });
  await page.reload();
}

export async function loginAsParticipant(page: Page, username = 'sara', password = 'Sara@2026') {
  await page.goto('/login/participant');
  await page.getByPlaceholder('sara').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /sign in as participant/i }).click();
  await page.waitForURL('**/participant');
}

export async function loginAsAdmin(page: Page, username = 'fatima', password = 'Admin@2026') {
  await page.goto('/login/admin');
  await page.getByPlaceholder('fatima').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /sign in as admin/i }).click();
  await page.waitForURL('**/admin');
}

export async function loginAsMainAdmin(page: Page) {
  await loginAsAdmin(page, 'MainAdmin', 'MainAdmin@2026');
}
