---
mode: agent
description: 'Identify recent changes in the folder structure and update FOLDER_STRUCTURE.md.'
---

# Rule: Identify Recent Changes and Update Folder Structure Documentation

## Goal
To keep the folder structure documentation (`FOLDER_STRUCTURE.md`) up-to-date by identifying recent changes in the `src/` directory and reflecting those changes accurately in the documentation.

## Process
1. Run the folder inventory command:
  ```bash
  cd src && tree -I 'node_modules|cache|test_*|prompts|.specify|specs|components.json|.gitignore|FOLDER_STRUCTURE.md'
  ```
  Capture the full output (including the final "X directories, Y files" line).
2. Parse and classify differences against the current `FOLDER_STRUCTURE.md`:
  - List files/directories present in tree output but missing from the markdown.
  - List entries in markdown that no longer appear in the tree (treat as removed).
  - Detect placeholder namespaces (empty dirs or marker-only content).
3. For each difference category apply the following rules:
  - **New Files/Dirs**: Add an entry with concise purpose. If intent unclear, mark as "(placeholder / confirm usage)".
  - **Removed**: Delete the corresponding markdown entry.
  - **Modified Purpose**: Update description reflecting current responsibility (keep same path token style).
4. Derive structural documentation adjustments (dynamic, not hard-coded):
  - Create or update a `### Components (Misc)` section ONLY if new component files don't fit existing categorized groups.
  - Add or update a `### Namespace Clarification` section if overlapping or legacy root namespaces coexist (e.g., both `src/lib/` and `src/libs/`).
  - Add or refresh an `### Inventory Snapshot` section showing: "Current tree (<ISO date>): <directory_count> directories, <file_count> files." plus bullet list of placeholder or stub directories (empty or marker-only).
  - Annotate any empty directories (no implementation files like `.ts`, `.tsx`, `.js`) as placeholders.
  - Remove entries whose files no longer exist; if a directory persists but file removed, update description or delete file entry accordingly.
  - Update descriptions if file roles changed (e.g., expanded scope, renamed responsibilities); keep concise, single-sentence style.
5. Preserve existing section ordering; insert newly needed sections after "### High-Level Grouping" and before "## Suggested Future Enhancements".
6. Maintain entry formatting: `- \`path\` - description.` Use present tense and focus on purpose, not implementation detail.
7. Avoid duplicating entries for files already represented by higher-level grouping descriptions unless they serve a distinct, unique purpose.
8. Update the `Generated:` date stamp at the footer to today's date (ISO: YYYY-MM-DD).
9. Validate the updated markdown:
  - Ensure removed files are not still referenced.
  - Confirm heading hierarchy and style consistency.
  - Check for consistent backtick usage and no trailing whitespace.
10. (Optional) If directory/file counts changed from prior snapshot, update the inventory section accordingly.

### Output Acceptance Criteria
The final `FOLDER_STRUCTURE.md` must:
- Reflect all detected additions, removals, modifications, and placeholders per steps 2–4.
- Reflect accurate counts and current date.
- Contain no stale paths.
- Maintain concise, purpose-driven descriptions (avoid implementation detail bloat).

## Requirements
- Ensure that the folder structure and code map documentation are accurate and up-to-date.
- Use clear and concise descriptions for each file to aid in understanding the codebase structure.
- Add new sections only where they introduce net-new conceptual clarity (namespace, inventory, misc components).
- Mark uncertain/demo files for follow-up rather than guessing their purpose.
- Distinguish placeholders explicitly to reduce noise in LLM prompts.
- Do not hard-code file-specific mandatory additions; rely on dynamic detection rules.