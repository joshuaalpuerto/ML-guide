import type { ElementTreeNode, Point, Size } from '../core';
import { getTmpFile, sleep } from '../core/utils';
import type { ElementInfo } from '../shared/extractor/index';
import { treeToList } from '../shared/extractor';
import { base64Encoded } from '../shared/img';
import type { Page as PlaywrightPage } from 'playwright';
import type { WebKeyInput } from '../common/page';
import { getExtraReturnLogic } from '../common/utils';
import type { AbstractPage } from './types';
import type { MouseButton } from './types';

export class Page<
  AgentType extends 'playwright',
  PageType extends PlaywrightPage,
> implements AbstractPage {
  protected underlyingPage: PageType;
  private viewportSize?: Size;
  pageType: AgentType;

  private async evaluate<R>(
    pageFunction: string | ((...args: any[]) => R | Promise<R>),
    arg?: any,
  ): Promise<R> {
    return (this.underlyingPage as PlaywrightPage).evaluate(pageFunction, arg);
  }

  constructor(underlyingPage: PageType, pageType: AgentType) {
    this.underlyingPage = underlyingPage;
    this.pageType = pageType;
  }

  async waitForNavigation() {
    // issue: https://github.com/puppeteer/puppeteer/issues/3323
    await (this.underlyingPage as PlaywrightPage).waitForSelector('html');
  }

  // @deprecated
  async getElementsInfo() {
    // const scripts = await getExtraReturnLogic();
    // const captureElementSnapshot = await this.evaluate(scripts);
    // return captureElementSnapshot as ElementInfo[];
    await this.waitForNavigation();
    const tree = await this.getElementsNodeTree();
    return treeToList(tree);
  }

  async getElementsNodeTree() {
    // ref: packages/web-integration/src/playwright/ai-fixture.ts popup logic
    // During test execution, a new page might be opened through a connection, and the page remains confined to the same page instance.
    // The page may go through opening, closing, and reopening; if the page is closed, evaluate may return undefined, which can lead to errors.
    await this.waitForNavigation();
    const scripts = await getExtraReturnLogic(true);
    const captureElementSnapshot = await this.evaluate(scripts);
    return captureElementSnapshot as ElementTreeNode<ElementInfo>;
  }

  async size(): Promise<Size> {
    if (this.viewportSize) return this.viewportSize;
    const sizeInfo: Size = await this.evaluate(() => {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        dpr: window.devicePixelRatio,
      };
    });
    this.viewportSize = sizeInfo;
    return sizeInfo;
  }

  async screenshotBase64(): Promise<string> {
    const imgType = 'jpeg';
    const path = getTmpFile(imgType)!;
    await this.waitForNavigation();
    await this.underlyingPage.screenshot({
      path,
      type: imgType,
      quality: 90,
    });

    return base64Encoded(path, true);
  }

  async url(): Promise<string> {
    return this.underlyingPage.url();
  }

  get mouse() {
    return {
      click: async (
        x: number,
        y: number,
        options?: { button?: MouseButton; count?: number },
      ) =>
        this.underlyingPage.mouse.click(x, y, {
          button: options?.button || 'left',
          count: options?.count || 1,
        }),
      wheel: async (deltaX: number, deltaY: number) => {

        await (this.underlyingPage as PlaywrightPage).mouse.wheel(
          deltaX,
          deltaY,
        );
      },
      move: async (x: number, y: number) =>
        this.underlyingPage.mouse.move(x, y),
      drag: async (
        from: { x: number; y: number },
        to: { x: number; y: number },
      ) => {

        // Playwright doesn't have a drag method, so we need to simulate it
        await (this.underlyingPage as PlaywrightPage).mouse.move(
          from.x,
          from.y,
        );
        await (this.underlyingPage as PlaywrightPage).mouse.down();
        await (this.underlyingPage as PlaywrightPage).mouse.move(to.x, to.y);
        await (this.underlyingPage as PlaywrightPage).mouse.up();
      },
    };
  }

  get keyboard() {
    return {
      type: async (text: string) =>
        this.underlyingPage.keyboard.type(text, { delay: 80 }),

      press: async (
        action:
          | { key: WebKeyInput; command?: string }
          | { key: WebKeyInput; command?: string }[],
      ) => {
        const keys = Array.isArray(action) ? action : [action];
        for (const k of keys) {
          const commands = k.command ? [k.command] : [];
          await this.underlyingPage.keyboard.down(k.key, { commands });
        }
        for (const k of [...keys].reverse()) {
          await this.underlyingPage.keyboard.up(k.key);
        }
      },
      down: async (key: WebKeyInput) => {
        this.underlyingPage.keyboard.down(key);
      },
      up: async (key: WebKeyInput) => {
        this.underlyingPage.keyboard.up(key);
      },
    };
  }

  async clearInput(element: ElementInfo): Promise<void> {
    if (!element) {
      console.warn('No element to clear input');
      return;
    }

    const isMac = process.platform === 'darwin';
    if (isMac) {
      await this.mouse.click(element.center[0], element.center[1]);
      await this.underlyingPage.keyboard.down('Meta');
      await this.underlyingPage.keyboard.press('a');
      await this.underlyingPage.keyboard.up('Meta');
    } else {
      await this.mouse.click(element.center[0], element.center[1]);
      await this.underlyingPage.keyboard.down('Control');
      await this.underlyingPage.keyboard.press('a');
      await this.underlyingPage.keyboard.up('Control');
    }
    await sleep(100);
    await this.keyboard.press([{ key: 'Backspace' }]);
  }

  private async moveToPoint(point?: Point): Promise<void> {
    if (point) {
      await this.mouse.move(point.left, point.top);
    }
  }

  async scrollUntilTop(startingPoint?: Point): Promise<void> {
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(0, -9999999);
  }

  async scrollUntilBottom(startingPoint?: Point): Promise<void> {
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(0, 9999999);
  }

  async scrollUntilLeft(startingPoint?: Point): Promise<void> {
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(-9999999, 0);
  }

  async scrollUntilRight(startingPoint?: Point): Promise<void> {
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(9999999, 0);
  }

  async scrollUp(distance?: number, startingPoint?: Point): Promise<void> {
    const innerHeight = await this.evaluate(() => window.innerHeight);
    const scrollDistance = distance || innerHeight * 0.7;
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(0, -scrollDistance);
  }

  async scrollDown(distance?: number, startingPoint?: Point): Promise<void> {
    const innerHeight = await this.evaluate(() => window.innerHeight);
    const scrollDistance = distance || innerHeight * 0.7;
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(0, scrollDistance);
  }

  async scrollLeft(distance?: number, startingPoint?: Point): Promise<void> {
    const innerWidth = await this.evaluate(() => window.innerWidth);
    const scrollDistance = distance || innerWidth * 0.7;
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(-scrollDistance, 0);
  }

  async scrollRight(distance?: number, startingPoint?: Point): Promise<void> {
    const innerWidth = await this.evaluate(() => window.innerWidth);
    const scrollDistance = distance || innerWidth * 0.7;
    await this.moveToPoint(startingPoint);
    return this.mouse.wheel(scrollDistance, 0);
  }

  async destroy(): Promise<void> { }
}
