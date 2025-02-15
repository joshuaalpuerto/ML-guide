import { test, expect } from '../fixtures/ai-fixture';

test.describe('User Registration Flow', () => {
  test('should successfully register a new user', async ({ page, ai, aiAssert, aiQuery }) => {
    // Navigate to the registration page
    await page.goto('/register');

    // Fill in the registration form using AI
    await ai('Enter "testuser" in the "Username" field');
    await ai('Enter "test@example.com" in the "Email" field');
    await ai('Enter "P@$$w0rd123" in the "Password" field');
    await ai('Enter "P@$$w0rd123" in the "Confirm Password" field');
    await ai('Check the "Terms and Conditions" checkbox');

    // Submit the form
    await ai('Click the "Register" button');

    // Verify registration success
    await aiAssert('The success message "Registration successful" is displayed');

    // Extract and verify user details
    const userDetails = await aiQuery({
      username: 'Username displayed in the welcome message',
      email: 'Email address shown in the profile section'
    });

    expect(userDetails.username).toBe('testuser');
    expect(userDetails.email).toBe('test@example.com');
  });
}); 