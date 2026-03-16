# Slackbracket

March Madness bracket forecasting tool. Users pick some winners, the algorithm fills the rest using ELO-based probabilities. College passion project, now getting a 2026 overhaul.

## Project Structure

Monorepo with npm workspaces:
```
apps/web/          # Next.js 15 app (App Router, React 19)
packages/domain/   # Pure TS business logic (simulation, odds, types)
slackbracket-react/ # Legacy Vite/React app (being phased out)
[root legacy files] # Original HTML/JS/CSS (kept for rollback)
```

## Build & Run

```bash
npm install          # Install all workspaces
npm run dev          # Next.js dev server → localhost:3000
npm run build        # Production build
npm run typecheck    # TypeScript strict validation
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run test         # Domain package tests (node test runner)
npm run format:check # Prettier check
npm run format:write # Prettier auto-format
```

## Key Tech

- **Framework:** Next.js 15.2 (App Router, `"use client"` for interactive components)
- **React:** 19.0
- **State:** Zustand 5 + zundo temporal middleware (undo/redo)
- **Data fetching:** TanStack React Query 5 (30s polling for live state)
- **Animation:** Framer Motion 12.5
- **Validation:** Zod 3.24
- **Styling:** CSS files (no Tailwind) + CSS custom properties + glassmorphism
- **Font:** Space Grotesk via `next/font/google`

## Code Conventions

- Prettier: 100 char width, semicolons, double quotes
- TypeScript strict mode, ESNext modules
- Path alias: `@slackbracket/domain` → `packages/domain/src/index.ts`
- Server components by default; `"use client"` only where needed
- Inline styles acceptable for one-off layout; CSS files for reusable patterns
- Use CSS custom properties (`var(--accent)`) not hardcoded colors

## Architecture

**Domain package** (`packages/domain/`): Pure logic, no React. Exports types (Team, Matchup, BracketState), simulation (ELO-based winProbability), chaos system, odds computation, share encoding, progression locking.

**Chaos slider** (centered at 0.5):
- `0.0` = chalk (favorites ALWAYS win — ELO deviation amplified to certainty)
- `0.5` = true odds (pure ELO probability, no modification)
- `1.0` = true random (50/50 coinflip)
- Chalk zone uses power curve: `|deviation/0.5|^t`. Chaos zone uses linear blend toward 0.5.
- Presets: Chalk City (0), Play It Safe (0.25), True Odds (0.5), Madness (0.75), Sicko Mode (1.0).

**Data source:** Nate Silver COOPER ELO ratings. 2026 men's bracket integrated from CBS Selection Sunday bracket. Data files in `data/2026-mens.csv` and `data/2026-womens.csv`.

**Web app** (`apps/web/`):
- `app/` — Next.js App Router (layout, page, providers, API routes, globals.css)
- `components/` — React components (BracketApp orchestrator, bracket/ directory for layout)
- `components/bracket/` — Bracket visualization (BracketShell, RegionBracket, FinalFourBracket, BracketMatchup)
- `lib/` — Client utilities (Zustand store, tournament tree builder, logo fetching, bracket layout hook)

**Data flow:** API routes serve JSON from `data/` files → React Query fetches → Zustand manages picks/chaos/mode → bracket components render.

**Game tree:** 63 games total. 4 regions × 15 games (rounds 1-4) + 2 FF semis (R5) + 1 championship (R6). IDs: `R{round}-{region}-{slot}`. Sources: `{type:"team",teamId}` or `{type:"winner",matchupId}`.

## Branching

- `master` — stable baseline (currently at pre-2026-overhaul state, commit `b2cd08a`)
- `2026-overhaul` — active development branch for the 2026 UI rebuild
- Always work on `2026-overhaul`, not master

## Design Direction

Neon glassmorphism dark theme with region-colored accents. Inspired by race-condition-diagram.html (see memory for details). Mobile-first bracket layout following ESPN/CBS patterns (region-by-region on mobile, full bracket on desktop). Target: fun, viral-ready, personality-driven.

Region colors (all cool-toned to avoid clashing with warm upset indicators): East=cyan `#00f0ff`, West=indigo `#818cf8`, South=teal `#2dd4bf`, Midwest=sky `#38bdf8`, Final Four=purple `#7c4dff`.
