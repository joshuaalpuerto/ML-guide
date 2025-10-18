---
description: 'Instructions for building UI components with shadcn-ui + Tailwind CSS in the career-coach project.'
applyTo: '**/src/**/**.tsx'
---

# shadcn-ui + Tailwind Component Implementation Guide

These instructions teach an AI (and humans) how to author **UI components** using the project design system: **shadcn-ui primitives + Tailwind CSS utilities + TypeScript**. Follow these for consistency, accessibility (a11y), performance, and ease of extensibility.

---
## 1. Core Principles (Mental Model)
1. Components compose shadcn primitives (Radix-based) + Tailwind utility classes.
2. Install shadcn components via CLI, not hand-coding from scratch.
3. Styling first: prefer Tailwind utilities; only add custom CSS when utilities cannot express intent.
4. Variants: use `class-variance-authority` (CVA) for size, color, state variants.
5. Accessibility: ALWAYS preserve ARIA roles from shadcn primitives; never remove focus outlines (customize instead).
6. Server/Client boundary: Keep components as client (`'use client'`) only when needed (hooks, state, events). Pure presentational components remain server-safe.
7. Data logic lives in `libs/` / hooks; components focus on rendering + interaction wiring.

---
## 2. Required Imports Patterns
Typical imports for a component:
```ts
import * as React from 'react';
import { cn } from '@/src/libs/utils'; // classname merge helper
import { Slot } from '@radix-ui/react-slot'; // for polymorphic components
```
For components extending existing base (e.g. Button variant):
```ts
import { buttonVariants } from '@/src/components/ui/button';
```
When adding icons, prefer existing assets in `public/` or an icon library (e.g. Lucide) if already installed. Avoid introducing heavy icon libs without need.

### Fetching New shadcn Primitives
Generate new UI primitives (e.g. `textarea`, `dialog`, `dropdown-menu`) using the shadcn CLI instead of hand‑coding:
```bash
npx shadcn@latest add textarea
```
General pattern:
```bash
npx shadcn@latest add <component-name>
```
Guidelines:
1. Run from project root so paths align with existing `src/components/ui/` structure.
2. Review the generated file(s); adapt import aliases (ensure `cn` utility path correctness) and remove unused variants.
3. Maintain naming consistency (keep within `ui/` folder for primitives; move domain composites elsewhere).
4. Add JSDoc + tailor Tailwind classes to project tokens (replace raw colors with `bg-background`, `text-foreground`, etc.).
5. Commit generated components after adjustments — avoid committing untouched boilerplate.
6. If component introduces additional dependencies (rare), verify they are already present or get approval before installing.


---
## 3. Tailwind Usage Conventions
1. Order utilities: layout (flex, grid), size (w-*, h-*), spacing (p-*, m-*), typography, color, effects (shadow, ring), animation.
2. Avoid redundant utilities (e.g., both `px-4` and `p-4` unless intentional).
3. Use `dark:` prefix for dark theme adjustments; rely on design tokens (e.g. `bg-background`, `text-foreground`).
4. Use semantic color variables from Tailwind config when possible instead of raw hex.
5. Keep class strings readable — break long className using arrays + `cn()` when >120 chars.

---
## 4. Variants With CVA
Define variants for reusable components (Button, Card, Input) using CVA:
```ts
const componentVariants = cva(
  'relative inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base'
      }
    },
    defaultVariants: { variant: 'default', size: 'md' }
  }
);
```
Expose a helper:
```ts
export interface ComponentProps extends VariantProps<typeof componentVariants> {
  asChild?: boolean;
}
```
Use `<Slot />` when `asChild` is true to support polymorphism.

---
## 5. Accessibility (a11y) Checklist
1. Interactive elements: ensure keyboard focus (Tab) and activation (Enter/Space) work.
2. Provide `aria-label` for icon-only buttons.
3. Associate labels with inputs via `htmlFor` / `id`.
4. Use `role` only when necessary (avoid redundant roles on native elements).
5. Color contrast: ensure text meets WCAG AA (use design palette).
6. Avoid using just color to convey state; add icon or text for error/success messages.
7. For live regions (status updates), use `aria-live="polite"` sparingly.

---
## 6. State & Logic Separation
1. Heavy async logic (fetch, mutate) in hooks under `src/libs/hooks/` (e.g. `useApiFetcher`).
2. Components subscribe to hook state; do not embed fetch calls directly unless trivial.
3. Local ephemeral UI state (drawer open, input value) stays inside component.
4. Derived values memoized with `React.useMemo` when expensive (list large mapping, regex parsing) — avoid premature optimization.

---
## 7. File Naming & Structure
* Component file: `PascalCase.tsx` for exported component.
* Index barrel only when grouping >3 related components; otherwise direct paths.
* Keep each component self-contained: types, variants, and exports in one file unless size >300 lines; then split variants to `Component.variants.ts`.

---
## 8. Theming & Dark Mode
Tailwind config defines CSS variables for colors. Use them:
```ts
className="bg-background text-foreground"
```
Never hardcode inverted colors; rely on `dark:` classes when nuance needed:
```ts
className="bg-card dark:bg-card/90"
```

---
## 9. Animation & Transitions
1. Prefer CSS transitions for simple hover/focus (e.g. `transition-colors`).
2. Use Radix component built-in transitions where available (e.g., Dialog, DropdownMenu).
3. For complex animations, consider `framer-motion` ONLY if already in dependencies (avoid adding unless needed). Document rationale in file header comment.

---
## 10. Error & Loading States
1. Provide skeleton or spinner for async content: use minimal Tailwind shapes (`animate-pulse`).
2. Show fallback text for empty lists (`No items found.`) rather than blank space.
3. Errors: present concise message + optional retry button.
4. Wrap streaming output segments in scrollable container (`overflow-y-auto`) with max height for chat/shortlist views.

---
## 11. Forms & Inputs
1. Use shadcn form primitives (if present) or standard `<form>`; maintain controlled inputs for complex validation.
2. Validation logic in hook or parent; component receives `error` prop to display message.
3. Do not block submission via disabled buttons unless necessary; rely on `aria-invalid` attributes.

---
## 12. Reusability & Composition
1. Favor small atomic components (Button, Card, Input) + domain composites (ChatInterface, ShortlistDisplay).
2. Domain composites orchestrate atomic ones; they do not introduce overlapping variant systems.
3. Avoid prop explosion: if >10 props, consider splitting responsibilities.
4. Use object prop for grouped related values (`layout={{ dense: true, showAvatars: false }}`) rather than separate booleans.

---
## 13. Performance Considerations
1. Avoid unnecessary re-renders: wrap stable handlers with `useCallback` when passed deep.
2. Large list rendering: add `virtualized` solution only when list > 100 items; otherwise keep simple.
3. Defer expensive calculations until visible (e.g., inside `useEffect` after mount or lazy load component with dynamic import).
4. Minimize DOM depth — remove wrappers if purely semantic.

---
## 14. Testing Strategy
1. Unit tests: render component, assert variant classes, a11y attributes, and conditional rendering.
2. Use React Testing Library; simulate interactions (click, keypress) for interactive elements.
3. Snapshot tests only for stable presentational components (avoid for dynamic streaming views).
4. Provide mock hooks for data dependencies.

---
## 15. Logging & Debugging
1. Avoid `console.log` in production components; guard with `if (process.env.NODE_ENV !== 'production')` if necessary.
2. Do not log entire props objects for frequently re-rendered components.

---
## 16. Common Pitfalls & Fixes
| Issue | Cause | Fix |
|-------|-------|-----|
| Inconsistent spacing | Mixed Tailwind scale vs arbitrary px | Use Tailwind spacing scale (e.g., `px-4`, not `px-[17px]`). |
| Focus outline missing | Overrode with `outline-none` | Replace with `focus-visible:outline focus-visible:ring` pattern. |
| Variant mismatch | Hardcoded class instead of CVA variant | Extend CVA definition; remove duplication. |
| Color contrast fail | Using low-opacity overlay | Adjust to use semantic color with adequate contrast tokens. |
| Re-render storm | Passing new inline function to many children | Memoize handler with `useCallback` or lift state upward. |

---
## 17. Definition of Done (Checklist per Component)
1. Exports a named React component (PascalCase).
2. Uses Tailwind utilities following ordering conventions.
3. Accessible: keyboard + ARIA where needed.
4. Variants implemented via CVA when variant complexity >1 dimension.
5. No hardcoded secrets or inline fetch logic (except trivial static assets).
6. Props typed with TypeScript; avoids `any`.
7. Reuses existing primitives if equivalent already exists.
8. Includes clear empty/loading/error UI where applicable.
9. Does not introduce unnecessary dependencies.
10. File length manageable (<300 lines or split).
11. Light comments for non-obvious logic (animation, complex conditionals).

Add a header comment documenting intentional deviations (e.g., added framer-motion) if any checklist item skipped.

---
## 18. Example Component Template
```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/libs/utils';
import { Slot } from '@radix-ui/react-slot';

const panelVariants = cva(
  'rounded-md border bg-card text-card-foreground shadow-sm transition-colors',
  {
    variants: {
      tone: {
        default: '',
        success: 'border-green-500/50 bg-green-50 dark:bg-green-950/30',
        warning: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30',
        danger: 'border-red-500/50 bg-red-50 dark:bg-red-950/30'
      },
      padding: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
      }
    },
    defaultVariants: { tone: 'default', padding: 'md' }
  }
);

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof panelVariants> {
  asChild?: boolean;
  title?: string;
  actions?: React.ReactNode;
}

export function Panel({
  asChild,
  tone,
  padding,
  title,
  actions,
  className,
  children,
  ...props
}: PanelProps) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp className={cn(panelVariants({ tone, padding }), className)} {...props}>
      {title && (
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold leading-none tracking-tight">{title}</h2>
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </Comp>
  );
}
```

---
## 19. Extending For Career Coach Domain
Domain-specific components should reflect user workflow:
* CV upload states (drag active, parsing, parsed summary).
* Company shortlist (rank badges, score bars, expansion panels for details).
* Chat bubbles with role-based styling (user vs assistant vs system).
* Preference inputs (sliders, tags) using accessible patterns.

Add semantic cues (icons, badges) to reinforce guidance (e.g., company rating tiers).

---
## 20. Dark Mode & High Contrast Enhancements (Optional)
Implement toggles using CSS variables; high-contrast variant can extend CVA with `contrast: true` applying `outline outline-2 outline-primary`. Provide fallback for OS prefers-contrast queries.

---
## 21. Documentation & Comments
Provide JSDoc for complex props and variant explanation:
```ts
/**
 * Panel component: flexible container with tone + padding variants.
 * Use for grouping related content blocks (scores, summaries).
 */
```
Avoid over-commenting trivial Tailwind usage.

---
## 22. When NOT to Create a New Component
Do NOT create a new component when:
* A simple `<div className="..." />` suffices once.
* It duplicates existing variant logic (extend existing component instead).
* Only needed for a single page and not reused (keep inline unless complexity grows).

Create a new component when:
* Repeated markup appears ≥3 times with slight variations.
* Variation logic (size, tone) is expanding.
* Requires encapsulating interaction (keyboard nav, disclosure toggle).

---
## 23. Future Enhancements (Optional)
* Add design tokens for spacing scale extensions.
* Introduce motion reduction variants respecting `prefers-reduced-motion`.
* Add unified error boundary component.
* Provide component-story MDX docs for internal catalog (storybook style) if tooling added.

---
## 24. Summary
To build a component: plan its API and variants, implement with shadcn primitives + Tailwind utilities, ensure accessibility & responsiveness, separate business logic into hooks, and finalize with tests + clear documentation. Follow the Definition of Done checklist for consistency and quality.
