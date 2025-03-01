import { describe, it, expect, vi } from "vitest";
import dotenv from "dotenv";
import OpenAI from "openai";
import { join } from "node:path";
import { base64Encoded } from "../midscenejs/src/shared/img";
import { callToGetJSONObject } from "../midscenejs/src/core/ai-model";

// read and parse .env file
const result = dotenv.config({
  debug: true,
});
if (result.error) {
  throw result.error;
}

// uncomment to see the parsed result. It may include some credentials.
// console.log(".env file parsed result");
// console.log(result.parsed);

vi.setConfig({
  testTimeout: 30000,
});

const imagePath = join(__dirname, "test.png");
const imageBase64 = base64Encoded(imagePath);

const model = process.env.MIDSCENE_MODEL_NAME || "gpt-4o";
describe("Use OpenAI SDK directly", () => {
  it(`basic call with ${model}`, async () => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "Hello, how are you?" }],
    });

    expect(response.choices[0].message.content).toBeTruthy();
  });

  it(`image input with ${model}`, async () => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "user", content: "Tell me what is in this image" },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
    });
    // console.log(response.choices[0].message.content);
    expect(response.choices[0].message.content).toBeTruthy();
  });
});

describe("Use Midscene wrapped OpenAI SDK", () => {
  it("call to get json object", async () => {
    const result = await callToGetJSONObject(
      [
        {
          role: "user",
          content:
            "What is the content of this image? return in json format {content: string}",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      2 /* AIActionType.EXTRACT_DATA */
    );
    expect(result.content.content.length).toBeGreaterThan(5);
  });
});

describe("Use Midscene wrapped OpenAI SDK", () => {
  it("call to get json object", async () => {
    const result = await callToGetJSONObject(
      [
        {
          role: "user",
          content:
            "What is the content of this image? return in json format {content: string}",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      2 /* AIActionType.EXTRACT_DATA */
    );
    expect(result.content.content.length).toBeGreaterThan(5);
  });
});


