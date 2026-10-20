# 40K Tactics V2

Recovered development source for the Warhammer 40,000 11th-edition live tactical assistant.

## Current hosting

GitHub is the authoritative source repository. The production static bundle is generated in `dist/` and deployed with GitHub Pages.

## Commands

```sh
npm test
npm run build
npm run verify
```

The project intentionally has no runtime npm dependencies. Browser modules are served directly from `src/`.

## Architecture policy

V2 uses an explicit anti-monolith policy. `src/ui/battle-shell.js` is a top-level coordinator only; phase-specific state, rules, handlers, and rendering belong in focused modules. See [`docs/ARCHITECTURE_POLICY.md`](docs/ARCHITECTURE_POLICY.md).

## GitHub Pages settings

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 22 in GitHub Actions

## Recovery note

This repository was reconstructed after the previous GitHub account became unavailable and was later migrated back to GitHub from the preserved deployment source. The current `main` history is the validated migrated V2 line. Older pre-migration GitHub state is retained on a backup branch.
