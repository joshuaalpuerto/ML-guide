import type { WebPage } from '../common/page';
import {
  type AgentAssertOpt,
  type AgentWaitForOpt,
  Insight,
  type InsightAction,
} from '../core';
import { NodeType } from '../shared/extractor/constants';

import {
  MATCH_BY_POSITION,
  getAIConfigInBoolean,
} from '../core/env';

import { PageTaskExecutor } from './tasks';
import { WebElementInfo } from './web-element';
import type { AiTaskCache } from './task-cache';
import { paramStr, typeStr } from './ui-utils';
import { type WebUIContext, parseContextFromWebPage } from './utils';

export interface PageAgentOpt {
  forceSameTabNavigation?: boolean /* if limit the new tab to the current page, default true */;
  testId?: string;
  cacheId?: string;
  groupName?: string;
  groupDescription?: string;
  cache?: AiTaskCache;
}

export class PageAgent<PageType extends WebPage = WebPage> {
  page: PageType;

  insight: Insight<WebElementInfo, WebUIContext>;

  taskExecutor: PageTaskExecutor;

  opts: PageAgentOpt;

  /**
   * If true, the agent will not perform any actions
   */
  dryMode = false;

  constructor(page: PageType, opts?: PageAgentOpt) {
    this.page = page;
    this.opts = opts || {};

    this.insight = new Insight<WebElementInfo, WebUIContext>(
      async (action: InsightAction) => {
        return this.getUIContext(action);
      },
      {
        generateElement: ({ content, rect }) =>
          new WebElementInfo({
            content: content || '',
            rect,
            id: '',
            attributes: {
              nodeType: NodeType.CONTAINER,
            },
            indexId: 0,
          }),
      },
    );

    this.taskExecutor = new PageTaskExecutor(this.page, this.insight, {
      cacheId: opts?.cacheId,
    });

  }

  async getUIContext(action?: InsightAction): Promise<WebUIContext> {
    if (action && (action === 'extract' || action === 'assert')) {
      return await parseContextFromWebPage(this.page, {
        ignoreMarker: true,
      });
    }
    return await parseContextFromWebPage(this.page, {
      ignoreMarker: getAIConfigInBoolean(MATCH_BY_POSITION),
    });
  }


  async aiAction(taskPrompt: string) {
    const { executor } = await this.taskExecutor.action(taskPrompt);

    if (executor.isInErrorState()) {
      const errorTask = executor.latestErrorTask();
      throw new Error(`${errorTask?.error}\n${errorTask?.errorStack}`);
    }
  }

  async aiQuery(demand: any) {
    const { output, executor } = await this.taskExecutor.query(demand);


    if (executor.isInErrorState()) {
      const errorTask = executor.latestErrorTask();
      throw new Error(`${errorTask?.error}\n${errorTask?.errorStack}`);
    }
    return output;
  }

  async aiAssert(assertion: string, msg?: string, opt?: AgentAssertOpt) {
    const { output, executor } = await this.taskExecutor.assert(assertion);

    if (output && opt?.keepRawResponse) {
      return output;
    }

    if (!output?.pass) {
      const errMsg = msg || `Assertion failed: ${assertion}`;
      const reasonMsg = `Reason: ${output?.thought || executor.latestErrorTask()?.error || '(no_reason)'
        }`;
      throw new Error(`${errMsg}\n${reasonMsg}`);
    }
  }

  async aiWaitFor(assertion: string, opt?: AgentWaitForOpt) {
    const { executor } = await this.taskExecutor.waitFor(assertion, {
      timeoutMs: opt?.timeoutMs || 15 * 1000,
      checkIntervalMs: opt?.checkIntervalMs || 3 * 1000,
      assertion
    });

    if (executor.isInErrorState()) {
      const errorTask = executor.latestErrorTask();
      throw new Error(`${errorTask?.error}\n${errorTask?.errorStack}`);
    }
  }

  async ai(taskPrompt: string, type = 'action') {
    if (type === 'action') {
      return this.aiAction(taskPrompt);
    }
    if (type === 'query') {
      return this.aiQuery(taskPrompt);
    }

    if (type === 'assert') {
      return this.aiAssert(taskPrompt);
    }

    throw new Error(
      `Unknown type: ${type}, only support 'action', 'query', 'assert'`,
    );
  }

  async destroy() {
    await this.page.destroy();
  }
}
