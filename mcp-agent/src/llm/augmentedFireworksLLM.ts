import OpenAI from 'openai';
import { getAIConfig, OPENAI_API_KEY, OPENAI_BASE_URL } from '../config';
import { AIResponseFormat, LLMInterface, LLMConfig, LLMResult } from './type';

type FireworksResponseFormat = {
  type: AIResponseFormat.JSON;
  schema: Record<string, any>
}

export class AugmentedFireworksLLM implements LLMInterface {
  private client: OpenAI;
  private model: string;
  private config: LLMConfig;

  constructor(model: string, config: LLMConfig) {
    this.client = new OpenAI({
      baseURL: getAIConfig(OPENAI_BASE_URL),
      apiKey: getAIConfig(OPENAI_API_KEY),
      ...config,
    });
    this.model = model;
    this.config = config;
  }

  async generate(params: {
    messages: OpenAI.ChatCompletionMessageParam[];
    config: LLMConfig;
  }): Promise<LLMResult> {
    const { messages, config } = params;
    const configToUse = { ...this.config, ...config };
    const commonConfig = {
      model: this.model,
      messages,
      tools: configToUse?.tools,
      max_tokens: configToUse?.maxTokens ?? 2048,
      temperature: configToUse?.temperature ?? 0.1,
    }

    try {
      if (configToUse?.stream) {
        const completion = await this.client.chat.completions.create({
          ...commonConfig,
          stream: true,
        });
        return this.handleStreamResponse(completion);
      } else {
        const completion: OpenAI.ChatCompletion = await this.client.chat.completions.create({
          ...commonConfig,
          stream: false,
        });

        return {
          content: completion.choices[0].message.content || '',
          usage: completion.usage,
          toolCalls: completion.choices[0].message.tool_calls
        };
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async handleStreamResponse(stream: AsyncIterable<OpenAI.ChatCompletionChunk>): Promise<LLMResult> {
    let contentChunk = '';
    let toolCallChunks = ''
    let usage: OpenAI.CompletionUsage | undefined;
    for await (const chunk of stream) {
      contentChunk += (chunk.choices[0]?.delta?.content || '');
      toolCallChunks += (chunk.choices[0]?.delta?.tool_calls || '')
      usage = chunk.usage || undefined
    }
    return { content: contentChunk, toolCalls: JSON.parse(toolCallChunks ?? []), usage, }
  }

  private handleError(error: any): Error {
    if (error instanceof OpenAI.APIError) {
      return new Error(`LLM API error (${error.status}): ${error.message}`);
    }
    return new Error(`Request failed: ${error.message}`);
  }
}
