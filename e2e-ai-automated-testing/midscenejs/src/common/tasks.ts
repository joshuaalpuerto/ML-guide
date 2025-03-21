import assert from 'node:assert';
import OpenAI from 'openai';
import type { WebPage } from '../common/page';
import {
  type AIElementIdResponse,
  type AIUsageInfo,
  type DumpSubscriber,
  type ExecutionRecorderItem,
  type ExecutionTaskActionApply,
  type ExecutionTaskApply,
  type ExecutionTaskInsightLocateApply,
  type ExecutionTaskInsightQueryApply,
  type ExecutionTaskPlanningApply,
  Executor,
  type Insight,
  type InsightAssertionResponse,
  type InsightDump,
  type InsightExtractParam,
  type PlanningAIResponse,
  type PlanningAction,
  type PlanningActionParamAssert,
  type PlanningActionParamError,
  type PlanningActionParamHover,
  type PlanningActionParamInputOrKeyPress,
  type PlanningActionParamScroll,
  type PlanningActionParamSleep,
  type PlanningActionParamTap,
  type PlanningActionParamWaitFor,
  plan,
} from '../core';
import { sleep } from '../core/utils';
import type { ElementInfo } from '../shared/extractor/index';
import type { WebElementInfo } from '../common/web-element';
import { TaskCache } from './task-cache';
import { getKeyCommands } from './ui-utils';
import type { WebUIContext } from './utils';

interface ExecutionResult<OutputType = any> {
  output: OutputType;
  executor: Executor;
}

const replanningCountLimit = 10;

export class PageTaskExecutor {
  page: WebPage;

  insight: Insight<WebElementInfo, WebUIContext>;

  taskCache: TaskCache;

  conversationHistory: OpenAI.ChatCompletionMessageParam[] = [];

  constructor(
    page: WebPage,
    insight: Insight<WebElementInfo, WebUIContext>,
    opts: { cacheId: string | undefined },
  ) {
    this.page = page;
    this.insight = insight;

    this.taskCache = new TaskCache({
      cacheId: opts?.cacheId,
    });
  }

  private async recordScreenshot(timing: ExecutionRecorderItem['timing']) {
    const base64 = await this.page.screenshotBase64();
    const item: ExecutionRecorderItem = {
      type: 'screenshot',
      ts: Date.now(),
      screenshot: base64,
      timing,
    };
    return item;
  }

  private prependExecutorWithScreenshot(
    taskApply: ExecutionTaskApply,
    appendAfterExecution = false,
  ): ExecutionTaskApply {
    const taskWithScreenshot: ExecutionTaskApply = {
      ...taskApply,
      executor: async (param, context, ...args) => {
        const recorder: ExecutionRecorderItem[] = [];
        const { task } = context;
        // set the recorder before executor in case of error
        task.recorder = recorder;
        const shot = await this.recordScreenshot(`before ${task.type}`);
        recorder.push(shot);
        const result = await taskApply.executor(param, context, ...args);
        if (taskApply.type === 'Action') {
          await sleep(200)
        }
        if (appendAfterExecution) {

          const shot2 = await this.recordScreenshot('after Action');
          recorder.push(shot2);
        }
        return result;
      },
    };
    return taskWithScreenshot;
  }

  private async convertPlanToExecutable(
    plans: PlanningAction[],
    cacheGroup?: ReturnType<TaskCache['getCacheGroupByPrompt']>,
  ) {
    const tasks: ExecutionTaskApply[] = [];
    plans.forEach((plan) => {
      if (plan.type === 'Locate') {
        if (
          plan.element === null ||
          plan.element?.id === null ||
          plan.element?.id === 'null'
        ) {
          // console.warn('Locate action with id is null, will be ignored');
          return;
        }
        const taskFind: ExecutionTaskInsightLocateApply = {
          type: 'Insight',
          subType: 'Locate',
          param: plan.element || undefined,
          thought: plan.thought,
          element: plan.element,
          executor: async (param, taskContext) => {
            const { task } = taskContext;
            assert(
              param?.prompt || param?.id || param?.position || param?.bbox || param?.markerId,
              'No prompt or id or markerId or position or bbox to locate',
            );
            let insightDump: InsightDump | undefined;
            let usage: AIUsageInfo | undefined;
            const dumpCollector: DumpSubscriber = (dump) => {
              insightDump = dump;
              usage = dump?.taskInfo?.usage;
            };

            const shotTime = Date.now();
            const pageContext = await this.insight.contextRetrieverFn('locate');
            const recordItem: ExecutionRecorderItem = {
              type: 'screenshot',
              ts: shotTime,
              screenshot: pageContext.screenshotBase64,
              timing: 'before locate',
            };

            const locateCache = cacheGroup?.readCache(
              pageContext,
              'locate',
              param?.prompt,
            );
            let locateResult: AIElementIdResponse | undefined;
            const callAI = this.insight.aiVendorFn;

            const quickAnswer = {
              id: param?.id,
              markerId: param?.markerId,
              position: param?.position,
              bbox: param?.bbox,
            };
            const startTime = Date.now();
            const element = await this.insight.locate(param.prompt, {
              quickAnswer,
              callAI: async (...message: any) => {
                if (locateCache) {
                  locateResult = locateCache;
                  return Promise.resolve({ content: locateCache });
                }
                const { content: aiResult, usage } = await callAI(...message);
                return { content: aiResult, usage };
              },
            });
            const aiCost = Date.now() - startTime;

            if (locateResult) {
              cacheGroup?.saveCache({
                type: 'locate',
                pageContext: {
                  url: pageContext.url,
                  size: pageContext.size,
                },
                prompt: param.prompt || '',
                response: locateResult,
              });
            }
            if (!element) {
              task.log = {
                dump: insightDump,
              };
              throw new Error(`Element not found: ${param.prompt}`);
            }

            return {
              output: {
                element,
              },
              pageContext,
              log: {
                dump: insightDump,
              },
              cache: {
                hit: Boolean(locateCache),
              },
              recorder: [recordItem],
              aiCost,
              usage,
            };
          },
        };
        tasks.push(taskFind);
      } else if (plan.type === 'Assert' || plan.type === 'AssertWithoutThrow') {
        const assertPlan = plan as PlanningAction<PlanningActionParamAssert>;
        const taskAssert: ExecutionTaskApply = {
          type: 'Insight',
          subType: 'Assert',
          param: assertPlan.param,
          thought: assertPlan.thought,
          element: assertPlan.element,
          executor: async (param, taskContext) => {
            const { task } = taskContext;
            let insightDump: InsightDump | undefined;
            const dumpCollector: DumpSubscriber = (dump) => {
              insightDump = dump;
            };

            const assertion = await this.insight.assert(
              assertPlan.param.assertion,
            );

            if (!assertion.pass) {
              if (plan.type === 'Assert') {
                task.output = assertion;
                task.log = {
                  dump: insightDump,
                };
                throw new Error(
                  assertion.thought || 'Assertion failed without reason',
                );
              }

              task.error = assertion.thought;
            }

            return {
              output: assertion,
              log: {
                dump: insightDump,
              },
              usage: assertion.usage,
            };
          },
        };
        tasks.push(taskAssert);
      } else if (plan.type === 'Input') {
        const taskActionInput: ExecutionTaskActionApply<PlanningActionParamInputOrKeyPress> =
        {
          type: 'Action',
          subType: 'Input',
          param: plan.param,
          thought: plan.thought,
          element: plan.element,
          executor: async (taskParam, { element }) => {
            if (element) {
              // adjust element information depens on where it is located in the page
              element = await this.page.scrollElementAndAdjustPositionInformation(element as ElementInfo);
              await this.page.clearInput(element as ElementInfo);

              if (!taskParam || !taskParam.value) {
                return;
              }

              await this.page.keyboard.type(taskParam.value);
            } else {
              await this.page.keyboard.type(taskParam.value);
            }
          },
        };
        tasks.push(taskActionInput);
      } else if (plan.type === 'KeyboardPress') {
        const taskActionKeyboardPress: ExecutionTaskActionApply<PlanningActionParamInputOrKeyPress> =
        {
          type: 'Action',
          subType: 'KeyboardPress',
          param: plan.param,
          thought: plan.thought,
          element: plan.element,
          executor: async (taskParam) => {
            const keys = getKeyCommands(taskParam.value);

            await this.page.keyboard.press(keys);
          },
        };
        tasks.push(taskActionKeyboardPress);
      } else if (plan.type === 'Tap') {
        const taskActionTap: ExecutionTaskActionApply<PlanningActionParamTap> =
        {
          type: 'Action',
          subType: 'Tap',
          thought: plan.thought,
          element: plan.element,
          executor: async (param, { element }) => {
            assert(element, 'Element not found, cannot tap');
            // adjust element information depens on where it is located in the page
            element = await this.page.scrollElementAndAdjustPositionInformation(element as ElementInfo);
            // await this.page.scrollUntilBottom({ left: element.center[0], top: element.center[1] });
            await this.page.mouse.click(element.center[0], element.center[1]);
          },
        };
        tasks.push(taskActionTap);
      } else if (plan.type === 'Drag') {
        const taskActionDrag: ExecutionTaskActionApply<{
          start_box: { x: number; y: number };
          end_box: { x: number; y: number };
        }> = {
          type: 'Action',
          subType: 'Drag',
          param: plan.param,
          thought: plan.thought,
          element: plan.element,
          executor: async (taskParam) => {
            assert(
              taskParam?.start_box && taskParam?.end_box,
              'No start_box or end_box to drag',
            );
            await this.page.mouse.drag(taskParam.start_box, taskParam.end_box);
          },
        };
        tasks.push(taskActionDrag);
      } else if (plan.type === 'Hover') {
        const taskActionHover: ExecutionTaskActionApply<PlanningActionParamHover> =
        {
          type: 'Action',
          subType: 'Hover',
          thought: plan.thought,
          element: plan.element,
          executor: async (param, { element }) => {
            assert(element, 'Element not found, cannot hover');
            // adjust element information depens on where it is located in the page
            element = await this.page.scrollElementAndAdjustPositionInformation(element as ElementInfo);
            await this.page.mouse.move(element.center[0], element?.center[1]);
          },
        };
        tasks.push(taskActionHover);
      } else if (plan.type === 'Scroll') {
        const taskActionScroll: ExecutionTaskActionApply<PlanningActionParamScroll> =
        {
          type: 'Action',
          subType: 'Scroll',
          param: plan.param,
          thought: plan.thought,
          element: plan.element,
          executor: async (taskParam, { element }) => {
            const startingPoint = element
              ? {
                left: element.center[0],
                top: element.center[1],
              }
              : undefined;
            const scrollToEventName = taskParam?.scrollType;

            // if there's element we anyway scroll to it so we don't need to do scroll event
            if (element) {
              await this.page.scrollElementAndAdjustPositionInformation(element as ElementInfo);
            } else if (scrollToEventName === 'untilTop') {
              await this.page.scrollUntilTop(startingPoint);
            } else if (scrollToEventName === 'untilBottom') {
              await this.page.scrollUntilBottom(startingPoint);
            } else if (scrollToEventName === 'untilRight') {
              await this.page.scrollUntilRight(startingPoint);
            } else if (scrollToEventName === 'untilLeft') {
              await this.page.scrollUntilLeft(startingPoint);
            } else if (scrollToEventName === 'once' || !scrollToEventName) {
              if (
                taskParam?.direction === 'down' ||
                !taskParam ||
                !taskParam.direction
              ) {
                await this.page.scrollDown(
                  taskParam?.distance || undefined,
                  startingPoint,
                );
              } else if (taskParam.direction === 'up') {
                await this.page.scrollUp(
                  taskParam.distance || undefined,
                  startingPoint,
                );
              } else if (taskParam.direction === 'left') {
                await this.page.scrollLeft(
                  taskParam.distance || undefined,
                  startingPoint,
                );
              } else if (taskParam.direction === 'right') {
                await this.page.scrollRight(
                  taskParam.distance || undefined,
                  startingPoint,
                );
              } else {
                throw new Error(
                  `Unknown scroll direction: ${taskParam.direction}`,
                );
              }
              // until mouse event is done
              await sleep(500);
            } else {
              throw new Error(
                `Unknown scroll event type: ${scrollToEventName}, taskParam: ${JSON.stringify(
                  taskParam,
                )}`,
              );
            }
          },
        };
        tasks.push(taskActionScroll);
      } else if (plan.type === 'Sleep') {
        const taskActionSleep: ExecutionTaskActionApply<PlanningActionParamSleep> =
        {
          type: 'Action',
          subType: 'Sleep',
          param: plan.param,
          thought: plan.thought,
          element: plan.element,
          executor: async (taskParam) => {
            await sleep(taskParam?.timeMs || 3000);
          },
        };
        tasks.push(taskActionSleep);
      } else if (plan.type === 'Error') {
        const taskActionError: ExecutionTaskActionApply<PlanningActionParamError> =
        {
          type: 'Action',
          subType: 'Error',
          param: plan.param,
          thought: plan.thought || plan.param?.thought,
          element: plan.element,
          executor: async () => {
            throw new Error(
              plan?.thought || plan.param?.thought || 'error without thought',
            );
          },
        };
        tasks.push(taskActionError);
      } else if (plan.type === 'Finished') {
        const taskActionFinished: ExecutionTaskActionApply<null> = {
          type: 'Action',
          subType: 'Finished',
          param: null,
          thought: plan.thought,
          element: plan.element,
          executor: async (param) => { },
        };
        tasks.push(taskActionFinished);
      } else {
        throw new Error(`Unknown or unsupported task type: ${plan.type}`);
      }
    });

    const wrappedTasks = tasks.map(
      (task: ExecutionTaskApply, index: number) => {
        if (task.type === 'Action') {
          return this.prependExecutorWithScreenshot(
            task,
            index === tasks.length - 1,
          );
        }
        return task;
      },
    );

    return {
      tasks: wrappedTasks,
    };
  }

  private planningTaskFromPrompt(
    userInstruction: string,
    cacheGroup: ReturnType<TaskCache['getCacheGroupByPrompt']>,
    workflow?: string,
  ) {
    const task: ExecutionTaskPlanningApply = {
      type: 'Planning',
      element: null,
      param: {
        userInstruction,
        workflow,
      },
      executor: async (param, executorContext) => {
        const shotTime = Date.now();
        const pageContext = await this.insight.contextRetrieverFn('locate');
        const recordItem: ExecutionRecorderItem = {
          type: 'screenshot',
          ts: shotTime,
          screenshot: pageContext.screenshotBase64,
          timing: 'before planning',
        };

        executorContext.task.recorder = [recordItem];
        (executorContext.task as any).pageContext = pageContext;

        const planCache = cacheGroup.readCache(
          pageContext,
          'plan',
          param.userInstruction,
        );

        let planResult: Awaited<ReturnType<typeof plan>>;
        if (planCache) {
          planResult = planCache;
        } else {
          planResult = await plan(param.userInstruction, {
            context: pageContext,
            workflow: param.workflow,
          });
        }

        // console.log('planResult is', planResult);
        const { actions, workflow, finish, error, usage, rawResponse, sleep } =
          planResult;

        let stopCollecting = false;
        let bboxCollected = false;
        let planParsingError = '';
        const finalActions = (actions || []).reduce<PlanningAction[]>(
          (acc, planningAction) => {
            if (stopCollecting) {
              return acc;
            }

            if (planningAction.element) {

              // some times firewokrs deepseek-r1 will return element in the locate response and it contains the locate information
              if (planningAction.element.element) {
                planningAction.element = {
                  ...planningAction.element,
                  ...planningAction.element.element
                }
              }

              // we only collect bbox once, let qwen re-locate in the following steps
              if (bboxCollected && planningAction.element.bbox) {
                // biome-ignore lint/performance/noDelete: <explanation>
                delete planningAction.element.bbox;
              }

              if (planningAction.element.bbox) {
                bboxCollected = true;
              }

              // by default if prompt is not provided we will try to resolve it using locate information
              if (!planningAction.element.prompt) {
                const elementId = planningAction.element.id;
                const markerId = planningAction.element.markerId;

                if (elementId || markerId) {
                  planningAction.element.prompt = elementId ? `The element with element with id: ${elementId}.` : `The elmeent with  markerId: ${markerId}.`;
                }
              }

              acc.push({
                type: 'Locate',
                element: planningAction.element,
                param: null,
                thought: planningAction.element.prompt
              });
            } else if (
              ['Tap', 'Hover', 'Input'].includes(planningAction.type)
            ) {
              planParsingError = `invalid planning response: ${JSON.stringify(planningAction)}`;
              // should include locate but get null
              stopCollecting = true;
              return acc;
            }
            acc.push(planningAction);

            if (planResult.sleep) {
              acc.push({
                type: 'Sleep',
                param: {
                  timeMs: planResult.sleep,
                },
                element: null,
              } as PlanningAction<PlanningActionParamSleep>);
            }
            return acc;
          },
          [],
        );

        if (finalActions.length === 0) {
          assert(
            finish,
            error
              ? `Failed to plan: ${error}`
              : planParsingError || 'No plan found',
          );
        }

        cacheGroup.saveCache({
          type: 'plan',
          pageContext: {
            url: pageContext.url,
            size: pageContext.size,
          },
          prompt: userInstruction,
          response: planResult,
        });

        return {
          output: {
            actions: finalActions,
            finish,
            workflow,
          },
          cache: {
            hit: Boolean(planCache),
          },
          pageContext,
          recorder: [recordItem],
          usage,
          rawResponse,
        };
      },
    };

    return task;
  }

  async action(
    userPrompt: string,
  ): Promise<ExecutionResult> {
    const taskExecutor = new Executor(userPrompt);

    const cacheGroup = this.taskCache.getCacheGroupByPrompt(userPrompt);
    let planningTask: ExecutionTaskPlanningApply | null =
      this.planningTaskFromPrompt(userPrompt, cacheGroup);
    let result: any;
    let replanCount = 0;
    const logLog: string[] = [];
    while (planningTask) {
      if (replanCount > replanningCountLimit) {
        const errorMsg =
          'Replanning too many times, please split the task into multiple steps';

        return this.appendErrorPlan(taskExecutor, errorMsg);
      }

      // plan
      await taskExecutor.append(planningTask);
      const planResult: PlanningAIResponse = await taskExecutor.flush();
      if (taskExecutor.isInErrorState()) {
        return {
          output: planResult,
          executor: taskExecutor,
        };
      }

      const plans = planResult.actions || [];

      let executables: Awaited<ReturnType<typeof this.convertPlanToExecutable>>;
      try {
        executables = await this.convertPlanToExecutable(plans, cacheGroup);
        taskExecutor.append(executables.tasks);
      } catch (error) {
        return this.appendErrorPlan(
          taskExecutor,
          `Error converting plans to executable tasks: ${error}, plans: ${JSON.stringify(
            plans,
          )}`,
        );
      }

      result = await taskExecutor.flush();
      if (taskExecutor.isInErrorState()) {
        return {
          output: result,
          executor: taskExecutor,
        };
      }
      if (planResult?.workflow) {
        logLog.push(planResult.workflow);
      }

      // console.log('planningResult is', planResult);
      if (planResult.finish) {
        planningTask = null;
        break;
      }
      planningTask = this.planningTaskFromPrompt(
        userPrompt,
        cacheGroup,
        logLog.join('\n'),
      );
      replanCount++;
    }

    return {
      output: result,
      executor: taskExecutor,
    };
  }

  async query(
    demand: InsightExtractParam,
  ): Promise<ExecutionResult> {
    const description =
      typeof demand === 'string' ? demand : JSON.stringify(demand);
    const taskExecutor = new Executor(description);
    const queryTask: ExecutionTaskInsightQueryApply = {
      type: 'Insight',
      subType: 'Query',
      element: null,
      param: {
        dataDemand: demand,
      },
      executor: async (param) => {
        let insightDump: InsightDump | undefined;
        const dumpCollector: DumpSubscriber = (dump) => {
          insightDump = dump;
        };

        const { data, usage } = await this.insight.extract<any>(
          param.dataDemand,
        );
        return {
          output: data,
          log: { dump: insightDump },
          usage,
        };
      },
    };

    await taskExecutor.append(this.prependExecutorWithScreenshot(queryTask));
    const output = await taskExecutor.flush();
    return {
      output,
      executor: taskExecutor,
    };
  }

  async assert(
    assertion: string,
  ): Promise<ExecutionResult<InsightAssertionResponse>> {
    const description = `assert: ${assertion}`;
    const taskExecutor = new Executor(description);
    const assertionPlan: PlanningAction<PlanningActionParamAssert> = {
      type: 'Assert',
      param: {
        assertion,
      },
      element: null,
    };
    const { tasks } = await this.convertPlanToExecutable([assertionPlan]);

    await taskExecutor.append(this.prependExecutorWithScreenshot(tasks[0]));
    const output: InsightAssertionResponse = await taskExecutor.flush();

    return {
      output,
      executor: taskExecutor,
    };
  }

  /**
   * Append a message to the conversation history
   * For user messages with images:
   * - Keep max 4 user image messages in history
   * - Remove oldest user image message when limit reached
   * For assistant messages:
   * - Simply append to history
   * @param conversationHistory Message to append
   */
  private appendConversationHistory(
    conversationHistory: OpenAI.ChatCompletionMessageParam,
  ) {
    if (conversationHistory.role === 'user') {
      // Get all existing user messages with images
      const userImgItems = this.conversationHistory.filter(
        (item) => item.role === 'user',
      );

      // If we already have 4 user image messages
      if (userImgItems.length >= 4 && conversationHistory.role === 'user') {
        // Remove first user image message when we already have 4, before adding new one
        const firstUserImgIndex = this.conversationHistory.findIndex(
          (item) => item.role === 'user',
        );
        if (firstUserImgIndex >= 0) {
          this.conversationHistory.splice(firstUserImgIndex, 1);
        }
      }
    }
    // For non-user messages, simply append to history
    this.conversationHistory.push(conversationHistory);
  }

  private async appendErrorPlan(taskExecutor: Executor, errorMsg: string) {
    const errorPlan: PlanningAction<PlanningActionParamError> = {
      type: 'Error',
      param: {
        thought: errorMsg,
      },
      element: null,
    };
    const { tasks } = await this.convertPlanToExecutable([errorPlan]);
    await taskExecutor.append(this.prependExecutorWithScreenshot(tasks[0]));
    await taskExecutor.flush();

    return {
      output: undefined,
      executor: taskExecutor,
    };
  }

  async waitFor(
    assertion: string,
    opt: PlanningActionParamWaitFor,
  ): Promise<ExecutionResult<void>> {
    const description = `waitFor: ${assertion}`;
    const taskExecutor = new Executor(description);
    const { timeoutMs, checkIntervalMs } = opt;

    assert(assertion, 'No assertion for waitFor');
    assert(timeoutMs, 'No timeoutMs for waitFor');
    assert(checkIntervalMs, 'No checkIntervalMs for waitFor');

    const overallStartTime = Date.now();
    let startTime = Date.now();
    let errorThought = '';
    while (Date.now() - overallStartTime < timeoutMs) {
      startTime = Date.now();
      const assertPlan: PlanningAction<PlanningActionParamAssert> = {
        type: 'AssertWithoutThrow',
        param: {
          assertion,
        },
        element: null,
      };
      const { tasks: assertTasks } = await this.convertPlanToExecutable([
        assertPlan,
      ]);
      await taskExecutor.append(
        this.prependExecutorWithScreenshot(assertTasks[0]),
      );
      const output: InsightAssertionResponse = await taskExecutor.flush();

      if (output?.pass) {
        return {
          output: undefined,
          executor: taskExecutor,
        };
      }

      errorThought =
        output?.thought ||
        `unknown error when waiting for assertion: ${assertion}`;
      const now = Date.now();
      if (now - startTime < checkIntervalMs) {
        const timeRemaining = checkIntervalMs - (now - startTime);
        const sleepPlan: PlanningAction<PlanningActionParamSleep> = {
          type: 'Sleep',
          param: {
            timeMs: timeRemaining,
          },
          element: null,
        };
        const { tasks: sleepTasks } = await this.convertPlanToExecutable([
          sleepPlan,
        ]);
        await taskExecutor.append(
          this.prependExecutorWithScreenshot(sleepTasks[0]),
        );
        await taskExecutor.flush();
      }
    }

    return this.appendErrorPlan(
      taskExecutor,
      `waitFor timeout: ${errorThought}`,
    );
  }
}
