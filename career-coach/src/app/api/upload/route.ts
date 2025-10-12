import { NextResponse } from 'next/server';

import { Agent, LLMFireworks } from '@joshuacalpuerto/mcp-agent';
import { PDFParse } from 'pdf-parse';
import { pathToFileURL, fileURLToPath } from 'url'
import { dirname, resolve } from 'path';
import { UserCVParsedSchema, UserCVParsed } from '@/types/user-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workerPath = resolve(__dirname, '..', '..', '..', '..', 'node_modules/pdf-parse/dist/browser/pdf.worker.mjs');
const workerUrl = pathToFileURL(workerPath).href;
console.log(workerUrl);

// Set worker before creating PDFParse instances
PDFParse.setWorker(workerUrl);



// Initialize LLM outside handler to reuse across requests (stateless)
const llm = new LLMFireworks(process.env.OPENAI_MODEL ?? "", {
  maxTokens: 1536,
  temperature: 0.2,
  stream: true,
});

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, message: 'Invalid content type' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'File missing' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ success: false, message: 'Only PDF files are allowed' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Read PDF content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const fullText = (await parser.getText())?.text?.replace(/\s+$/g, '').trim();

    // Build extraction prompt referencing schema constraints.
    const prompt = `You are a CV parsing assistant. Extract structured data from the provided resume text into strictly valid JSON schema.\n\nResume Text:\n"""\n${fullText}\n"""`;

    // Initialize agent (no external MCP servers needed yet; can add tooling later)
    const agent = await Agent.initialize({
      llm,
      name: 'cv_parser',
      description: 'Parses CV PDF text into structured profile context.',
      serverConfigs: [],
    });

    // Use agent to generate a direct string completion enforcing response format
    const llmResponse = await agent.generateStr(prompt, { responseFormat: profileContextSchemaResponseFormat as any, stream: true });

    // rawTextSnippet removed from schema; no injection logic.
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || '{}');
    const validation = UserCVParsedSchema.safeParse(parsed);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Validation failed', issues: validation.error.issues }, { status: 422 });
    }

    const profile: UserCVParsed = validation.data;

    return NextResponse.json({ success: true, message: 'File uploaded & parsed', profile });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Upload error' }, { status: 500 });
  }
}

export const profileContextSchemaResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'parsed_profile',
    strict: true,
    description: 'Structured CV profile: skills, work experience entries, and education entries.',
    schema: {
      type: 'object',
      strict: true,
      properties: {
        skills: {
          type: 'array',
          description: 'Deduplicated list of skill tokens or short phrases (max 200).',
          maxItems: 200,
          items: { type: 'string', description: 'Single skill term or concise phrase' }
        },
        workExperience: {
          type: 'array',
          description: 'Chronological list of work experience entries (most recent first).',
          items: {
            type: 'object',
            description: 'Single work experience entry.',
            properties: {
              companyName: { type: 'string', description: 'Company or organization name.' },
              startDate: { type: 'string', description: 'Start date (YYYY-MM or YYYY).' },
              endDate: { type: ['string', 'null'] as any, description: 'End date (YYYY-MM or YYYY) or null if current.' },
              summary: { type: 'string', description: 'Impact-focused summary of responsibilities & achievements.' }
            },
            required: ['companyName', 'startDate', 'summary'],
            additionalProperties: false
          }
        },
        education: {
          type: 'array',
          description: 'Array of education entries (degree, institution, years).',
          items: { type: 'string', description: 'One education entry summary' }
        }
      },
      required: ['skills', 'workExperience', 'education'],
      additionalProperties: false
    }
  }
};