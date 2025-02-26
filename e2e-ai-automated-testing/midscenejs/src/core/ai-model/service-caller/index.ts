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
  OPENAI_USE_AZURE,
  getAIConfig,
  getAIConfigInBoolean,
  getAIConfigInJson,
} from '../../env';
import { AIActionType } from '../common';
import { assertSchema } from '../prompt/assertion';
import { locatorSchema } from '../prompt/llm-locator';
import { planSchema } from '../prompt/llm-planning';

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
  style: 'openai' | 'anthropic';
}> {
  let openai: OpenAI | AzureOpenAI | undefined;
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
    | OpenAI.ResponseFormatJSONObject,
): Promise<{ content: string; usage?: AIUsageInfo }> {
  const { completion } = await createChatClient({
    AIActionTypeValue,
  });
  const shouldPrintTiming =
    typeof getAIConfig(MIDSCENE_DEBUG_AI_PROFILE) === 'string';

  const maxTokens = getAIConfig(OPENAI_MAX_TOKENS);

  const startTime = Date.now();
  const model = getModelName();
  let content: string | undefined;
  let usage: OpenAI.CompletionUsage | undefined;
  const commonConfig = {
    temperature: getAIConfigInBoolean(MIDSCENE_USE_VLM_UI_TARS) ? 0.0 : 0.1,
    stream: false,
    max_tokens:
      typeof maxTokens === 'number'
        ? maxTokens
        : Number.parseInt(maxTokens || '2048', 10),
    ...(getAIConfigInBoolean(MIDSCENE_USE_QWEN_VL)
      ? {
        vl_high_resolution_images: true,
      }
      : {}),
  };

  const result = await completion.create({
    model,
    messages,
    response_format: responseFormat,
    ...commonConfig,
  } as any);
  shouldPrintTiming &&
    console.log(
      'Midscene - AI call',
      getAIConfig(MIDSCENE_USE_QWEN_VL) ? 'MIDSCENE_USE_QWEN_VL' : '',
      model,
      result.usage,
      `${Date.now() - startTime}ms`,
      result._request_id || '',
    );
  assert(
    result.choices,
    `invalid response from LLM service: ${JSON.stringify(result)}`,
  );
  content = result.choices[0].message.content!;
  assert(content, 'empty content');
  usage = result.usage;



  return { content: content || '', usage };
}

export async function callToGetJSONObject<T>(
  messages: OpenAI.ChatCompletionMessageParam[],
  AIActionTypeValue: AIActionType,
): Promise<{ content: T; usage?: AIUsageInfo }> {
  let responseFormat:
    | OpenAI.ChatCompletionCreateParams['response_format']
    | OpenAI.ResponseFormatJSONObject
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

  // gpt-4o-2024-05-13 only supports json_object response format
  if (model === 'gpt-4o-2024-05-13') {
    responseFormat = { type: AIResponseFormat.JSON };
  }

  const response = await call(messages, AIActionTypeValue, responseFormat);
  assert(response, 'empty response');
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
  // match the point
  if (cleanJsonString.match(/\((\d+),(\d+)\)/)) {
    return cleanJsonString
      .match(/\((\d+),(\d+)\)/)
      ?.slice(1)
      .map(Number);
  }
  try {
    return JSON.parse(cleanJsonString);
  } catch { }
  try {
    return dJSON.parse(cleanJsonString);
  } catch (e) {
    console.log('e:', e);
  }
  throw Error(`failed to parse json response: ${input}`);
}
