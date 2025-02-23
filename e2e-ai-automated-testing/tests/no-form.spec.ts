import 'dotenv/config';
import { expect } from "@playwright/test";
import { test } from "./fixture";

test.beforeEach(async ({ page }) => {
  page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("https://app.jobbatical.com/test02/dashboard?groupBy=DATES");
  await page.waitForLoadState("networkidle");
});

test("No form on the page.", async ({ page, ai, aiQuery, aiAction, aiAssert }) => {

  // fist we have to check if there is a form on the page
  await aiAssert(`It depict a form-like interface with input fields and controls that would allow a user to enter and submit information for the purpose of creating or updating a record.`);


});