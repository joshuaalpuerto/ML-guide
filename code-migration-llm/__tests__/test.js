const fs = require('fs');
const path = require('path');

// Directory containing test fixtures
const fixturesDir = path.resolve(__dirname, '../__fixtures__');

// Helper function to get all `.output.js` files in the fixtures directory
const getFixtureFiles = (dir) => {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.output.js'))
    .map((file) => ({
      output: path.join(dir, file),
    }));
};

// Create a describe block for each fixture file
getFixtureFiles(fixturesDir).forEach(({ output }) => {
  const filename = path.basename(output);

  describe(`Codemod Snapshot Tests: ${filename}`, () => {
    test('matches snapshot', () => {
      const expectedOutputCode = fs.readFileSync(output, 'utf-8');
      // remove
      expect(expectedOutputCode?.trimEnd()).toMatchSnapshot();
    });
  });
});
