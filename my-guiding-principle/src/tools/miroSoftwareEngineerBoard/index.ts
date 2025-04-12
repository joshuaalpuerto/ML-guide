import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { type CallToolResult, FunctionToolInterface } from '@joshuaalpuerto/mcp-agent';
import { getMiroEngineeringBoard } from '../miro';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const softwareEngineeringPrinciples: FunctionToolInterface = {
  name: 'Software engineering principles handbook',
  description: 'Handbook of software engineering principles to guide the user to their situation',
  parameters: {
    type: 'object',
    properties: {
      scenario: {
        type: 'string',
        description: 'The scenario to guide the user to',
      },
    },
    required: ['scenario'],
  },
  execute: async (): Promise<CallToolResult> => {
    const miroEngineeringBoard = await getMiroEngineeringBoard({ dirpath: __dirname });
    const text = await miroEngineeringBoard.getMiroTextFromMindmap();
    return { content: [{ type: 'text', text }] };
  }
}