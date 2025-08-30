import { generateText, streamText, type CoreMessage, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

type LLMClientParams = {
  model?: LanguageModel;
}

export async function createLLMClient(config: LLMClientParams = {}) {
  let model = config.model;

  if (!model) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    model = openai('gpt-4o-mini')
  }

  return {
    generateText: async (prompt: string) => {
      return generateText({
        model: model,
        prompt
      });
    },
    streamText: async (messages: CoreMessage[]) => {
      return streamText({
        model: model,
        messages,
      });
    }
  }
}
