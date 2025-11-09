---
mode: agent
description: 'Read folder structure and update code catalog (./CATALOG.md) accordingly.'
tools: ['edit/editFiles', 'search/listDirectory', 'search/readFile', 'changes']
---

# Update Catalog Prompt

## Goal
- Keep `${fileDirname}/CATALOG.md` perfectly synchronized with actual source files so a junior developer can quickly learn responsibilities, exports, and maintenance triggers.

## Process
1. Verify `${fileDirname}/CATALOG.md` exists (abort with error if missing).
2. Enumerate `.ts` / `.tsx` files (exclude `*.d.ts`, tests, `__tests__`, markdown). Depth: all subfolders;
3. Parse catalog: capture Last Updated date, collect existing relative paths, map categories (`### <Category>`) to their entry lines (bullets starting with `- `).
4. Normalize filesystem paths relative to `${fileDirname}`.
5. Categorize each file (mapping: `apis->APIs`, `ui/*->UI Primitives`, `utils.ts->Utilities`, etc.).
6. Compute sets: `missing = fs - catalog`, `stale = catalog - fs`; detect probable renames via Levenshtein distance ≤3 on basenames.
7. Apply mutations:
	 - Update Last Updated date to today (YYYY-MM-DD).
	 - Remove stale entries (or treat as rename if matched to a missing file).
	 - Insert missing entries under correct category (create heading if absent).
8. Generate entry content using template + heuristics (see below) and alphabetize entries within each category.
9. Remove empty category headings (retain foundational: UI Primitives, APIs if present historically).
10. Append a single Maintenance Log bullet summarizing Added / Removed / Renamed paths.
11. Write the updated file and output summary counts (adds, removes, renames).
12. (Optional) Re-parse to assert zero stale entries remain.

### Heuristics
- Responsibility: first comment sentence or inferred from filename (e.g. `cv-parser.ts` → "CV text → structured user data extraction").
- Exports: list up to 3 primary named exports (functions / classes / types).
- Maintenance Triggers examples: parsing heuristic change, scoring dimension change, accessibility semantics update, new variant/state, schema change.
- Skip trivial `index.ts` unless >30 LOC or >1 named export.


### Maintenance Log Format
`YYYY-MM-DD: Added a,b; Removed c; Renamed old -> new` (combine all operations for the run).

### Pseudocode
```
paths = listFiles(${fileDirname})
catalog = parseCatalog(CATALOG.md)
missing = paths - catalog.paths
stale = catalog.paths - paths
renames = detectRenames(stale, missing)
applyUpdates(catalog, missing, stale, renames)
writeCatalog()
```

## Requirements (Success Criteria)
- Output is an updated `CATALOG.md` with:
	- Current, unique entries for every real file (no stale paths).
	- Refreshed Last Updated date.
	- Alphabetically sorted entries per category; empty non-core categories removed.
	- Maintenance Log bullet summarizing changes this run.
- Entries are concise (≤1 responsibility line + optional lines) and scannable (<5s comprehension).
- Rename operations reflected either by updated entry plus Maintenance Log rename note.
renames = detectRenames(stale, missing)
