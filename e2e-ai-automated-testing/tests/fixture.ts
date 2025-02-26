import { test as base } from '@playwright/test';
import type { PlayWrightAiFixtureType } from '../midscenejs/src/playwright/ai-fixture';
import { PlaywrightAiFixture } from '../midscenejs/src/playwright/ai-fixture';

export const test = base.extend<PlayWrightAiFixtureType>(PlaywrightAiFixture());