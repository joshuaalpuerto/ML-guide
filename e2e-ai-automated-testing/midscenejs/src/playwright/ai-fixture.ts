import { randomUUID } from 'node:crypto';
import type { PageAgent } from '../common/agent';
import type { AgentWaitForOpt, AgentAssertOpt } from '../core';
import { type TestInfo, type TestType, test } from '@playwright/test';
import type { Page as OriginPlaywrightPage } from 'playwright';
import type { PageTaskExecutor } from '../common/tasks';
import { PlaywrightAgent } from './index';

export type APITestType = Pick<TestType<any, any>, 'step'>;

const groupAndCaseForTest = (testInfo: TestInfo) => {
  let taskFile: string;
  let taskTitle: string;
  const titlePath = [...testInfo.titlePath];

  if (titlePath.length > 1) {
    taskTitle = titlePath.pop() || 'unnamed';
    taskFile = `${titlePath.join(' > ')}`;
  } else if (titlePath.length === 1) {
    taskTitle = titlePath[0];
    taskFile = `${taskTitle}`;
  } else {
    taskTitle = 'unnamed';
    taskFile = 'unnamed';
  }
  return { taskFile, taskTitle };
};

const midsceneAgentKeyId = '_midsceneAgentId';
export const midsceneDumpAnnotationId = 'MIDSCENE_DUMP_ANNOTATION';
export const PlaywrightAiFixture = (options?: {
  forceSameTabNavigation?: boolean;
}) => {
  const { forceSameTabNavigation = true } = options ?? {};
  const pageAgentMap: Record<string, PageAgent> = {};
  const agentForPage = (
    page: OriginPlaywrightPage,
    testInfo: TestInfo, // { testId: string; taskFile: string; taskTitle: string },
  ) => {
    let idForPage = (page as any)[midsceneAgentKeyId];
    if (!idForPage) {
      idForPage = randomUUID();
      (page as any)[midsceneAgentKeyId] = idForPage;
      const { testId } = testInfo;
      const { taskFile, taskTitle } = groupAndCaseForTest(testInfo);
      pageAgentMap[idForPage] = new PlaywrightAgent(page, {
        testId: `playwright-${testId}-${idForPage}`,
        forceSameTabNavigation,
        cacheId: `${taskFile}(${taskTitle})`,
        groupName: taskTitle,
        groupDescription: taskFile,
      });
    }
    return pageAgentMap[idForPage];
  };


  return {
    ai: async (
      { page }: { page: OriginPlaywrightPage },
      use: any,
      testInfo: TestInfo,
    ) => {
      const agent = agentForPage(page, testInfo);

      await use(
        async (
          taskPrompt: string,
          opts?: { type?: 'action' | 'query'; trackNewTab?: boolean },
        ) => {
          return new Promise((resolve, reject) => {
            const { type = 'action' } = opts || {};

            test.step(`ai - ${taskPrompt}`, async () => {
              await waitForNetworkIdle(page);
              try {
                const result = await agent.ai(taskPrompt, type);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            });
          });
        },
      );

    },
    aiAction: async (
      { page }: { page: OriginPlaywrightPage },
      use: any,
      testInfo: TestInfo,
    ) => {
      const agent = agentForPage(page, testInfo);
      await use(async (taskPrompt: string) => {
        return new Promise((resolve, reject) => {
          test.step(`aiAction - ${taskPrompt}`, async () => {
            await waitForNetworkIdle(page);
            try {
              const result = await agent.aiAction(taskPrompt);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });
      });

    },
    aiQuery: async (
      { page }: { page: OriginPlaywrightPage },
      use: any,
      testInfo: TestInfo,
    ) => {
      const agent = agentForPage(page, testInfo);
      await use(async (demand: any) => {
        return new Promise((resolve, reject) => {
          test.step(`aiQuery - ${JSON.stringify(demand)}`, async () => {
            await waitForNetworkIdle(page);
            try {
              const result = await agent.aiQuery(demand);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });
      });

    },
    aiAssert: async (
      { page }: { page: OriginPlaywrightPage },
      use: any,
      testInfo: TestInfo,
    ) => {
      const agent = agentForPage(page, testInfo);
      await use(async (assertion: string, errorMsg?: string, opt?: AgentAssertOpt) => {
        return new Promise((resolve, reject) => {
          test.step(`aiAssert - ${assertion}`, async () => {
            await waitForNetworkIdle(page);
            try {
              const output = await agent.aiAssert(assertion, errorMsg, opt);
              resolve(output);
            } catch (error) {
              reject(error);
            }
          });
        });
      });

    },
    aiWaitFor: async (
      { page }: { page: OriginPlaywrightPage },
      use: any,
      testInfo: TestInfo,
    ) => {
      const agent = agentForPage(page, testInfo);
      await use(async (assertion: string, opt?: AgentWaitForOpt) => {
        return new Promise((resolve, reject) => {
          test.step(`aiWaitFor - ${assertion}`, async () => {
            await waitForNetworkIdle(page);
            try {
              await agent.aiWaitFor(assertion, opt);
              resolve(null);
            } catch (error) {
              reject(error);
            }
          });
        });
      });

    },
  };
};

export type PlayWrightAiFixtureType = {
  ai: <T = any>(
    prompt: string,
    opts?: { type?: 'action' | 'query'; trackNewTab?: boolean },
  ) => Promise<T>;
  aiAction: (taskPrompt: string) => ReturnType<PageTaskExecutor['action']>;
  aiQuery: <T = any>(demand: any) => Promise<T>;
  aiAssert: (assertion: string, errorMsg?: string, opt?: AgentAssertOpt) => Promise<void>;
  aiWaitFor: (assertion: string, opt?: AgentWaitForOpt) => Promise<void>;
};

async function waitForNetworkIdle(page: OriginPlaywrightPage, timeout = 20000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error: any) {
    console.warn(
      `Network idle timeout exceeded: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
