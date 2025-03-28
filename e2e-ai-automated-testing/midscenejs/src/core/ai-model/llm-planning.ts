import assert from 'node:assert';
import { MIDSCENE_USE_QWEN_VL, getAIConfigInBoolean } from '../env';
import type { PlanningAIResponse, UIContext } from '../types';
import { paddingToMatchBlock } from '../../shared/img';
import {
  AIActionType,
  type AIArgs,
  callAiFn,
  warnGPT4oSizeLimit,
  appendFireworksInlineTransform,
} from './common';
import {
  automationUserPrompt,
  generateTaskBackgroundContext,
  systemPromptToTaskPlanning,
} from './prompt/llm-planning';
import { describeUserPage } from './prompt/util';

export async function plan(
  userInstruction: string,
  opts: {
    workflow?: string;
    context: UIContext;
    callAI?: typeof callAiFn<PlanningAIResponse>;
  },
): Promise<PlanningAIResponse> {
  const { callAI, context } = opts || {};
  const { screenshotBase64, screenshotBase64WithElementMarker, size } = context;
  const { description: pageDescription } = await describeUserPage(context);

  const systemPrompt = await systemPromptToTaskPlanning();
  const taskBackgroundContextText = generateTaskBackgroundContext(
    userInstruction,
    opts.workflow,
  );
  const userInstructionPrompt = await automationUserPrompt().format({
    pageDescription,
    taskBackgroundContext: taskBackgroundContextText,
  });

  let imagePayload = screenshotBase64WithElementMarker || screenshotBase64;

  warnGPT4oSizeLimit(size);

  const msgs: AIArgs = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: appendFireworksInlineTransform(imagePayload),
            detail: 'high',
          },
        },
        {
          type: 'text',
          text: userInstructionPrompt,
        },
      ],
    },
  ];

  const call = callAI || callAiFn;
  const { content, usage } = await call(msgs, AIActionType.PLAN);
  const rawResponse = JSON.stringify(content, undefined, 2);
  const planFromAI = content;
  const actions =
    (planFromAI.action ? [planFromAI.action] : planFromAI.actions) || [];
  const returnValue: PlanningAIResponse = {
    ...planFromAI,
    actions,
    rawResponse,
    usage,
  };

  assert(planFromAI, "can't get plans from AI");
  assert(
    actions.length > 0 || returnValue.finish,
    `Failed to plan actions: ${planFromAI.error || '(no error details)'}`,
  );

  return returnValue;
}
