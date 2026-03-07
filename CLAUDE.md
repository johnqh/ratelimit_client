# RateLimit Client

React client library for Rate Limit API with hooks for fetching rate limit config and history.

**npm**: `@sudobility/ratelimit_client`

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Build**: TypeScript compiler (tsc)
- **Test**: Vitest

## Project Structure

```
src/
├── index.ts              # Public exports
├── types.ts              # Client-specific types
├── hooks/                # React hooks
│   ├── index.ts          # Hook exports
│   └── useRateLimits.ts  # Rate limits hook
├── network/              # HTTP client utilities
│   ├── index.ts
│   └── RateLimitClient.ts # API client class
└── utils/                # Utility functions
    ├── index.ts
    └── ratelimit-helpers.ts # Helper functions
```

## Commands

```bash
bun run build        # Build to dist/
bun run build:watch  # Watch mode build
bun run clean        # Remove dist/
bun run test         # Run Vitest tests
bun run lint         # Run ESLint
bun run lint:fix     # Fix lint issues
bun run typecheck    # TypeScript check
bun run format       # Format with Prettier
```

## API Client

### RateLimitClient
```typescript
import { RateLimitClient } from '@sudobility/ratelimit_client';

const client = new RateLimitClient({ baseUrl, networkClient });

// Get rate limit config and current usage
// rateLimitUserId is required (e.g., entity slug, user ID)
const config = await client.getRateLimitsConfig(token, rateLimitUserId);

// Get usage history by period
const history = await client.getRateLimitHistory('hour', token, rateLimitUserId);
const history = await client.getRateLimitHistory('day', token, rateLimitUserId);
const history = await client.getRateLimitHistory('month', token, rateLimitUserId);
```

## Hooks

### useRateLimits
```typescript
import { useRateLimits } from '@sudobility/ratelimit_client';

const {
  config,           // Current rate limit config
  isLoadingConfig,  // Loading state for config
  history,          // Usage history data
  isLoadingHistory, // Loading state for history
  error,            // Error message
  refreshConfig,    // Function to refresh config
  refreshHistory,   // Function to refresh history
  clearError,       // Clear error state
  reset,            // Reset all state
} = useRateLimits(networkClient, baseUrl);

// Fetch config (rateLimitUserId is required)
await refreshConfig(token, rateLimitUserId);

// Fetch history (rateLimitUserId is required)
await refreshHistory('hour', token, rateLimitUserId);
await refreshHistory('day', token, rateLimitUserId);
```

## API Endpoints

The `rateLimitUserId` is a generic identifier that can be an entity slug, user ID, or any other identifier depending on the application.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ratelimits/:rateLimitUserId` | Get rate limit config and current usage |
| GET | `/api/v1/ratelimits/:rateLimitUserId/history/:periodType` | Get usage history (hour/day/month) |

## Types

Types are imported from `@sudobility/types`:

```typescript
import type {
  RateLimitsConfigData,
  RateLimitHistoryData,
  RateLimitPeriodType,
} from '@sudobility/types';
```

## Peer Dependencies

Required in consuming app:
- `react` >= 18.0.0
- `@sudobility/types` - Common types
- `@sudobility/di` - NetworkClient interface

## Publishing

```bash
bun run prepublishOnly  # Clean + build
npm publish             # Publish to npm
```

## Architecture

```
ratelimit_client (this package)
    ↑
ratelimit_pages (page containers)
    ↑
shapeshyft_app (frontend)
sudojo_app (frontend)
```

## Workspace Context

This project is part of the **ShapeShyft** multi-project workspace at the parent directory. See `../CLAUDE.md` for the full architecture, dependency graph, and build order.

## Downstream Impact

| Downstream Consumer | Relationship |
|---------------------|-------------|
| `ratelimit_pages` | Direct dependency - uses `useRateLimits` hook |
| `shapeshyft_app` | Transitive via ratelimit_pages, and direct dependency |

After making changes:
1. Run checks (no `verify` script - see below)
2. `npm publish`
3. In `ratelimit_pages`: `bun update @sudobility/ratelimit_client` -> rebuild
4. In `shapeshyft_app`: `bun update @sudobility/ratelimit_client` -> rebuild

## Local Dev Workflow

```bash
# In this project:
bun link

# In ratelimit_pages:
bun link @sudobility/ratelimit_client

# Rebuild after changes:
bun run build

# When done, unlink:
bun unlink @sudobility/ratelimit_client && bun install
```

## Pre-Commit Checklist

No `verify` script. Run checks manually:

```bash
bun run typecheck && bun run lint && bun run test && bun run build
```

Note: `bun run test` here runs once (not watch mode) due to `vitest run --environment jsdom`.

## Gotchas

- **`rateLimitUserId` is a generic identifier** -- it can be an entity slug, user ID, or any identifier. Do not assume it is always a Firebase UID.
- **Tests require jsdom environment** -- the test script passes `--environment jsdom`. Tests run in a browser-like environment.
- **Types come from `@sudobility/types`, not this package** -- `RateLimitsConfigData`, `RateLimitHistoryData`, etc. are in the shared types package.
