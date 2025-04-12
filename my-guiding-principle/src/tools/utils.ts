/**
 * Pauses execution for specified number of milliseconds
 * @param ms Number of milliseconds to sleep
 * @returns Promise that resolves after the sleep duration
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export type MiroNode = {
  id: string,
  data: { nodeView: { data: { content: string }, } },
  parent?: { id: string }
};

type MiroNodeResult = {
  id: string;
  content: string;
  parentId: string | null;
  nodes: MiroNodeResult[];
};

export function buildMiroNodeTrees(data: MiroNodeResult[]): MiroNodeResult[] {
  let trees = data
    .filter(d => !d.parentId)
    .map(tree => buildNodeTreeRecursively(tree, data))

  return trees
}

function buildNodeTreeRecursively(tree: MiroNodeResult, data: MiroNodeResult[]): MiroNodeResult {
  let t = { ...tree }
  const children = data.filter((d) => t.id === d.parentId)
  t.nodes = children.map((c) => {
    return buildNodeTreeRecursively(c, data)
  })

  return t
}

/**
 * returns
 * Root node text
 *   Sub node text 1
 *     Sub node text 1.1
 *       .. so on
 *   Sub node text 2
 *   Sub node text 3
 * Root node text
 */
export function buildMiroTextFromNodeTree(nodes: MiroNodeResult[], tabDepth = 0) {
  let text = ''
  nodes.forEach(node => {
    let sectionTabDepth = tabDepth * 2
    text += `${' '.repeat(sectionTabDepth)} ${node.content}\n`;
    node.nodes.forEach((child) => {
      let childSectionTabDepth = (sectionTabDepth + 1) * 2
      text += `${' '.repeat(childSectionTabDepth)} ${child.content}\n`;
      text += ` ${buildMiroTextFromNodeTree(child.nodes, tabDepth + 1)}`;
    });
  })

  return text;
}