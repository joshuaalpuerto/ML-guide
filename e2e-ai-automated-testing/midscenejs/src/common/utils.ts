import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type {
  ElementTreeNode,
  PlaywrightParserOpt,
  UIContext,
} from '../core';
import { NodeType } from '../shared/extractor/constants';
import type { ElementInfo } from '../shared/extractor/index';
import { traverseTree, treeToList } from '../shared/extractor';
import { findNearestPackageJson } from '../shared/fs';
import { compositeElementInfoImg, resizeImgBase64 } from '../shared/img';
import { uuid } from '../shared/utils';
import { WebElementInfo } from './web-element';
import type { WebPage } from './page';
export type WebUIContext = UIContext<WebElementInfo> & {
  url: string;
};

export async function parseContextFromWebPage(
  page: WebPage,
  _opt?: PlaywrightParserOpt,
): Promise<WebUIContext> {
  assert(page, 'page is required');

  const url = await page.url();
  let screenshotBase64: string;
  let tree: ElementTreeNode<ElementInfo>;

  await Promise.all([
    page.screenshotBase64().then((base64) => {
      screenshotBase64 = base64;
    }),
    page.getElementsNodeTree().then(async (treeRoot) => {
      tree = treeRoot;
    }),
  ]);

  const webTree = traverseTree(tree!, (elementInfo) => {
    const { rect, id, content, attributes, locator, indexId } = elementInfo;
    return new WebElementInfo({
      rect,
      locator,
      id,
      content,
      attributes,
      indexId,
    });
  });

  const elementsInfo = treeToList(webTree);

  assert(screenshotBase64!, 'screenshotBase64 is required');

  const elementsPositionInfoWithoutText = elementsInfo!.filter(
    (elementInfo) => {
      if (elementInfo.attributes.nodeType === NodeType.TEXT) {
        return false;
      }
      return true;
    },
  );

  const size = await page.size();

  if (size.dpr && size.dpr > 1) {
    // console.time('resizeImgBase64');
    screenshotBase64 = await resizeImgBase64(screenshotBase64, {
      width: size.width,
      height: size.height,
    });
    // console.timeEnd('resizeImgBase64');
  }

  let screenshotBase64WithElementMarker = screenshotBase64;
  if (_opt?.ignoreMarker) {
    screenshotBase64WithElementMarker = screenshotBase64;
  } else {
    screenshotBase64WithElementMarker = await compositeElementInfoImg({
      inputImgBase64: screenshotBase64,
      elementsPositionInfo: elementsPositionInfoWithoutText,
      size,
    });
  }

  return {
    content: elementsInfo!,
    tree: webTree,
    size,
    screenshotBase64: screenshotBase64!,
    screenshotBase64WithElementMarker: screenshotBase64WithElementMarker,
    url,
  };
}

export async function getExtraReturnLogic(tree = false) {
  const pathDir = findNearestPackageJson(__dirname);
  assert(pathDir, `can't find pathDir, with ${__dirname}`);
  const scriptPath = path.join(pathDir, '/dist/extractor.umd.js');
  const elementInfosScriptContent = readFileSync(scriptPath, 'utf-8');
  if (tree) {
    return `${elementInfosScriptContent}Extractor.webExtractNodeTree()`;
  }
  return `${elementInfosScriptContent}Extractor.webExtractTextWithPosition()`;
}

const sizeThreshold = 3;
// async function alignElements(
//   elements: ElementInfo[],
//   page: WebPage,
// ): Promise<WebElementInfo[]> {
//   const validElements = elements.filter((item) => {
//     return (
//       item.rect.height >= sizeThreshold && item.rect.width >= sizeThreshold
//     );
//   });
//   const textsAligned: WebElementInfo[] = [];
//   for (const item of validElements) {
//     const { rect, id, content, attributes, locator, indexId } = item;
//     textsAligned.push(
//       new WebElementInfo({
//         rect,
//         locator,
//         id,
//         content,
//         attributes,
//         page,
//         indexId,
//       }),
//     );
//   }

//   return textsAligned;
// }



/**
 * Get the current execution file name
 * @returns The name of the current execution file
 */
export function getCurrentExecutionFile(trace?: string): string | false {
  const error = new Error();
  const stackTrace = trace || error.stack;
  const pkgDir = process.cwd() || '';
  if (stackTrace) {
    const stackLines = stackTrace.split('\n');
    for (const line of stackLines) {
      if (
        line.includes('.spec.') ||
        line.includes('.test.') ||
        line.includes('.ts') ||
        line.includes('.js')
      ) {
        const match = line.match(/(?:at\s+)?(.*?\.(?:spec|test)\.[jt]s)/);
        if (match?.[1]) {
          const targetFileName = match[1]
            .replace(pkgDir, '')
            .trim()
            .replace('at ', '');
          return targetFileName;
        }
      }
    }
  }
  return false;
}

const testFileIndex = new Map<string, number>();

export function generateCacheId(fileName?: string): string {
  let taskFile = fileName || getCurrentExecutionFile();
  if (!taskFile) {
    taskFile = uuid();
    console.warn(
      'Midscene - using random UUID for cache id. Cache may be invalid.',
    );
  }

  if (testFileIndex.has(taskFile)) {
    const currentIndex = testFileIndex.get(taskFile);
    if (currentIndex !== undefined) {
      testFileIndex.set(taskFile, currentIndex + 1);
    }
  } else {
    testFileIndex.set(taskFile, 1);
  }
  return `${taskFile}-${testFileIndex.get(taskFile)}`;
}

export const ERROR_CODE_NOT_IMPLEMENTED_AS_DESIGNED =
  'NOT_IMPLEMENTED_AS_DESIGNED';
