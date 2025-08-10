# My Engineering Guiding Principles

## Installation

```bash
# Install dependencies
pnpm install
```

## Usage

Run the tool with a specific engineering scenario:

```bash
pnpm start --scenario="When to refactor code?"
```

## Examples

Here are some example scenarios you can ask about:

- Code organization best practices
- When to refactor code
- How to handle technical debt
- Design patterns implementation
- Code review guidelines
- Testing strategies

## Update Miro board (fetch and store mindmap locally)

This script fetches the mind map nodes from your Miro board and writes them to `src/tools/miroSoftwareEngineerBoard/board.json`.

1) Create a `.env` in the project root with:
```bash
MIRO_REST_API_KEY=<your_miro_access_token>
MIRO_SOFTWARE_ENGINEERING_BOARD_ID=<your_board_id>
```
- The board ID can be taken from your Miro URL: `https://miro.com/app/board/<BOARD_ID>/`

2) Run the update script:
```bash
pnpm run update-principles
```

3) Output:
- A fresh or updated `src/tools/miroSoftwareEngineerBoard/board.json` containing the mind map tree.

## Tech Stack

- TypeScript
- Node.js
- @joshuacalpuerto/mcp-agent