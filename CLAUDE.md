# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Architecture

This is a **Next.js 16** application using the App Router with React 19 and TypeScript.

### Key Technologies
- **Next.js 16** with App Router (app/ directory)
- **React 19** with Server Components by default
- **TypeScript 5** with strict mode
- **Tailwind CSS v4** for styling
- **pnpm** as package manager

### Project Structure
- `app/` - Next.js App Router pages and layouts
- `app/layout.tsx` - Root layout with fonts and metadata
- `app/page.tsx` - Home page component
- `app/globals.css` - Global styles with Tailwind and CSS custom properties
- `public/` - Static assets

### Path Alias
Use `@/*` to import from the project root (configured in tsconfig.json).

### Styling
- Tailwind utility classes directly in components
- Dark mode via `prefers-color-scheme` media query
- CSS custom properties: `--background`, `--foreground`
- Font variables: `--font-geist-sans`, `--font-geist-mono`

### UI Components
Use [shadcn/ui](https://ui.shadcn.com/docs/components) components when possible. After adding a component, update its styles to match the IRC/terminal aesthetic:
- Replace default colors with IRC color variables (`text-irc-cyan`, `bg-irc-bg`, etc.)
- Use monospace fonts
- Remove rounded corners or use minimal rounding
- Keep the retro terminal feel

```bash
# Add a shadcn component
pnpm dlx shadcn@latest add <component-name>
```

### Server vs Client Components
Components are server components by default. Add `'use client'` directive at the top of files that need client-side interactivity.

### Platform Support
The app must work on both desktop and mobile:
- **Desktop:** Standard web browser experience
- **Mobile Web:** Responsive design, touch-friendly
- **Native Mobile:** iOS and Android via Capacitor

Design mobile-first, then enhance for desktop. Test both viewport sizes when making UI changes.

## Testing

Write tests for new functionality. Use Vitest for unit and integration tests.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### What to Test
- **Utility functions:** All pure functions in `lib/` should have unit tests
- **API routes:** Test request/response handling and error cases
- **R2 operations:** Mock the S3 client and test CRUD operations
- **Type guards:** Ensure validation functions work correctly
- **Components:** Test critical user interactions (optional for MVP)

### Test File Location
Place tests next to the code they test:
- `lib/r2.ts` → `lib/r2.test.ts`
- `lib/entities.ts` → `lib/entities.test.ts`

## Documentation & Decision Tracking

### Memory File
Maintain `docs/memory.md` as a running log of design and coding decisions. When you make a non-trivial decision (architecture choice, library selection, implementation approach, trade-off), add an entry:

```markdown
## YYYY-MM-DD: Brief Title

**Context:** Why this decision was needed
**Decision:** What was decided
**Rationale:** Why this approach was chosen over alternatives
```

### Phase Notes
Each development phase has its own folder under `docs/phase-n/`. When working on a phase:
- Reference `docs/phase-n/user-stories.md` for requirements
- Add implementation notes to `docs/phase-n/notes.md` as you work
- Update user story checkboxes when acceptance criteria are met

### What to Document
- Architectural decisions (e.g., "chose X library over Y because...")
- Non-obvious implementation choices
- Workarounds for limitations or bugs
- Integration patterns between systems
- Performance considerations
- Security decisions

