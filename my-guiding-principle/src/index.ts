import { parseArgs } from 'node:util';
import { Agent, LLMFireworks } from '@joshuaalpuerto/mcp-agent';
import { softwareEngineeringPrinciples } from './tools/index';


async function runOrchestrator(scenario: string) {
  const llm = new LLMFireworks("accounts/fireworks/models/deepseek-v3", {
    maxTokens: 2048,
    temperature: 0.1,
    stream: true
  })

  // const context = await softwareEngineeringPrinciples.execute({});
  const sofwareEngineer = await Agent.initialize({
    llm,
    name: "Software engineer",
    description: `You have vast wisdom and knowledge about software engineering.`,
    functions: [softwareEngineeringPrinciples],
  });

  const result = await sofwareEngineer.generate(`Please provide a pragmatic and concise rule of thumb base on the software engineering principles handbook for the scenario: ${scenario}`);

  console.log(result)

  await sofwareEngineer.close()
}

function main() {
  // should accept args from command line
  // node --loader ts-node/esm ./src/index.ts --scenario="When to refactor code?"
  const { values } = parseArgs({
    args: process.argv.slice(2), options: {
      scenario: {
        type: "string",
      },
    },
    strict: true
  });
  if (values.scenario) {
    runOrchestrator(values.scenario as string).catch(console.error).finally(() => {
      process.exit(0);
    });
  } else {
    console.error('Usage: pnpm start --scenario="<engineering scenario>"');
    process.exit(1);
  }
}

main();