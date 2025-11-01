---
description: 'UI Components Guide (src/components)'
applyTo: '**/src/components/**.tsx'
---

# UI Components (src/components)
Mission: Pure presentation only. NO business logic, NO data fetching.

BELONGS:
- Reusable UI primitives (buttons, cards, inputs, avatar)
- Domain compositions (chat interface, preference step, shortlist, users table)
- Local ephemeral UI state (open/closed, hovered, controlled input value)

DOES NOT BELONG:
- API calls, parsing, scoring, evaluation → move to `src/libs/**`
- Complex data transforms → `libs`
- Global config/constants → `libs`

BEFORE CREATING/MODIFYING (STOP checklist):
1. Purely UI? If not → `libs`.
2. Can I extend existing primitive? Prefer extend over new file.
3. Need style variants? Use CVA, not scattered classes.
4. Interactive? Ensure focus-visible + a11y.
5. Will it appear ≥3 times? If yes, component; otherwise inline.

GOLDEN RULES:
- Accept data via props; never fetch.
- Use semantic Tailwind tokens (e.g. `text-muted-foreground`).
- Keep Tailwind ordering: layout → size → spacing → typography → color → effects → animation.
- No removed accessibility patterns.

IF UNSURE: Default to moving logic to `libs` and keep component dumb.

---
## 0. Scope
UI only. Business logic & async live in `src/libs/**`. Shared types go in `src/types/**`.

---
## 1. Catalog (Keep Updated) — Update THIS when adding/removing components.
Do NOT rename without explicit instruction.

Chat:
- `chat/ChatInterface.tsx` – Orchestrates message list + input.
- `chat/MessageBubble.tsx` – Role-styled bubble (user vs assistant).

Upload:
- `upload/FileUpload.tsx` – Drag/drop CV uploader with feedback.

Preferences:
- `preferences/PreferenceStepCompanyStage.tsx`
- `preferences/PreferenceStepLocation.tsx`
- `preferences/PreferenceStepWorkArrangement.tsx`
- `preferences/PreferenceValidationMessages.tsx`

Shortlist:
- `shortlist/ShortlistDisplay.tsx` – Renders ranked companies + scores.

Users:
- `users/UsersTable.tsx` – Simple table showing first name, last name, age.

UI Primitives:
- `ui/avatar.tsx`
- `ui/button.tsx`
- `ui/card.tsx`
- `ui/input.tsx`
- `ui/MultiSelect.tsx`
- `ui/textarea.tsx`

---
## 2. Decision Tree (Follow in order)
1. One-off markup? Inline, no file.
2. ≥3 repeats? Extract component.
3. Need style variation? Extend existing CVA or add variant.
4. Domain composition? Place under domain folder (`chat`, `preferences`, etc.).
5. Atomic missing primitive? Use `npx shadcn@latest add <name>`.
6. New dependency? Get approval first.

---
## 3. Workflow: Modify Component
1. Inspect variants + props.
2. Confirm scope (not bloated). Split if too many props.
3. Update CVA (no scattered variant classes).
4. Maintain utility ordering.
5. Preserve/ensure accessibility.
6. Type props (no `any`).
7. Keep file <300 lines (extract variants file if larger).
8. Run Definition of Done.

---
## 4. Workflow: Add Primitive (ui/)
1. `npx shadcn@latest add <name>`.
2. Move into `ui/` folder.
3. Replace raw colors with semantic tokens.
4. Use `cn` + CVA (size/intent/tone/etc.).
5. Type props via `VariantProps`.
6. Add accessibility notes (icon-only needs aria-label).
7. Remove unused code.
8. Document unusual choices.

---
## 5. Workflow: Add Domain Component
1. Select proper domain folder.
2. Keep props minimal (group related).
3. Compose primitives; do not reimplement them.
4. Add loading/error/empty states (if async later provided via props/hooks).
5. Offload logic to `libs` hooks.
6. Memoize only if measured need.
7. Export named component.
8. Update Catalog + Recent Additions (MANDATORY).

---
## 6. CVA Rules
Centralize all style variation in CVA. Forbidden: variant classes in consumer code. Use semantic tokens. Provide defaults for each variant dimension.

---
## 7. Accessibility Checklist
Interactive elements MUST:
- Be focusable & show focus ring.
- Support Enter/Space for button-like actions.
- Icon-only: `aria-label`.
- Inputs: label or `aria-label`.
- Color contrast AA (use tokens).
- Non-color-only state indication.
- No redundant roles.

---
## 8. Separation of Concerns
No business logic. Use hooks in `libs` for async; pass results as props. Internal state only for ephemeral UI.

---
## 9. Performance
Memoize only real hotspots. Avoid premature optimization. Virtualize lists >100 items. Avoid wrapper div bloat.

---
## 10. States
Loading: skeleton or pulse. Error: message + optional retry. Empty: explicit text. Long/streaming: constrain height + scroll.

---
## 11. Definition of Done (DOD)
MUST pass before PR merge:
1. Named export (PascalCase).
2. Tailwind ordering & semantic tokens.
3. CVA for >1 variant dimension.
4. Zero business logic.
5. Accessibility checklist passes.
6. Typed props (no `any`).
7. Reuses primitives (no duplication).
8. States handled if async involved.
9. No unapproved deps.
10. <300 lines or split variants.
11. No stray console logs.
12. Catalog + Recent Additions updated.
Header comment lists any intentional deviations.

---
## 12. Safe Refactors
Allowed: consolidate classes, extract repeated markup (≥3), replace colors with tokens, add a11y attributes.
Need approval: new libraries, folder/name changes, removing used variants.

---
## 13. Icons
Prefer existing icon library. Decorative: `aria-hidden="true"`. Icon-only interactive: `aria-label`.

---
## 14. Naming
File: `PascalCase.tsx`. Primitive → `ui/`. Domain → domain folder. Barrel only if >3 related exports. Variants file: `Component.variants.ts`.

---
## 15. Example: Add Button Variant
1. Open `ui/button.tsx`.
2. Add variant key to CVA.
3. Use semantic classes.
4. Extend types.
5. Search usages to confirm no break.

---
## 16. Example: Create Badge
1. `npx shadcn@latest add badge`.
2. Adjust imports.
3. Semantic tokens.
4. Add CVA if multiple tones.
5. Verify semantics.

---
## 17. Escalation
Ambiguous? Pause and ask. Do not guess.

---
## 18. Forbidden (Needs Approval)
New animation lib, global CSS edits, direct DOM hacks, removing focus styles.

---
## 19. Utility Ordering Template
`flex items-center h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none`

---
## 20. Final Reminder
Extend first. Keep accessible. Use semantic styles. Centralize variants.

---
## 21. Maintenance
Update this file IN SAME PR when adding/modifying/removing components, variants, or patterns.
Checklist:
- Added primitive? → Catalog.
- Added domain component? → Catalog + Recent Additions.
- New/removed variant? → CVA rules + example.
- New accessibility pattern? → A11y section.
- Deprecated item? Mark deprecated (do not silently remove).


Skipping updates blocks review.