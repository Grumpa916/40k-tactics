# 40K Tactics V2

Recovered development source for the Warhammer 40,000 11th-edition live tactical assistant.

## Current hosting

The application is intended for Cloudflare Pages. The production static bundle is generated in `dist/`.

## Commands

```sh
npm test
npm run build
npm run verify
```

The project intentionally has no runtime npm dependencies. Browser modules are served directly from `src/`.

## Cloudflare Pages settings

- Production branch: `main`
- Build command: `npm run verify`
- Build output directory: `dist`
- Node version: 20 or newer

## Recovery note

This repository was reconstructed after the previous GitHub account became unavailable. The runtime source is the exact source used for the preserved Cloudflare deployment bundle at the recovery point. Tests included here are those recoverable from the preserved integration patch, including the current Shooting skip and opponent Movement regression tests. Historical Git metadata and portions of the older test suite were not present in the deployment bundle and are not fabricated here.
