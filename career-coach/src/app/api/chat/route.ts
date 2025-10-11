import { convertToModelMessages, ModelMessage } from 'ai'
import { Agent, LLMFireworks, Orchestrator, WORKFLOW_EVENTS, WorkflowLifecycleEvent, SimpleMemory } from '@joshuacalpuerto/mcp-agent';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const llm = new LLMFireworks(process.env.OPENAI_MODEL ?? "", {
  maxTokens: 2048,
  temperature: 0.1,
  stream: true
});




export async function POST(req: Request) {
  const { messages: _messages } = await req.json();
  const encoder = new TextEncoder();
  const researcher = await Agent.initialize({
    llm,
    name: "researcher",
    description: `Your expertise is to find information.`,
    serverConfigs: [
      {
        name: "search_web",
        type: "http",
        url: getSmitheryUrl()
      }
    ],
  });

  const messages = convertToModelMessages(_messages).map((m: ModelMessage) => ({ role: m.role, content: (m.content?.[0] as { text?: string })?.text }))
  const latestMessage = messages[messages.length - 1]?.content;
  const history = SimpleMemory.fromMessages(messages);
  const orchestrator = new Orchestrator({
    llm,
    agents: [researcher],
    history
  });

  const stream = new ReadableStream({
    async start(controller) {
      const formatEvent = (event: WorkflowLifecycleEvent) => {
        let message = "";
        switch (event.type) {
          case WORKFLOW_EVENTS.WORKFLOW_STEP_START:
            message = `**Objective**: ${event.step.objective}`;
            break;
          case WORKFLOW_EVENTS.WORKFLOW_TASK_START:
            message = `**${event.task.agent}** working on task **${event.task.description}**`;
            break;
          case WORKFLOW_EVENTS.WORKFLOW_TASK_END:
            message = `**${event.task.agent}** result - **${event.task.result}**`;
            break;
          case WORKFLOW_EVENTS.WORKFLOW_STEP_END:
            message = `**Finished objective**: ${event.step.objective}`;
            break;
          case WORKFLOW_EVENTS.WORKFLOW_END:
            message = `\n\n${event.result.result}`;
            break;
          case WORKFLOW_EVENTS.WORKFLOW_ERROR:
            message = `Error "${event.error}"`;
            break;
          case WORKFLOW_EVENTS.WORKFLOW_START:
            message = `**Workflow started.**`;
            break;
          default:
            message = `Unknown event "${JSON.stringify(event)}"`;
        }
        // SSE format requires "data: ...\n\n"
        return encoder.encode(`${message}\n`);
      };

      const eventHandler = async (event: WorkflowLifecycleEvent) => {
        controller.enqueue(formatEvent(event));
        if (event.type === WORKFLOW_EVENTS.WORKFLOW_END || event.type === WORKFLOW_EVENTS.WORKFLOW_ERROR) {
          controller.close();
        }
      };

      orchestrator.onWorkflowEvent(eventHandler);
      orchestrator.generateStr(latestMessage);
    },
  });

  return new Response(stream, {
    status: 200,
    statusText: 'OK',
    headers: {
      "x-vercel-ai-ui-message-stream": "v1",
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

function getSmitheryUrl() {
  const url = new URL("https://server.smithery.ai/exa/mcp")
  url.searchParams.set("api_key", process.env.SMITHERY_KEY as string)
  url.searchParams.set("profile", process.env.SMITHERY_PROFILE as string)
  return url.toString()

}