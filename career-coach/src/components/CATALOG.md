# Components Catalog (Authoritative Inventory)

Last Updated: 2025-11-08

Purpose: Inventory of presentational UI only; all domain logic lives in `src/libs/`. Avoid duplicating non-UI concerns.

## Update Policy
1. Add new entry BEFORE committing the new component.
2. Reflect rename/remove in the same PR that changes the file.
3. When variant surface, accessibility semantics, or layout contract changes, append a bullet to Maintenance Log.
4. Keep entries minimal; move extensive docs into component file comments.
5. No stale entries—missing update is a Definition of Done failure.

## Template (Use for New Entry)
```
### <Category>
- `<relative-path>` – <1-line responsibility>
	Notes: <optional accessibility / edge-case>
	Maintenance Triggers: <what requires catalog + log update>
```

---
## Catalog Entries

### Chat
- `chat/ChatInterface.tsx` – Renders message list + input wrapper (presentation only).
	Maintenance Triggers: Message rendering strategy change, structural layout refactor.
- `chat/MessageBubble.tsx` – Styled bubble variant per role (user vs assistant).
	Maintenance Triggers: New role type, color scale update, accessibility semantics.

### Upload
- `upload/FileUpload.tsx` – Drag & drop CV upload UI; emits file via callbacks.
	Maintenance Triggers: New accepted file types display, accessibility pattern change.

### Preferences
- `preferences/PreferenceStepCompanyStage.tsx` – Step UI for selecting preferred company growth stage.
	Maintenance Triggers: Stage taxonomy change, input mechanism change.
- `preferences/PreferenceStepLocation.tsx` – Step UI for geographic location preferences.
	Maintenance Triggers: Region grouping change, input component swap.
- `preferences/PreferenceStepWorkArrangement.tsx` – Step UI for on-site / hybrid / remote selection.
	Maintenance Triggers: New arrangement type, selection pattern change.
- `preferences/PreferenceValidationMessages.tsx` – Displays validation / guidance messages for preference inputs.
	Maintenance Triggers: New validation category, alert semantics revision.

### Shortlist
- `shortlist/ShortlistDisplay.tsx` – Presents ranked companies and scores (pure display).
	Maintenance Triggers: Score field additions/removals, list item structure change.

### Users (Placeholder)
- `users/` – Reserved for future user-related presentational tables/cards.
	Maintenance Triggers: First user component addition (convert placeholder entry).

### UI Primitives
- `ui/avatar.tsx` – Avatar primitive (image or initials fallback).
	Maintenance Triggers: Fallback logic change, size scale update.
- `ui/button.tsx` – Button primitive with CVA variants (size/intent/state).
	Maintenance Triggers: New intent, state handling change, aria adjustments.
- `ui/card.tsx` – Card layout container with header/content/footer slots.
	Maintenance Triggers: Slot contract change, elevation token update.
- `ui/input.tsx` – Text input primitive (controlled via props).
	Maintenance Triggers: Validation state styling addition, aria attribute change.
- `ui/MultiSelect.tsx` – Multi-select control for choosing multiple options.
	Maintenance Triggers: Selection interaction change, keyboard nav enhancement.
- `ui/textarea.tsx` – Multi-line text input primitive.
	Maintenance Triggers: Auto-resize feature addition, accessibility label pattern change.

---
## Maintenance Log
Record concise bullets for UI-impacting changes. Newest first.
