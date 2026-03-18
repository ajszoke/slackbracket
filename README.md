# slackbracket: Customized data-driven bracket forecasting

## What is this?
[Slackbracket](https://slackbracket.com) lets you fill in the parts of your March Madness bracket that you want to fill in, and generates winners for everything else. Pick your upsets, set the chaos level, and let the AI fill the rest using ELO-based probabilities. Or just smash the Generate button and see what the lotto machine spits out.

## 2026 Overhaul
Complete rebuild for the 2026 tournament. Next.js 15, React 19, neon glassmorphism, dual-orb chaos engine, compact share URLs, and a surprise-aware bracket pulse that breathes based on how spicy your picks are.

**Live at [slackbracket.com](https://slackbracket.com)** — men's and women's brackets.

## Methodology
Team strength data from [Nate Silver's COOPER ratings](https://www.natesilver.net/p/cooper-mens-ncaa-basketball-power-ratings) (ELO-based). The chaos slider controls the AI's personality: 0% = chalk (favorites always win), 50% = true ELO odds, 100% = pure coinflip. Bracket probability uses round-weighted surprisal to measure how wild your picks actually are.

## Quick Start
```bash
npm install          # Install all workspaces
npm run dev          # Next.js dev server → localhost:3000
npm run build        # Production build (static export)
npm run typecheck    # TypeScript strict validation
npm run lint         # ESLint
npm run test         # Domain package tests
```

## Deploy
```bash
cp .env.deploy.example .env.deploy   # Fill in NFS + AWS credentials
./infra/deploy.sh stage              # Build + deploy to slackbracket.com/dev
./infra/deploy.sh promote            # Backup prod, build clean, deploy to prod
./infra/deploy.sh rollback           # Restore previous prod build
./infra/deploy.sh status             # Health check prod/stage/telemetry
```

## Project Structure
```
apps/web/              # Next.js 15 app (App Router, React 19)
packages/domain/       # Pure TS business logic (simulation, odds, types)
infra/                 # Deploy scripts + AWS telemetry stack (CloudFormation)
data/                  # COOPER ELO ratings (CSV)
```

## Does it work?
This site has been used to create multiple top-1% brackets in a small sample size, including [this one](https://fantasy.espn.com/tournament-challenge-bracket/2021/en/entry?entryID=50358161) in 2021 that ranked in the top 0.2% on ESPN. Of course, that could be coincidence, but why take that chance?

## I found a bug or have a feature request!
Awesome! You can help out by raising an issue or submitting a PR.
