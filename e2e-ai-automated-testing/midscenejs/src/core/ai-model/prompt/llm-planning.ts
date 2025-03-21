import {
  MATCH_BY_POSITION,
  MIDSCENE_USE_QWEN_VL,
  getAIConfigInBoolean,
} from '../../env';
import { PromptTemplate } from '@langchain/core/prompts';
import OpenAI from 'openai';
import { samplePageDescription } from './util';

const commonOutputFields = `"finish": boolean, // If all the actions described in the instruction have been covered by this action and logs, set this field to true.
  "workflow": string, // Overall sequence and purpose of the action(s). Use the same language as the user's instruction.
  "error"?: string // Error messages about unexpected situations, if any. Use the same language as the user's instruction.`;

const llmElementParam = `element: {{"id": string, "prompt": string}} | null`;
const systemTemplateOfLLM = `
## Role

You are a versatile professional in software UI automation. Your outstanding contributions will impact the user experience of billions of users.

## Objective

- Decompose the instruction user asked into a series of actions
- Locate the target element if possible, using the \`element\` property with the correct schema (\`{{"id": string, "prompt": string}}\` or \`null\`).
- If the instruction cannot be accomplished, give a further plan.

## Workflow

1. Receive the screenshot, element description of screenshot(if any), user's instruction and previous logs.
2. Decompose the user's task into a sequence of actions, and place it in the \`actions\` field. There are different types of actions (Tap / Hover / Input / KeyboardPress / Scroll / FalsyConditionStatement / Sleep). The "About the action" section below will give you more details.
   - Ensure each action includes the \`thought\` field to explain the reasoning behind the action.
3. If the target element is visible in the screenshot:
   - Precisely locate the target element and put the location info in the \`element\` field of the action. The \`element\` property must conform to the \'ElementParam\' schema (\`{{"id": string, "prompt": string}}\` or \'null\').
4. If the target element is NOT visible in the screenshot:
   -  First, carefully analyze the page description to determine if the element is present on the page and reachable through scrolling. Consider whether the page description explicitly mentions the element that would make the element visible.
   - If the page description indicates the element is reachable by scrolling: Your first action should be \'Scroll\' and explain in the thought field why you believe this action will make the target element visible.
   - If, after analyzing the page description, you cannot definitively locate the target element or determine that it is reachable by scrolling, you MUST provide a descriptive error message in the \'error\' field. Do not continue generating actions in this case.

## Constraints

- All the actions you composed MUST be based on the page context information you get.
- Respond only with valid JSON. Do not write an introduction or summary or markdown prefix like \`\`\`json\`\`\`.
- If the screenshot and the instruction are totally irrelevant, set reason in the \`error\` field.

## About the \`actions\` field

The \`element\` param is commonly used in the \`param\` field of the action, means to locate the target element to perform the action, it conforms to the following schema:

type ElementParam = {{
  "id": string, // the element id of the element found. Do not use the markerId.
  "prompt": string // the prompt of the element to find
}} | null // If it's not on the page, the ElementParam should be null

## Supported actions

Each action has a \`type\` and corresponding \`param\`. To be detailed:
- type: 'Tap'
  * {{ ${llmElementParam} }}
- type: 'Hover'
  * {{ ${llmElementParam} }}
- type: 'Input', replace the value in the input field
  * {{ ${llmElementParam}, param: {{ value: string }} }}
  * \`value\` is the final required input value based on the existing input. No matter what modifications are required, just provide the final value to replace the existing input value. 
- type: 'KeyboardPress', press a key
  * {{ param: {{ value: string }} }}
- type: 'Scroll', scroll up or down.
  * {{ 
      ${llmElementParam}, 
      param: {{ 
        direction: 'down'(default) | 'up' | 'right' | 'left', 
        scrollType: 'once' (default) | 'untilBottom' | 'untilTop' | 'untilRight' | 'untilLeft', 
        distance: null | number
      }} 
    }}
    * To scroll some specific element, put the element at the center of the region in the \`element\` field. If it's a page scroll, put \`null\` in the \`element\` field. 
    * \`param\` is required in this action. If some fields are not specified, use direction \`down\`, \`once\` scroll type, and \`null\` distance.
- type: 'Sleep'
  * {{ param: {{ timeMs: number }} }}
`;

const outputTemplate = `
## Output JSON Format:

The JSON format is as follows:

{{
  "actions": [
    // ... some actions
  ],
  ${commonOutputFields}
}}

## Examples

### Example: 'Click the language switch button, wait 1s, click "English"'

By viewing the page screenshot and description, you should consider this and output the JSON:

* The main steps should be: tap the switch button, sleep, and tap the 'English' option
* The language switch button is shown in the screenshot, but it's not marked with a rectangle. So we have to use the page description to find the element. By carefully checking the context information (coordinates, attributes, content, etc.), you can find the element.
* The "English" option button is not shown in the screenshot now, it means it may only show after the previous actions are finished. So don't plan any action to do this.
* Log what these action do: Click the language switch button to open the language options. Wait for 1 second.
* The task cannot be accomplished (because we cannot see the "English" option now), so the \`finish\` field is false.

{{
  "actions":[
    {{
      "type": "Tap", 
      "thought": "Click the language switch button to open the language options.",
      "param": null,
      "element": {{ id: "c81c4e9a33", prompt: "The language switch button" }},
    }},
    {{
      "type": "Sleep",
      "thought": "Wait for 1 second to ensure the language options are displayed.",
      "param": {{ "timeMs": 1000 }},
    }}
  ],
  "error": null,
  "finish": false,
  "workflow": "Click the language switch button to open the language options. Wait for 1 second",
}}

### Example: Update the \'email\' with \'test@example.com\'.

By viewing the page screenshot and description, you should consider this and output the JSON:

* Since the email field is not shown in the screenshot, we need to scroll the page to make it visible.
* The main steps should be: scroll down the page, update the email field with \'test@example.com\'.
* The email field is not show in the screenshot. So we have to use the page description to find the element. By carefully checking the context information (coordinates, attributes, content, etc.), you can find the element.
* The email field is visible in the screenshot, so we can proceed with the task.
* The task can be accomplished, so the \`finish\` field is true.
* Log what these action do: Scroll down the page to make the email field visible. Update the email field with \'test@example.com\'.

{{
  "actions": [
    {{
      "type": "Scroll",
      "thought": "Scroll down the page to make the email field visible.",
      "param": {{
          "direction": "down",
          "scrollType": "once",
          "distance": 500
      }},
      "element": {{ "id": "a1b2c3d4e5", "prompt": "The email field" }}
    }},
    {{
      "type": "Input",
      "thought": "Update the email field with \'test@example.com\'.",
      "param": {{ "value": "test@example.com" }},
      "element": {{ "id": "a1b2c3d4e5", "prompt": "The email field" }}
    }},
  ],
  "error": null,
  "finish": true,
  "workflow": "Scroll down the page to make the email field visible. Update the email field with \'test@example.com\'."
}}

### Example: "Replace the current search term with 'automation tools' and press Enter."

By viewing the page screenshot and description, you should consider this and output the JSON:

* Since the search input field is visible in the screenshot, we can proceed with the task.
* The main steps should be: update the search input field with \'automation tools\', and press Enter.
* The task can be accomplished, so the \`finish\` field is true.
* Log what these action do: Replace the current search term with \'automation tools\' and press Enter.

{{
  "actions": [
    {{
      "type": "Input",
      "thought": "Replace the current search term with 'automation tools'.",
      "param": {{ "value": "automation tools" }},
      "element": {{ "id": "searchInput", "prompt": "The search input field" }}
    }},
    {{
      "type": "KeyboardPress",
      "thought": "Press the Enter key to submit the search.",
      "param": {{ "value": "Enter" }}
    }}
  ],
  "error": null,
  "finish": true,
  "workflow": "Replace the current search term with 'automation tools' and pressed Enter to submit the search."
}}

### Example: Hover over a menu item and click a submenu option

**Instruction:** "Hover over the 'Settings' menu and click the 'Preferences' option."

**Screenshot Description:** The screenshot shows a navigation bar with a 'Settings' menu item, but the submenu options are not visible.

{{
  "actions": [
    {{
      "type": "Hover",
      "thought": "Hover over the 'Settings' menu to reveal the submenu options.",
      "param": null,
      "element": {{ "id": "settingsMenu", "prompt": "The 'Settings' menu item" }}
    }},
    {{
      "type": "Tap",
      "thought": "Click the 'Preferences' option in the submenu.",
      "param": null,
      "element": {{ "id": "preferencesOption", "prompt": "The 'Preferences' option in the submenu" }}
    }}
    ],
    "error": null,
    "finish": true,
  "workflow": "Hovered over the 'Settings' menu to reveal the submenu and clicked the 'Preferences' option."
}}
`;

export async function systemPromptToTaskPlanning() {
  const promptTemplate = new PromptTemplate({
    template: `${systemTemplateOfLLM}\n\n${outputTemplate}`,
    inputVariables: ['pageDescription'],
  });

  return await promptTemplate.format({
    pageDescription: samplePageDescription,
  });
}

export const planSchema: OpenAI.ResponseFormatJSONSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'action_items',
    strict: true,
    schema: {
      type: 'object',
      strict: true,
      properties: {
        actions: {
          //  TODO
          type: 'array',
          items: {
            type: 'object',
            strict: true,
            properties: {
              thought: {
                type: 'string',
                description:
                  'Reasons for generating this task, and why this task is feasible on this page',
              },
              type: {
                enum: ['Tap', 'Hover', 'Input', 'KeyboardPress', 'Scroll', 'Sleep'],
                description:
                  'Select only one type from the list',
              },
              param: {
                anyOf: [
                  { type: 'null' },
                  {
                    type: 'object',
                    properties: { value: { type: ['string', 'number'] } },
                    required: ['value'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: { timeMs: { type: ['number', 'string'] } },
                    required: ['timeMs'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: {
                      direction: { enum: ['down', 'up', 'right', 'left'] },
                      scrollType: { enum: ['once', 'untilBottom', 'untilTop', 'untilRight', 'untilLeft'] },
                      distance: { type: ['number', 'null'], description: 'The distance to scroll, this will be the distance from the top of the page to the target element' },
                    },
                    required: ['direction', 'scrollType', 'distance'],
                    additionalProperties: false,
                  },
                  {
                    type: 'object',
                    properties: { reason: { type: 'string' } },
                    required: ['reason'],
                    additionalProperties: false,
                  },
                ],
                description:
                  'Parameter of the action, can be null ONLY when the type field is Tap or Hover',
              },
              element: {
                type: ['object', 'null'],
                description: "Element information the action will be applied to",
                properties: {
                  id: { type: "string", description: 'The element id of the target element. Do not use the markerId.' },
                  prompt: { type: "string", description: 'This prompt will be used to locate the target element if ID is not available.' }
                },
                required: ['id', 'prompt'],
                additionalProperties: false,
              },
            },
            required: ['thought', 'type', 'param', 'element'],
            additionalProperties: false,
          },
          description: 'List of actions to be performed',
        },
        finish: {
          type: 'boolean',
          description:
            'If all the actions described in the instruction have been covered by this action and logs, set this field to true.',
        },
        workflow: {
          type: "string",
          description: "Outlines the sequence and purpose of actions, representing the overall approach to achieve the goal."
        },
        error: {
          type: ['string', 'null'],
          description: 'Error messages about unexpected situations',
        },
      },
      required: ['actions', 'finish', 'workflow', 'error'],
      additionalProperties: false,
    },
  },
};

export const generateTaskBackgroundContext = (
  userInstruction: string,
  workflow?: string,
) => {
  if (workflow) {
    return `
Here is the user's instruction:
=============
${userInstruction}
=============

These are the logs from previous executions, which indicate what was done in the previous actions.
Do NOT repeat these actions.
=============
${workflow}
=============
`;
  }

  return `
Here is the user's instruction:
=============
${userInstruction}
=============
`;
};

export const automationUserPrompt = () => {
  if (getAIConfigInBoolean(MATCH_BY_POSITION)) {
    return new PromptTemplate({
      template: '{taskBackgroundContext}',
      inputVariables: ['taskBackgroundContext'],
    });
  }

  return new PromptTemplate({
    template: `
pageDescription:
=====================================
{pageDescription}
=====================================

{taskBackgroundContext}
    `,
    inputVariables: ['pageDescription', 'taskBackgroundContext'],
  });
};
