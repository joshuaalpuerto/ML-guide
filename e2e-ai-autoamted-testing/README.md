# Vision-Powered Form Automation E2E Testing Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Manual testing of web forms is a time-consuming and often error-prone process. Ensuring data integrity and proper form behavior across various scenarios requires significant effort. This framework aims to revolutionize form testing by leveraging the power of Vision Language Models (VLMs) to automate end-to-end (E2E) testing and data validation for web forms.

**Imagine a testing tool that can "see" your forms, understand their structure, and intelligently verify if submitted data matches the form's expected input.** This framework makes that vision a reality.

**Key Benefits:**

*   **Automate Testing of Any Form:**  Works seamlessly with forms built using any web technology (React, Angular, plain HTML, etc.), adapting to diverse UI structures.
*   **Vision-Based Understanding:**  Utilizes VLMs to visually interpret form elements, labels, and layout, mimicking human-like perception.
*   **Intelligent Data Validation:**  Goes beyond simple UI interactions by validating the *meaning* of the data submitted against the form's context.
*   **End-to-End Coverage:**  Automates the entire form testing lifecycle, from navigation and filling to submission and validation.
*   **Reduced Manual Effort:**  Significantly minimizes the need for manual form testing, freeing up QA engineers for more complex tasks.
*   **Enhanced Test Reliability:**  AI-driven validation reduces human error and ensures consistent, repeatable test execution.
*   **Detailed Visual Reports:**  Generates comprehensive HTML reports with screenshots and element highlighting, making it easy to understand test execution and identify issues.

## Key Features

*   **VLM-Powered Form Understanding:**
    *   Analyzes form screenshots using Vision Language Models to identify form fields (text inputs, dropdowns, checkboxes, radio buttons), labels, and associated instructions.
    *   Creates a structured representation of the form, enabling intelligent interaction.

*   **Automated Form Filling:**
    *   Fills form fields automatically based on user-defined data or instructions.
    *   Intelligently determines the appropriate input method for different field types (typing text, selecting options, toggling checkboxes).

*   **Intelligent Data Validation:**
    *   Verifies submitted data against the form's expected structure and values.
    *   Extracts data from the UI after form submission and compares it with expected data for comprehensive validation.
    *   Leverages AI-powered assertions to validate data correctness in a human-understandable way.

*   **End-to-End Testing Focus:**
    *   Designed for E2E testing scenarios, covering complete user workflows involving form interactions.
    *   Automates navigation to forms, form filling, submission, and post-submission validation.

*   **Technology Agnostic:**
    *   Works with web forms built using any frontend framework or technology.
    *   Focuses on visual and semantic understanding, eliminating dependencies on specific framework implementations.

*   **Comprehensive Visual Reporting:**
    *   Generates detailed HTML reports with step-by-step execution logs.
    *   Includes screenshots at each step, visually highlighting interacted form elements.
    *   Provides insights into the AI's reasoning and decision-making process during testing.
    *   Clearly indicates test success or failure with detailed error messages and visual context.

## Technology Stack

*   **Vision Language Model (VLM):**  *(Specify the VLM you are using or recommend, e.g., GPT-4o Vision, Gemini Vision, or a general multimodal model)*
*   **E2E Testing Framework:** Playwright
*   **Automation Library:** Midscene.js *(Core automation and reporting engine)*
*   **Programming Language:** JavaScript/TypeScript

## Getting Started

### Prerequisites

*   **Node.js:** (>= v18) - [https://nodejs.org/](https://nodejs.org/)
*   **npm** or **pnpm** - Package managers for Node.js
*   **API Key (Optional):**  If using a cloud-based VLM service, you may need an API key.

### Basic Usage Example

```typescript
import { test } from '@playwright/test'; // or import { test } from 'puppeteer' if using Puppeteer
import { PlaywrightAiFixtureType, PlaywrightAiFixture } from 'your-framework-package-name'; // Replace with your actual package name

const aiTest = test.extend<PlaywrightAiFixtureType>(PlaywrightAiFixture());

aiTest('Automate form filling and validation', async ({ page, ai, aiAssert }) => {
  await page.goto('https://example-form-url.com'); // Replace with your form URL

  // 1. Fill the form using AI actions
  await ai('Fill in the "Name" field with "John Doe"');
  await ai('Select "Option 2" from the "Dropdown" menu');
  await ai('Check the "Agree to terms" checkbox');

  // 2. Click the submit button (you might need to locate it with AI)
  await ai('Click the "Submit" button');

  // 3. Validate the form submission using AI assertions
  await aiAssert('The confirmation message "Form submitted successfully!" is displayed');
  await aiAssert('The submitted name is displayed as "John Doe" on the confirmation page');

  // Optional: Extract data and validate more complex scenarios with aiQuery
  const confirmationDetails = await aiQuery({
    confirmationMessage: 'text of the confirmation message',
    submittedName: 'name displayed on confirmation page'
  });

  expect(confirmationDetails.confirmationMessage).toContain('Form submitted successfully!');
  expect(confirmationDetails.submittedName).toBe('John Doe');
});
```

### Running the Test

```bash
npx playwright test  # For Playwright
```

or

```bash
node your-test-file.js # If using Puppeteer directly with Node.js
```

After running the test, an HTML report will be generated in the `midscene_run/report` directory, detailing the test execution with screenshots and element highlights.

## Detailed Usage

### Form Element Location

The framework leverages the VLM's visual understanding to locate form elements. You can instruct the AI to find elements using natural language prompts that describe their:

*   **Label Text:**  `await ai('Fill in the "Email Address" field with "test@example.com"');`
*   **Placeholder Text:** `await ai('Enter "Search keywords" in the search box');`
*   **Visual Cues:** `await ai('Click the shopping cart icon in the top right corner');`
*   **Element Type and Context:** `await ai('Select the second option in the dropdown menu');`

The framework automatically translates these prompts into element locators, using a combination of visual analysis and text recognition.

### Data Input

You can provide data for form filling directly within the AI action prompts:

*   **String Literals:** `await ai('Enter "John Doe" in the name field');`
*   **Variables:**

    ```typescript
    const userName = "Jane Smith";
    await ai(`Enter "${userName}" in the name field`);
    ```

*   **Data Structures (for more complex forms):**  *(Illustrate with a more complex example if applicable)*

### Validation Logic

The framework provides powerful AI-driven validation capabilities:

*   **`aiAssert(assertion: string)`:**  Makes natural language assertions about the state of the UI. The VLM interprets the assertion and verifies it visually.

    ```typescript
    await aiAssert('The error message "Invalid email format" is not displayed');
    await aiAssert('The order confirmation page contains the text "Thank you for your order"');
    ```

*   **`aiQuery(demand: any)`:** Extracts data from the UI based on a description. You can then use standard assertion libraries (like `expect` from Playwright or Jest) to validate the extracted data.

    ```typescript
    const orderDetails = await aiQuery({
      orderId: 'Order ID from the confirmation page',
      totalAmount: 'Total amount displayed in bold',
    });

    expect(orderDetails.orderId).toBeDefined();
    expect(orderDetails.totalAmount).toContain('$');
    ```

### Advanced Features (Optional - Expand as needed)

*   **Handling Dynamic Forms:** *(Explain how the framework can adapt to forms that change dynamically, e.g., using retry mechanisms or more robust element location strategies)*
*   **Dealing with CAPTCHAs:** *(Acknowledge limitations and potential workarounds, e.g., manual CAPTCHA solving, integration with CAPTCHA solving services - if feasible)*
*   **Customizable Reporting:** *(Mention if users can customize report generation or integrate with other reporting tools)*
*   **Data-Driven Testing:** *(Briefly describe how to parameterize tests with data from external sources, if supported)*

## Example Test Case (Comprehensive)

Let's consider a more detailed example of testing an online registration form:

```typescript
aiTest('User registration flow', async ({ page, ai, aiAssert, aiQuery }) => {
  await page.goto('https://example-registration-form.com'); // Replace with your registration form URL

  // 1. Fill in user details
  await ai('Enter "testuser" in the "Username" field');
  await ai('Enter "test@example.com" in the "Email" field');
  await ai('Enter "P@$$wOrd123" in the "Password" field');
  await ai('Enter "P@$$wOrd123" in the "Confirm Password" field');
  await ai('Select "United States" from the "Country" dropdown');
  await ai('Check the "Subscribe to newsletter" checkbox');

  // 2. Submit the form
  await ai('Click the "Register" button');

  // 3. Validate registration success
  await aiAssert('The registration success message "Welcome, testuser!" is displayed');
  await aiAssert('The URL changes to "/dashboard"');

  // 4. Extract user profile details from the dashboard
  const profileDetails = await aiQuery({
    welcomeMessage: 'Welcome message on the dashboard',
    userNameDisplay: 'Username displayed in the profile section',
    userEmailDisplay: 'Email address displayed in the profile section',
  });

  expect(profileDetails.welcomeMessage).toContain('Welcome, testuser!');
  expect(profileDetails.userNameDisplay).toBe('testuser');
  expect(profileDetails.userEmailDisplay).toBe('test@example.com');
});
```

**Sample Report Output (Illustrative - You can include a screenshot or a text representation):**

```html
<!-- (Simplified HTML report snippet - in a real report, this would be a full HTML document) -->
<h1>Test Report: User registration flow</h1>
<div class="test-step">
  <h2>Step 1: Navigate to registration form</h2>
  <img src="screenshot-step-1.png" alt="Screenshot of registration form" />
  <p>Action: Navigate to https://example-registration-form.com</p>
  <p>Status: Passed</p>
</div>
<div class="test-step">
  <h2>Step 2: Fill in user details</h2>
  <img src="screenshot-step-2.png" alt="Screenshot of form filling" />
  <p>Action: aiAction - Enter "testuser" in the "Username" field</p>
  <p>Status: Passed</p>
  <!-- ... more form filling steps ... -->
</div>
<div class="test-step">
  <h2>Step 3: Validate registration success</h2>
  <img src="screenshot-step-3.png" alt="Screenshot of confirmation page" />
  <p>Action: aiAssert - The registration success message "Welcome, testuser!" is displayed</p>
  <p>Status: Passed</p>
  <div class="highlighted-element">
    <!-- (Visual highlight of the "Welcome, testuser!" message in the screenshot) -->
  </div>
  <!-- ... more assertions ... -->
</div>
<!-- ... rest of the report ... -->
```

## Reporting Details

The framework generates user-friendly HTML reports that provide a visual and detailed overview of test executions. Reports include:

*   **Step-by-Step Execution Log:**  Clear listing of each test step, including AI actions, queries, and assertions.
*   **Screenshots:** Screenshots captured at each step, providing visual context for test execution.
*   **Element Highlighting:**  Screenshots are enhanced with visual highlights, clearly marking the form elements interacted with during each step.
*   **AI Reasoning:**  Reports often include the "thought process" of the AI, explaining its decisions and actions in natural language.
*   **Assertion Results:**  Clearly indicates whether assertions passed or failed, with detailed error messages for failures.
*   **Timing Information:**  Tracks the execution time for each step and the overall test.

These reports are invaluable for understanding test execution, debugging failures, and providing clear documentation of test results.

## Limitations and Future Work

*   **VLM Accuracy:**  The accuracy of form understanding and data validation depends on the capabilities of the underlying VLM. Complex or visually ambiguous forms may pose challenges.
*   **Handling Complex Forms:**  Very intricate or dynamically generated forms might require more sophisticated prompting or custom logic.
*   **CAPTCHA Challenges:**  Automated CAPTCHA solving is a known challenge. The framework may require manual intervention or integration with CAPTCHA solving services for forms protected by CAPTCHAs.
*   **Performance:**  AI-powered analysis can add overhead to test execution time compared to traditional UI automation.
*   **Model Fine-tuning:**  Future improvements could involve fine-tuning VLMs specifically for form understanding and validation to enhance accuracy and robustness.
*   **Enhanced Reporting:**  Further enhancements to reporting could include more detailed performance metrics, customizable report templates, and integration with test management systems.