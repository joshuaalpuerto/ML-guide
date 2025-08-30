import { createLLMClient } from '@/libs/ai-model/serviceCaller';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const llmClient = await createLLMClient();
  const result = await llmClient.streamText(messages);

  return result.toDataStreamResponse();
}
