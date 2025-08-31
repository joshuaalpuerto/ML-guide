import { Agent, LLMFireworks } from '@joshuacalpuerto/mcp-agent';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1]?.content;

  const llm = new LLMFireworks("accounts/fireworks/models/deepseek-v3", {
    maxTokens: 2048,
    temperature: 0.1,
    stream: true
  });

  const researcher = await Agent.initialize({
    llm,
    name: "researcher",
    description: `Your expertise is to find information.`,
  });

  const result = await researcher.generateStr(latestMessage);

  // Create a stream from the string result in the Vercel AI SDK format.
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      // Manually encode the string into the AI SDK text format `0:"<text>"\n`
      const textPayload = JSON.stringify(result);
      controller.enqueue(encoder.encode(`0:${textPayload}\n`));
      controller.close();
    },
  });

  // Return a Response object with the stream.
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
