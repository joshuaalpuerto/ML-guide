const fs = require('fs');
const path = require('path');
const { approximateTokenSize } = require('./tokenization');

// Define the keywords to search for
const keywords = [
  'react-hook-form',
  'useForm',
  'useFormContext',
  'formContext',
];

// Helper function to get all `.output.js` files in the fixtures directory
const getFixtureTestFiles = (dir) => {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.input.js'))
    .map((file) => path.join(dir, file));
};

/**
 * to run the script run the bash script:
 * For testing:
 * ./run-codemod-rhf-v6-to-v7.bash --test
 * For production:
 * ./run-codemod-rhf-v6-to-v7.bash --prod
 */
async function transform() {
  const args = process.argv;
  const TEST_RUN = args.includes('--test');
  const MAX_FILES = 20;
  let currentFileIndex = 0;

  // Execute the search for files to transform
  let matchingFiles = [];

  if (TEST_RUN) {
    matchingFiles = getFixtureTestFiles(
      path.resolve(__dirname, '__fixtures__')
    );
    // for specific testing
    // .filter((file) => {
    //   return file.includes('move-errors-to-formState.input.js');
    // });
  } else {
    matchingFiles = getTargetedFiles();
  }

  // we need to track the processed files so if something fail we can continue from where we left off
  const { completedFiles, updateProcessedFiles } = transactionHandler();

  // filter out the files that we already processed
  matchingFiles = matchingFiles.filter(
    (file) => !completedFiles.some((cf) => file.endsWith(cf))
  );

  try {
    for (const file of matchingFiles) {
      // only process MAX_FILES for batching so it's easier to debug or eyeball
      if (currentFileIndex >= MAX_FILES) {
        break;
      }

      console.log('\n--------------------------------\n');
      // Output the results
      console.log('Processing:', file);

      const fileContent = fs.readFileSync(file, 'utf8');

      const code = await generateCode(fileContent);

      let outputFile = file;

      // if test run just run it with our fixtures
      // replace our fixtures
      if (TEST_RUN) {
        // replace the file-test.input.js --> file-test.output.js
        outputFile = file.replace('.input.', `.output.`);
      }

      console.log('generating code:', outputFile);
      // remove extra new lines
      // and replace the actual file with the generated code.
      // once every thing run we will run prettier to format the code.
      fs.writeFileSync(outputFile, code, {
        encoding: 'utf8',
      });

      updateProcessedFiles(file);
      currentFileIndex++;
    }
  } catch (error) {
    console.error('Error processing', error);
  }
}

function getTargetedFiles() {
  let matchingFiles = [];

  const folders = {
    components: path.resolve(__dirname, '../../project/src/components'),
    pages: path.resolve(__dirname, '../../project/src/pages'),
  };

  for (const [key, folder] of Object.entries(folders)) {
    // target pages directory
    const rootDir = path.resolve(__dirname, folder);

    matchingFiles = findMatchingFiles(rootDir);

    // Define a file to track completed files

    // remove the base path  (dyamic path depend on user machine)
    // lets remove User/<username>/www/ and only keep project/src/components/File.js
    const savedPaths = matchingFiles.map(cleanUserPathFromFilePath);

    const filePath = path.join(__dirname, `targeted-${key}-files.json`);
    fs.writeFileSync(filePath, JSON.stringify(savedPaths, null, 2));
  }

  return matchingFiles;
}

async function generateCode(fileContent) {
  const migrationGuide = fs.readFileSync(
    path.resolve(__dirname, 'react_hook_form_v6_to_v7_migration.md'),
    'utf8'
  );

  const prompt = `You are a helpful assistant that can transform the code from react-hook-form v6 to v7. 
Follow the migration guide to transform the code given by the user. If the code adhere to the migration guide, just return the code.

The code must be wrapped in javascript block: \`\`\`js\`\`\` or \`\`\`javascript\`\`\`.

<MIGRATION_GUIDE>
${migrationGuide}
</MIGRATION_GUIDE>

<CODE_TO_TRANSFORM>
${fileContent}
</CODE_TO_TRANSFORM>
`;

  try {
    // add 512 for padding
    const maxTokens = approximateTokenSize(prompt) + 512;
    const streamResponse = await handleStreamResponse(
      'https://api.fireworks.ai/inference/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/deepseek-v3',
          // model: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
          max_tokens: maxTokens,
          top_p: 1,
          top_k: 40,
          stream: true,
          presence_penalty: 0,
          frequency_penalty: 0,
          temperature: 0,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      }
    );

    const code = streamResponse.match(
      /```(?:js|javascript)\n([\s\S]*?)\n```/
    )?.[1];

    if (!code) {
      throw new Error('No code generated');
    }
    return code;
  } catch (error) {
    console.error('Error requesting fireworks:', error);
  }
}

// Function to check if a file contains any of the keywords
const containsKeywords = (fileContent, keywords) => {
  return keywords.some((keyword) => fileContent.includes(keyword));
};

// Function to recursively traverse directories
const findMatchingFiles = (dir) => {
  const matchingFiles = [];

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectories
      matchingFiles.push(...findMatchingFiles(fullPath));
    } else if (
      fullPath.endsWith('.js') ||
      fullPath.endsWith('.jsx') ||
      fullPath.endsWith('.ts') ||
      fullPath.endsWith('.tsx')
    ) {
      // Read the file content
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      if (containsKeywords(fileContent, keywords)) {
        matchingFiles.push(fullPath);
      }
    }
  });

  return matchingFiles;
};

function transactionHandler() {
  // Define a file to track completed files
  const PROCESSED_FILE_PATH = path.join(__dirname, 'processed-files.json');

  const completedFiles = loadProcessedFiles();

  // Load the list of already processed files
  function loadProcessedFiles() {
    // ensure that it will genereated on every load
    if (!fs.existsSync(PROCESSED_FILE_PATH)) {
      fs.writeFileSync(PROCESSED_FILE_PATH, JSON.stringify([], null, 2));
    }

    return JSON.parse(fs.readFileSync(PROCESSED_FILE_PATH, 'utf8'));
  }

  // Save the updated list of completed files
  function saveProcessedFiles(completedFiles) {
    fs.writeFileSync(
      PROCESSED_FILE_PATH,
      JSON.stringify(completedFiles, null, 2)
    );
  }

  function updateProcessedFiles(file) {
    const cleanedFile = cleanUserPathFromFilePath(file);
    completedFiles.push(cleanedFile);
    saveProcessedFiles(completedFiles);
  }

  function removeProcessedFiles() {
    // clear the file
    saveProcessedFiles([]);
  }

  return {
    PROCESSED_FILE_PATH,
    completedFiles,
    loadProcessedFiles,
    saveProcessedFiles,
    updateProcessedFiles,
    removeProcessedFiles,
  };
}

function cleanUserPathFromFilePath(filePath) {
  const splitPoint = filePath.indexOf('project');
  return filePath.slice(splitPoint);
}

// we have to use streaming because otherwise fireworks will timeout
async function handleStreamResponse(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const decoder = new TextDecoder('utf8');
    let jsonContent = '';
    // Iterate through the chunks in the response body using for-await...of
    for await (const chunk of response.body) {
      const decodedChunk = await decoder.decode(chunk, { stream: true });

      // Clean up the data
      const concatenatedChunk = decodedChunk
        .split('\n')
        .map((line) => line.replace('data: ', ''))
        .filter((line) => line.length > 0)
        .filter((line) => line !== '[DONE]')
        .reduce((acc, line, index) => {
          // due to some chunk returns its JSON format being split across chunks. we need to do this.
          // ex it returns a no closing JSON: {"id":"90c693be-9de4-4bd7-baae-8ff9e403e464","object":"chat.completion.chunk","created":1737830933,"model":"accounts/fireworks/models/deepseek-v3","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}],
          // so we just need to add it as is so the next chunk which will be error also just be added as is.
          // next chunk: "usage":null}
          // ==> {"id":"90c693be-9de4-4bd7-baae-8ff9e403e464","object":"chat.completion.chunk","created":1737830933,"model":"accounts/fireworks/models/deepseek-v3","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}],,"usage":null}
          return (acc += line);
        }, '');

      jsonContent += concatenatedChunk;
    }
    jsonContent = handleStreamResult(jsonContent);
    return jsonContent;
  } catch (error) {
    console.error('Error handling stream response:', error);
  }
}

function handleStreamResult(jsonContent) {
  // if the jsonContent is not a valid JSON, then we need to throw an error// we include usage because anyway only the last chunk will have that
  jsonContent = jsonContent?.replaceAll(
    '"usage":null}{"id"',
    // replace to make it valid json
    '"usage":null},{"id"'
  );
  jsonContent = JSON.parse(`[${jsonContent}]`);
  return jsonContent.reduce((acc, chunk) => {
    const content = chunk.choices[0].delta.content;
    if (content) {
      acc += content;
    }
    return acc;
  }, '');
}

transform();
