---
description: 'UI Components Guide (src/components)'
applyTo: '**/src/components/**.tsx'
---

# UI Components Guide (src/components)

Goal: Make UI components predictable, purely presentational, accessible, and easy for you to extend without introducing business logic.

---
## 1. What Belongs Here
Components under `src/components` must be PRESENTATION ONLY.
Belongs:
- UI primitives (button, card, input, avatar, etc.)
- Domain compositions that arrange primitives (chat interface, preference steps, shortlist display, users table)
- Local ephemeral UI state (hover, open/closed, controlled input value)
Does NOT belong:
- Data fetching, API calls, parsing, scoring, evaluation, persistence
- Complex data transformations, formatting utilities, global constants
- Side effects unrelated to immediate UI rendering
Rationale: Separating concerns keeps rendering simple, testable, and allows logic reuse in `libs`.

---
## 2. Core Principles
1. Accept data via typed props; never fetch or mutate external state.
	Rationale: Prevents hidden side effects and keeps components reusable.
2. Keep logic minimal—anything non-trivial moves to `src/libs/**`.
	Rationale: Avoids duplication and concentrates business rules centrally.
3. Use semantic Tailwind tokens (e.g. `text-muted-foreground`).
	Rationale: Ensures theme consistency and easier future design changes.
4. Maintain Tailwind class order: layout → size → spacing → typography → color → effects → animation.
	Rationale: Consistent ordering reduces merge noise and speeds code review.
5. Centralize style variants with CVA (Class Variance Authority) in the component file or a `.variants` file.
	Rationale: Prevents scattered conditional classes and makes variant extension safe.
6. Provide accessibility by default (focus ring, labels, keyboard activation).
	Rationale: Inclusive design and avoids later retrofitting costs.
7. No helper functions inside components for formatting (dates, complex strings).
	Rationale: Keeps rendering declarative; formatting lives in `libs/utils` for consistency.
8. File size target: <300 lines (extract variants/config when exceeding).
	Rationale: Smaller files are easier for juniors to navigate and maintain.
9. Prefer extending existing primitives over creating new ones.
	Rationale: Reduces surface area and styling divergence.
10. Handle UI states (loading/error/empty) via props; do not assume fetch context.
	 Rationale: Components remain agnostic to data sources and testable with simple mocks.

---
## 3. Decision Flow Before Creating/Modifying
Ask in order:
1. Is this markup used ≥3 times? If yes, extract; else inline.
	Rationale: Avoid premature abstraction and dead files.
2. Can an existing primitive or variant cover this? If yes, extend variant.
	Rationale: Consolidates styling logic and prevents duplication.
3. Is there any non-UI logic? Move it to `libs` first.
	Rationale: Preserves purity of components.
4. Does it require new variants? Add them to CVA instead of inline conditionals.
	Rationale: Keeps a single source of truth for styles.
5. Is a new dependency required? Get approval.
	Rationale: Controls bundle size and security footprint.

---
## 4. Formatting & Display Rules
Prohibited in components: date parsing, timezone conversion, complex string manipulation, slug generation, capitalization rules, truncation beyond a simple CSS ellipsis.
Allowed: trivial wrapping (e.g. `<span>`), adding classes, conditional rendering of already formatted values.
Rationale: Formatting in `libs` ensures consistency and lets multiple components share identical transformations.

---
## 5. Workflows
### 5.1 Modify Existing Component
Steps:
1. Review current props & variants.
2. Confirm changes are presentational only.
3. Update or extend CVA instead of adding inline conditionals.
4. Adjust Tailwind classes preserving order & semantic tokens.
5. Verify accessibility (focus states, labels, roles) still holds.
6. Type any new props (no `any`).
7. Keep file size reasonable; extract variant logic if growing.
8. Run Definition of Done checklist.
Rationale: Structured flow prevents accidental logic creep and style fragmentation.

### 5.2 Add New Primitive (ui/)
Steps:
1. Scaffold with `npx shadcn@latest add <name>` if available.
2. Place in `src/components/ui/`.
3. Replace raw colors with semantic tokens.
4. Implement CVA for variant dimensions (size/intent/state).
5. Export named component with typed props using `VariantProps`.
6. Add accessibility attributes (aria-label for icon-only, etc.).
7. Remove unused scaffold code.
8. Document any non-standard decisions in a header comment.
Rationale: Ensures consistency with project style system and accessibility.

### 5.3 Add Domain Component
Steps:
1. Choose domain folder (chat, preferences, shortlist, users, upload).
2. Compose primitives—never duplicate primitive logic.
3. Group related props; keep prop surface minimal.
4. Support loading/error/empty states via props.
5. Offload non-trivial logic to `libs` (e.g. preference normalization).
6. Only memoize if profiling indicates benefit.
7. Add named export and update Catalog.
Rationale: Keeps domain components lean and maintainable for future feature growth.

---
## 6. Variants (CVA)
Rules:
1. All style variations must live in a CVA definition (no ad hoc ternaries adding class names).
2. Provide defaults for every variant dimension.
3. Use semantic tokens (e.g. `bg-primary`) not hardcoded colors.
4. Avoid variant explosion—split when exceeding 3–4 orthogonal dimensions.
5. If variant logic exceeds ~80 lines, move to `Component.variants.ts`.
Rationale: Centralization reduces regressions and supports predictable future extension.

---
## 7. Accessibility Essentials
Checklist:
- Interactive elements: keyboard focus + visible focus ring.
- Buttons: support Enter & Space activation (use `<button>` element).
- Icon-only controls: `aria-label` or adjacent descriptive text.
- Inputs: associated label or `aria-label`.
- Decorative icons: `aria-hidden="true"`.
- Maintain AA contrast by relying on token palette.
- Convey state with more than color (icons, text, aria attributes).
Rationale: Accessibility compliance broadens user reach and avoids expensive retrofits.

---
## 8. Performance Guidance
1. Avoid premature memoization; measure before optimizing.
2. Virtualize lists only when >100 items or rendering is sluggish.
3. Limit unnecessary wrapper `<div>` elements.
Rationale: Clear, simple markup optimizes readability and baseline performance.

---
## 9. UI States
Represent via props:
- Loading: skeleton or pulse placeholder.
- Error: concise message + optional retry callback prop.
- Empty: explicit explanatory text.
- Long/streaming content: constrained height + scroll.
Rationale: Standardized states improve UX consistency and reduce duplication.

---
## 10. Definition of Done (DOD)
All must pass before merge:
1. Named export (PascalCase).
2. Pure presentation—no business logic or side effects.
3. Tailwind classes use semantic tokens & correct ordering.
4. Variants centralized in CVA (if >1 style dimension).
5. Props fully typed (no `any`).
6. Accessibility checklist satisfied.
7. Reuses primitives; no duplication of existing patterns.
8. UI states supported where relevant.
9. No unapproved dependencies added.
10. File <300 lines or variant logic split.
11. No stray console logs.
12. Catalog updated in this file.
Rationale: Uniform acceptance criteria prevents regressions and enforces quality.

---
## 11. Safe Refactors vs. Approval Needed
Safe (no approval): consolidate classes, extract repeated markup (≥3 occurrences), replace raw colors with tokens, add a11y attributes.
Needs approval: introduce new library, rename/move component file, remove existing variant, global CSS changes, alter focus styles.
Rationale: Risk-managed changes preserve stability while allowing incremental improvements.

---
## 12. Naming & Structure
File naming: `PascalCase.tsx`.
Primitives: `src/components/ui/`.
Domain components: domain folder (e.g. `preferences/`).
Variants extraction: `Component.variants.ts` when large.
Rationale: Predictable locations speed onboarding and code search.

---
## 13. Icons
Use existing icon library. Decorative icons: `aria-hidden="true"`. Icon-only interactive controls: `aria-label`.
Rationale: Consistent icon handling prevents accessibility pitfalls.

---
## 14. Utility Class Ordering Template
Example ordering pattern:
`flex items-center h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none`
Rationale: Shared template reduces cognitive load and diff churn.

---
## 15. Catalog (Keep Updated)
The living, canonical inventory of every components under `src/components/` resides in `src/components/CATALOG.md`. If YOU (especially as a junior developer) perform ANY change—add, delete, rename, refactor, or modify domain behavior of a component file—you MUST update the relevant catalog entry immediately, in the **same PR before requesting review**. Treat missing updates as a blocker.
Rationale: Central inventory in a dedicated file enables quick discovery and avoids silent duplication while reducing churn in this guide.

---
## 16. Examples
Button variant addition:
1. Open `ui/button.tsx`.
2. Extend CVA with new variant key & defaults.
3. Add semantic classes only.
4. Extend `VariantProps` type.
5. Confirm existing usages remain valid.
Rationale: Demonstrates safe pattern for extending styles.

Badge creation:
1. `npx shadcn@latest add badge`.
2. Move file to `ui/`.
3. Replace raw colors with tokens.
4. Add CVA if multiple tones.
5. Verify accessibility on icon-only usage.
Rationale: Consistent primitive onboarding workflow.

---
## 17. Escalation
If any instruction conflicts or scenario feels ambiguous, pause and ask for clarification before coding.
Rationale: Prevents rework from incorrect assumptions.

---
## 18. Forbidden Without Approval
- New animation library
- Global CSS overhauls
- Direct DOM manipulation hacks
- Removing or weakening focus styles
Rationale: These changes carry high UX/regression risk.

---
## 19. Maintenance Process
When adding/modifying/removing components or variants, update this file in the SAME PR:
Checklist:
- Added primitive → update Catalog.
- Added domain component → update Catalog.
- Added/removed variant → reflect in Variants section.
- New accessibility pattern → update Accessibility section.
- Deprecated item → mark deprecated, do not silently remove.
Rationale: Documentation parity with code prevents drift and onboarding confusion.

---
## 20. Final Reminder
Default to pushing any uncertain logic into `libs`. Keep components dumb, accessible, and consistent.
Rationale: Ensures long-term scalability and simpler refactors.