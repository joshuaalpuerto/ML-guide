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

*   **Vision Language Model (VLM):**  GPT-4o Vision, Gemini 1.5 pro, Fireworks Deepseek v3 or r1 with inline document.
*   **E2E Testing Framework:** Playwright
*   **Automation Library:** Midscene.js *(Core automation and reporting engine)*
*   **Programming Language:** JavaScript/TypeScript

## Getting Started

### Prerequisites

*   **Node.js:** (>= v18) - [https://nodejs.org/](https://nodejs.org/)
*   **pnpm** - Package managers for Node.js
*   **API Key (Optional):**  If using a cloud-based VLM service, you may need an API key.

### Important Note on E2E Testing Principles

While this framework leverages AI to simplify test automation through natural language commands, it's crucial to understand that it still follows fundamental E2E testing principles:

* **Clear Test Objectives:** Each test should have a specific, well-defined goal and expected outcomes, just like traditional E2E tests.
* **Page Understanding:** You must have a clear understanding of the pages and workflows you're testing, including:
  - The expected state of each page
  - The user journey you're validating
  - The critical business flows being tested
* **Test Design:** Tests should still be designed with proper structure:
  - Setup/Preconditions
  - Actions/Steps
  - Assertions/Validations
* **Natural Language Advantage:** The main benefit is the ability to express these traditional E2E testing concepts using natural language, making tests more maintainable and readable while reducing the technical complexity of test implementation.

#### Example: Writing Specific Test Instructions

Let's compare vague vs. specific test instructions for an e-commerce checkout flow:

❌ **Bad Example (Too Vague):**
```typescript
aiTest('Test checkout flow', async ({ page, ai, aiAssert }) => {
  await page.goto('https://example-shop.com');
  
  // Vague instructions that lack context and specificity
  await ai('Add item to cart');
  await ai('Go to checkout');
  await ai('Fill in the form');
  await ai('Complete payment');
  
  await aiAssert('Order is successful');
});
```

✅ **Good Example (Specific & Context-Aware):**
```typescript
aiTest('Complete purchase of a specific product with credit card payment', async ({ page, ai, aiAssert }) => {
  // Clear test objective and preconditions
  await page.goto('https://example-shop.com/products/wireless-headphones');
  
  // Specific actions with clear context
  await ai('Verify we are on the wireless headphones product page by checking for the product title "Sony WH-1000XM4"');
  await ai('Select "Black" from the color options dropdown below the product image');
  await ai('Click the "Add to Cart" button located next to the price');
  await ai('Click the cart icon in the top-right corner of the navigation bar');
  
  // Validate intermediate states
  await aiAssert('The cart modal shows "Sony WH-1000XM4 (Black)" with quantity 1');
  
  // Continue with specific checkout steps
  await ai('Click the "Proceed to Checkout" button at the bottom of the cart modal');
  await ai(`Fill in the shipping form with:
    - Email: "test@example.com" in the email field at the top
    - Full Name: "John Doe" in the name field
    - Address: "123 Test St" in the street address field
    - City: "San Francisco" in the city field
    - Select "California" from the state dropdown
    - ZIP: "94105" in the postal code field`);
  
  // Payment section with clear location context
  await ai(`In the payment section below shipping:
    - Enter "4111 1111 1111 1111" in the card number field
    - Enter "12/25" in the expiration date field
    - Enter "123" in the CVV field`);
  
  await ai('Click the "Place Order" button at the bottom of the checkout page');
  
  // Specific assertions
  await aiAssert('The order confirmation page shows "Order Successfully Placed!"');
  await aiAssert('The order summary shows "Sony WH-1000XM4 (Black)" with the correct price');
  await aiAssert('A valid order number is displayed in the format "ORD-XXXXX"');
});
```

The good example demonstrates:
- Clear understanding of the page layout and elements
- Specific element locations and context
- Step-by-step workflow with validations
- Detailed form field locations and data
- Precise expected outcomes
- Breaking down complex actions into single, focused steps

### Running the Test

```bash
npx test:ui  # Run test with playwright UI mode
```

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

## Limitations and Future Work

* 
*   **VLM Accuracy:**  The accuracy of form understanding and data validation depends on the capabilities of the underlying VLM. Complex or visually ambiguous forms may pose challenges.
*   **Handling Complex Forms:**  Very intricate or dynamically generated forms might require more sophisticated prompting or custom logic.
*   **CAPTCHA Challenges:**  Automated CAPTCHA solving is a known challenge. The framework may require manual intervention or integration with CAPTCHA solving services for forms protected by CAPTCHAs.
*   **Performance:**  AI-powered analysis can add overhead to test execution time compared to traditional UI automation.
*   **Model Fine-tuning:**  Future improvements could involve fine-tuning VLMs specifically for form understanding and validation to enhance accuracy and robustness.
*   **Enhanced Reporting:**  Further enhancements to reporting could include more detailed performance metrics, customizable report templates, and integration with test management systems.

## Prompting tips

The natural language parameter passed to Midscene will be part of the prompt sent to the AI model. There are certain techniques in prompt engineering that can help improve the understanding of user interfaces.

### The purpose of optimization is to get a stable response from AI

Since AI has the nature of heuristic, the purpose of prompt tuning should be to obtain stable responses from the AI model across runs. In most cases, to expect a consistent response from LLM by using a good prompt is entirely feasible.

### Use detailed descriptions and samples

Detailed descriptions and examples are always welcome.

For example: 

Bad ❌: "Search 'headphone'"

Good ✅: "Click the search box (it should be along with a region switch, such as 'domestic' or 'international'), type 'headphone', and hit Enter."

Bad ❌: "Assert: food delivery service is in normal state"

Good ✅: "Assert: There is a 'food delivery service' on page, and is in normal state"

### One prompt should only do one thing

Use `.ai` each time to do one task. It's still preferable to keep the prompt concise. Otherwise the LLM output will likely be messy. The token cost between a long prompt and a short prompt is almost the same.

Bad ❌: "Click Login button, then click Sign up button, fill the form with 'test@test.com' in the email field, 'test' in the password field, and click Sign up button"

Good ✅: Split the task into three steps:

"Click Login Button"
"Click Sign up button"
"Fill the form with 'test@test.com' in the email field, 'test' in the password field, and click Sign up button"

#### Understand the reason why AI is wrong, and optimize the prompt

This prompt may cause the click to fail:

⚠️ Click the "include" in the "range" dropdown menu

After checking the report, you will find that the AI may tend to open the floating layer first, and then find the "include" option. If the floating layer is already open, you can try:

✅ The floating layer is open, please click the "include" option

Another example:

This may fail when there are many "Add" buttons on the page, or the button is an icon button:

⚠️ Click the "Add" button

You can try:

✅ Click the "Add" button on the top-right corner, it's a button with a "+" icon, on the right side of the "range" dropdown menu

If the button is too large, the AI may misjudge the clickable range:

⚠️ Click the "User Register" menu

You can try:

✅ Click the "User Register" text in the left menu

#### LLMs can NOT tell the exact number like coords or hex-style color, give it some choices

For example:

Good ✅: "string, color of text, one of blue / red / yellow / green / white / black / others"

Bad ❌: "string, hex value of text color"

Bad ❌: "[number, number], the [x, y] coords of the main button"


### Infer or assert from the interface, not the DOM properties or browser status

All the data sent to the LLM is in the form of screenshots and element coordinates. The DOM and the browser instance are almost invisible to the LLM. Therefore, ensure everything you expect is visible on the screen.

Good ✅: The title is blue

Bad ❌: The title has a `test-id-size` property

Bad ❌: The browser has two active tabs

Bad ❌: The request has finished.

### Cross-check the result using assertion

LLM could behave incorrectly. A better practice is to check its result after running.

For example, you can check the list content of the to-do app after inserting a record.

```typescript
await ai('Enter "Learning AI the day after tomorrow" in the task box, then press Enter to create');

// check the result
const taskList = await aiQuery<string[]>('string[], tasks in the list');
expect(taskList.length).toBe(1);
expect(taskList[0]).toBe('Learning AI the day after tomorrow');
```
