import assert from 'node:assert';
import { AIResponseFormat, type AIUsageInfo } from '../../types';

import { ifInBrowser } from '../../../shared/utils';
import dJSON from 'dirty-json';
import OpenAI from 'openai';
import {
  MIDSCENE_API_TYPE,
  MIDSCENE_DEBUG_AI_PROFILE,
  MIDSCENE_LANGSMITH_DEBUG,
  MIDSCENE_MODEL_NAME,
  MIDSCENE_OPENAI_INIT_CONFIG_JSON,
  MIDSCENE_USE_QWEN_VL,
  MIDSCENE_USE_VLM_UI_TARS,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MAX_TOKENS,
  getAIConfig,
  getAIConfigInBoolean,
  getAIConfigInJson,
} from '../../env';
import { AIActionType } from '../common';
import { assertSchema } from '../prompt/assertion';
import { locatorSchema } from '../prompt/llm-locator';
import { planSchema } from '../prompt/llm-planning';
import { debugLog } from '../../../core/utils';

export function checkAIConfig() {
  if (getAIConfig(OPENAI_API_KEY)) return true;

  return Boolean(getAIConfig(MIDSCENE_OPENAI_INIT_CONFIG_JSON));
}

// default model
const defaultModel = 'gpt-4o';
export function getModelName() {
  let modelName = defaultModel;
  const nameInConfig = getAIConfig(MIDSCENE_MODEL_NAME);
  if (nameInConfig) {
    modelName = nameInConfig;
  }
  return modelName;
}

async function createChatClient({
  AIActionTypeValue,
}: {
  AIActionTypeValue: AIActionType;
}): Promise<{
  completion: OpenAI.Chat.Completions;
}> {
  let openai: OpenAI | undefined;
  const extraConfig = getAIConfigInJson(MIDSCENE_OPENAI_INIT_CONFIG_JSON);

  const baseURL = getAIConfig(OPENAI_BASE_URL);
  if (typeof baseURL === 'string') {
    if (!/^https?:\/\//.test(baseURL)) {
      throw new Error(
        `OPENAI_BASE_URL must be a valid URL starting with http:// or https://, but got: ${baseURL}\nPlease check your config.`,
      );
    }
  }

  openai = new OpenAI({
    baseURL: getAIConfig(OPENAI_BASE_URL),
    apiKey: getAIConfig(OPENAI_API_KEY),
    ...extraConfig,
    defaultHeaders: {
      ...(extraConfig?.defaultHeaders || {}),
      [MIDSCENE_API_TYPE]: AIActionTypeValue.toString(),
    },
    dangerouslyAllowBrowser: true,
  });

  if (openai && getAIConfig(MIDSCENE_LANGSMITH_DEBUG)) {
    if (ifInBrowser) {
      throw new Error('langsmith is not supported in browser');
    }
    console.log('DEBUGGING MODE: langsmith wrapper enabled');
    const { wrapOpenAI } = await import('langsmith/wrappers');
    openai = wrapOpenAI(openai);
  }

  if (typeof openai !== 'undefined') {
    return {
      completion: openai.chat.completions,
    };
  }

  throw new Error('Openai SDK is not initialized');
}

export async function call(
  messages: OpenAI.ChatCompletionMessageParam[],
  AIActionTypeValue: AIActionType,
  responseFormat?:
    | OpenAI.ChatCompletionCreateParams['response_format']
    | OpenAI.ResponseFormatJSONObject
    | FireworksResponseFormat,
  stream: boolean = true,
): Promise<{ content: string; usage?: AIUsageInfo }> {
  const openAIClient = await createChatClient({
    AIActionTypeValue,
  });
  const shouldPrintTiming =
    typeof getAIConfig(MIDSCENE_DEBUG_AI_PROFILE) === 'string';

  const maxTokens = getAIConfig(OPENAI_MAX_TOKENS);

  const startTime = Date.now();
  const model = getModelName();
  const commonConfig = {
    model,
    messages,
    response_format: responseFormat,
    temperature: 0.1,
    max_tokens:
      typeof maxTokens === 'number'
        ? maxTokens
        : Number.parseInt(maxTokens || '2048', 10),
  };

  let content: string | undefined;
  let usage: OpenAI.CompletionUsage | undefined;
  if (stream) {
    const response = await openAIClient.completion.create({
      ...commonConfig,
      stream: true
      // we need to case the argument to return the correct type.
      // because completion.create is overloaded.
    } as OpenAI.ChatCompletionCreateParamsStreaming);
    ({ content, usage } = await handleStreamingResponse(response));

  } else {
    const response: OpenAI.ChatCompletion = await openAIClient.completion.create({
      ...commonConfig,
    } as OpenAI.ChatCompletionCreateParamsNonStreaming);
    ({ content, usage } = await handleNonStreamingResponse(response));
  }


  if (shouldPrintTiming) {
    console.log(
      'Midscene - AI call',
      model,
      stream ? 'streaming' : 'non-streaming',
      usage,
      `${Date.now() - startTime}ms`,
    );
  }

  debugLog(content)

  return { content: content || '', usage };
}

async function handleStreamingResponse(stream: AsyncIterable<OpenAI.ChatCompletionChunk>): Promise<{ content?: string, usage?: OpenAI.CompletionUsage }> {
  let content = '';
  let usage: OpenAI.CompletionUsage | undefined;
  for await (const chunk of stream) {
    content += (chunk.choices[0]?.delta?.content || '');
    usage = chunk.usage || undefined
  }
  return { content, usage }
}

async function handleNonStreamingResponse(result: OpenAI.ChatCompletion): Promise<{ content?: string, usage?: OpenAI.CompletionUsage }> {
  assert(
    result.choices,
    `invalid response from LLM service: ${JSON.stringify(result)}`,
  );

  const content = result.choices[0].message.content!;
  assert(content, 'empty content');

  return { content, usage: result.usage };
}

type FireworksResponseFormat = {
  type: AIResponseFormat.JSON,
  schema: Record<string, any>
}

export async function callToGetJSONObject<T>(
  messages: OpenAI.ChatCompletionMessageParam[],
  AIActionTypeValue: AIActionType,
): Promise<{ content: T; usage?: AIUsageInfo }> {
  let responseFormat:
    | OpenAI.ChatCompletionCreateParams['response_format']
    | OpenAI.ResponseFormatJSONObject
    | FireworksResponseFormat
    | undefined;

  const model = getModelName();

  if (model.includes('gpt-4o')) {
    switch (AIActionTypeValue) {
      case AIActionType.ASSERT:
        responseFormat = assertSchema;
        break;
      case AIActionType.INSPECT_ELEMENT:
        responseFormat = locatorSchema;
        break;
      case AIActionType.EXTRACT_DATA:
        //TODO: Currently the restriction type can only be a json subset of the constraint, and the way the extract api is used needs to be adjusted to limit the user's data to this as well
        // targetResponseFormat = extractDataSchema;
        responseFormat = { type: AIResponseFormat.JSON };
        break;
      case AIActionType.PLAN:
        responseFormat = planSchema;
        break;
    }
  }

  // fireworks handle response format differently with openAI
  // type -> json_object ===  json_schema 
  // key -> schema === json_schema
  if (model.includes('deepseek') && model.includes('accounts/fireworks/models')) {
    switch (AIActionTypeValue) {
      case AIActionType.ASSERT:
        responseFormat = {
          type: AIResponseFormat.JSON,
          schema: assertSchema.json_schema.schema
        } as FireworksResponseFormat;
        break;
      case AIActionType.INSPECT_ELEMENT:
        responseFormat = {
          type: AIResponseFormat.JSON,
          schema: locatorSchema.json_schema.schema
        } as FireworksResponseFormat;
        break;
      case AIActionType.EXTRACT_DATA:
        //TODO: Currently the restriction type can only be a json subset of the constraint, and the way the extract api is used needs to be adjusted to limit the user's data to this as well
        // targetResponseFormat = extractDataSchema;
        responseFormat = { type: AIResponseFormat.JSON };
        break;
      case AIActionType.PLAN:
        responseFormat = {
          type: AIResponseFormat.JSON,
          schema: planSchema.json_schema.schema
        } as FireworksResponseFormat;
        break;
    }
  }

  // gpt-4o-2024-05-13 only supports json_object response format
  if (model === 'gpt-4o-2024-05-13') {
    responseFormat = { type: AIResponseFormat.JSON };
  }

  const stream = true;
  const response = await call(messages, AIActionTypeValue, responseFormat, stream);
  assert(response, 'empty response');
  // we use `safeParseJson` to handle `text` and `json` response format
  const jsonContent = safeParseJson(response.content);

  return { content: jsonContent, usage: response.usage };
}

export function extractJSONFromCodeBlock(response: string) {
  try {
    // First, try to match a JSON object directly in the response
    const jsonMatch = response.match(/^\s*(\{[\s\S]*\})\s*$/);
    if (jsonMatch) {
      return jsonMatch[1];
    }

    // If no direct JSON object is found, try to extract JSON from a code block
    const codeBlockMatch = response.match(
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
    );
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // If no code block is found, try to find a JSON-like structure in the text
    const jsonLikeMatch = response.match(/\{[\s\S]*\}/);
    if (jsonLikeMatch) {
      return jsonLikeMatch[0];
    }
  } catch { }
  // If no JSON-like structure is found, return the original response
  return response;
}

export function safeParseJson(input: string) {
  const cleanJsonString = extractJSONFromCodeBlock(input);

  // match the point coordinates pattern
  if (cleanJsonString.match(/\((\d+),(\d+)\)/)) {
    return cleanJsonString
      .match(/\((\d+),(\d+)\)/)
      ?.slice(1)
      .map(Number);
  }

  // Check if the string looks like JSON (starts with { or [)
  const trimmedInput = cleanJsonString.trim();
  const looksLikeJson = /^[{\[]/.test(trimmedInput);

  if (!looksLikeJson) {
    return cleanJsonString; // Return the original string if it doesn't look like JSON
  }

  try {
    return JSON.parse(cleanJsonString);
  } catch (e) {
    // Only try dJSON if we're confident it's meant to be JSON but has some formatting issues
    try {
      return dJSON.parse(cleanJsonString);
    } catch (e) {
      console.log('JSON parsing error:', e);
    }
  }

  // If all parsing attempts fail but it looked like JSON, throw error
  throw Error(`Failed to parse JSON response: ${input}`);
}
