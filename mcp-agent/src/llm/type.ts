import OpenAI from 'openai';

export type AIUsageInfo = Record<string, any> & {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export enum AIResponseFormat {
  JSON = 'json_object',
  TEXT = 'text',
}

export type LLMConfig = {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  tools?: OpenAI.ChatCompletionTool[];
}

export type LLMResult = {
  content?: string;
  usage?: AIUsageInfo;
  toolCalls?: OpenAI.ChatCompletionMessageToolCall[];
}

export interface LLMInterface {
  generate(params: {
    messages: OpenAI.ChatCompletionMessageParam[];
    config: LLMConfig;
  }): Promise<LLMResult>;
}