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

### Server vs Client Components
Components are server components by default. Add `'use client'` directive at the top of files that need client-side interactivity.

