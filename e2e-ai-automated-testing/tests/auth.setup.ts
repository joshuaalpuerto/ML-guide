import dotenv from "dotenv";
import { test as setup, expect } from '@playwright/test';
import path from 'path';

// read and parse .env file
const result = dotenv.config({
  debug: true,
});
if (result.error) {
  throw result.error;
}

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const username: string = process.env.USERNAME || '';
  const password: string = process.env.PASSWORD || '';

  // Perform authentication steps. Replace these actions with your own.
  await page.goto('https://app.jobbatical.com/test02/cases/67a1fa2f2b40394dff47abe5/details');
  await page.getByLabel('Email').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByLabel('Log in').click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL('https://app.jobbatical.com/test02/cases/67a1fa2f2b40394dff47abe5/details');

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});