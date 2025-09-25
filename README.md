# Basename Radar

Basename Radar is a Vite + React + TypeScript MVP that helps find short or meaningful Basename handles for the Base
network. The app ships with a fully mocked backend so the UI and state management can be integrated with onchain flows
later without rewriting components.

## Features

- Curated candidate list with availability, price hints, heuristic score, and “why it is cool” tags
- Length (3–6), kind (short / word / pattern), and score/price/alphabetical sorting controls
- Live name search with validation and mocked availability + price checks (cached client-side)
- Register (opens mocked checkout link) and Watch (toast success) actions with tracking metrics
- Full web UX at `/` plus Farcaster-friendly compact UI at `/mini` (linked externally for Farcaster app)
- Prepared hydration for wagmi, viem, and OnchainKit configs + Solidity stubs for upcoming contracts

## Getting started

```bash
yarn install
yarn dev
```

The dev server runs on http://localhost:5173 by default.

### Environment variables

Copy `.env.example` into `.env` as needed:

```
VITE_BASE_RPC=https://mainnet.base.org
VITE_FEE_RECIPIENT=0x0000000000000000000000000000000000000000
VITE_APP_URL=https://your-domain.xyz
```

`VITE_APP_URL` is reused for the mocked checkout URL. Update it when the app is hosted.

## Project structure

```
/public
  /.well-known/farcaster.json    # Farcaster mini-app manifest
  /icons/app.png                 # App icon (placeholder)
/src
  /app
    /home/HomePage.tsx           # Full web interface
    /mini/MiniPage.tsx           # Compact Farcaster-ready UI
  /components
    /ui                          # Shared primitives (Button, Input, etc.)
    /basename                    # Domain-specific UI modules
  /hooks                         # Data + validation hooks
  /lib                           # wagmi, viem, onchain configs, CSP helper
  /services                      # Mocked Basename service
  /store                         # Zustand stores (filters + UI/toasts/metrics)
  /styles                        # Global styles
  /types                         # Shared types
  App.tsx, main.tsx
/contracts
  /src/Watchlist.sol             # Event-only stub for watchlist activity
  /src/RegisterWithFee.sol       # Fee wrapper stub around official registrar
```

## Mock API model

All data lives client-side. `basename.service.ts` simulates:

- `GET /api/candidates` with filters, sorts, latency sampling, and deterministic availability
- `GET /api/check` with caching and validation
- `POST /api/watch` and `POST /api/register-intent` returning mock responses

The heuristics replicate the scoring scheme from the product spec, including bonuses for short words and patterns.

## Farcaster mini app

- `/mini` renders the same data with tighter spacing and capped page size for quick load inside Frames
- Manifest is served at `/.well-known/farcaster.json`
- CSP avoids blocking embeds (`frame-ancestors *`)

## Next steps after MVP

1. Replace mocks with a real Basename indexer (public RPC or bespoke service)
2. Wire `WatchButton` to `Watchlist.sol` events and persist user-owned watchlists
3. Implement `RegisterWithFee.sol` flow with wagmi `writeContract` + checkout UI
4. Harden analytics (Farcaster engagements, CTR, latency budgets)
5. Polish `/mini` for Farcaster Developer Rewards submission and deploy verified contracts
