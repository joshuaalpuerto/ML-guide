import path from 'path';
import fs from 'fs';

import { sleep, buildMiroNodeTrees, buildMiroTextFromNodeTree, MiroNode } from './utils';

export function getMiroEngineeringBoard({ dirpath }: { dirpath: string }) {
  const filePath = path.join(dirpath, 'board.json');

  return {
    filePath,
    getMiroTextFromMindmap,
    getMiroMindmap,
    createMiroMindmap,
  }

  async function getMiroTextFromMindmap() {
    const mindmap = await getMiroMindmap();
    return buildMiroTextFromNodeTree(mindmap);
  }

  async function getMiroMindmap() {
    if (!fs.existsSync(filePath)) {
      await createMiroMindmap();
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async function createMiroMindmap() {
    // We will first check if we have json exist on the same directory as tools
    const data = await getSofwareEngineeringPrinciplesDataRecursively();
    const trees = buildMiroNodeTrees(data);
    // save the tree to the file
    fs.writeFileSync(filePath, JSON.stringify(trees));
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async function getSofwareEngineeringPrinciplesData(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${process.env.MIRO_REST_API_KEY}`
      }
    });

    const data = await response.json();
    return data;
  }

  async function getSofwareEngineeringPrinciplesDataRecursively() {
    let data: any[] = []
    let nextCursor: string | null = ''

    while (typeof nextCursor === 'string') {
      await sleep(1000);
      const response = await getSofwareEngineeringPrinciplesData(`https://api.miro.com/v2-experimental/boards/${process.env.MIRO_SOFTWARE_ENGINEERING_BOARD_ID}/mindmap_nodes?limit=10&cursor=${nextCursor}`);
      let optimizedData = response.data.map((item: MiroNode) => {
        return {
          id: item.id,
          content: item.data.nodeView.data.content,
          parentId: item?.parent?.id || null,
          nodes: [],
        }
      })

      data = data.concat(optimizedData)
      nextCursor = response.cursor || null;
    }

    return data;
  }
}