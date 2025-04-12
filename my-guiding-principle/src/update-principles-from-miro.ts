import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import { getMiroEngineeringBoard } from "./tools/miro";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script will update the principles from the miro board
// It will read the principles from the miro board
// It will then update the principles in the miro board
// It will then save the principles to the miro board
async function main() {
  // use path of the miroSoftwareEngineerBoard.json file
  const miroEngineeringBoard = await getMiroEngineeringBoard({ dirpath: path.join(__dirname, 'tools/miroSoftwareEngineerBoard') });
  await miroEngineeringBoard.createMiroMindmap();
}

main();
