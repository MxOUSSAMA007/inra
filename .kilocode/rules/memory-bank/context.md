# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Ready for development

The template is a clean Next.js 16 starter with TypeScript and Tailwind CSS 4. It's ready for AI-assisted expansion to build any type of application.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] INRA Ration Calculator — full multi-step dairy cow nutrition tool
- [x] Cow registration system — name each cow (e.g. "1", "Maria") and save records
- [x] Records history view — per-cow history with last vs current comparison
- [x] Excel export — download all records or per-cow history as .xlsx
- [x] Multi-language support — Arabic / French / English with live language switcher button
- [x] Fix hydration error — `totalRecords` badge now uses `useState(0)` + `useEffect` with `Promise.resolve` to avoid SSR/client mismatch
- [x] Fix Excel export — replaced `XLSX.writeFile` with manual Blob + `<a>` download for reliable browser support
- [x] Feed ration recommendation — new section in results showing kg/day of hay, barley, straw, grass, etc. needed to meet UFL/PDI targets; farmer selects available feeds from a checklist; translations in AR/FR/EN
- [x] Fix concentrate blending — algorithm now treats multiple concentrates as a blended mix using weighted average; shows blend as single entry (e.g., 'شعير + ذرة + صوجا') matching real farm practice
- [x] Add DMI calculation — calculates max dry matter intake (0.025 × weight) and handles constraint by reducing concentrates then roughages
- [x] Update tolerance to exact values — ±0.2 UFL, ±50g PDI (instead of 5%)
- [x] Add difference display — shows gap from target UFL/PDI in results
- [x] Add README.md — documentation in Arabic/French/English for Maghreb farmers
- [x] Add DMI capacity calculation — MSI (Matière Sèche Ingestible) with roughage/concentrate split, lactation bonus, gestation penalty
- [x] Add PDIN/PDIE balance — protein balance analysis with utilization ratio (optimal 0.85-1.0)
- [x] Add warning system — energy deficit, nitrogen excess, protein imbalance, DMI exceeded alerts with AR/FR/EN translations

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

The template is ready. Next steps depend on user requirements:

1. What type of application to build
2. What features are needed
3. Design/branding preferences

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-07 | INRA Ration Calculator with cow records, Excel export, i18n, and feed ration features |
| 2026-03-07 | Fix concentrate blending algorithm — weighted average for multiple concentrates |
