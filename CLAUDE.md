# RateLimit Client

React client library for Rate Limit API with TanStack Query hooks.

**npm**: `@sudobility/ratelimit_client`

## Tech Stack

- **Language**: TypeScript
- **Data Fetching**: TanStack Query v5
- **Build**: TypeScript compiler (tsc)
- **Test**: Vitest

## Project Structure

```
src/
├── index.ts          # Public exports
├── types.ts          # Client-specific types
├── hooks/            # TanStack Query hooks
│   ├── index.ts      # Hook exports
│   └── useRateLimits.ts # Rate limits hook
├── network/          # HTTP client utilities
│   ├── index.ts
│   └── RateLimitClient.ts # API client
└── utils/            # Utility functions
    ├── index.ts
    └── ratelimit-helpers.ts # Helper functions
```

## Commands

```bash
bun run build        # Build to dist/
bun run build:watch  # Watch mode build
bun run clean        # Remove dist/
bun run test         # Run Vitest
bun run test:run     # Run tests once
bun run lint         # Run ESLint
bun run typecheck    # TypeScript check
bun run format       # Format with Prettier
```

## Usage

```typescript
import { RateLimitClient, useRateLimits } from '@sudobility/ratelimit_client';

// Direct client usage
const client = new RateLimitClient({ baseUrl, networkClient });
const config = await client.getRateLimitsConfig(token);
const history = await client.getRateLimitHistory('hour', token);

// React hook usage
const { config, history, isLoading, error, refresh } = useRateLimits(networkClient, baseUrl);
await refresh(token);
await refreshHistory('day', token);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ratelimits` | Get rate limit config and current usage |
| GET | `/ratelimits/history/:periodType` | Get usage history (hour/day/month) |

## Hooks

| Hook | Purpose |
|------|---------|
| `useRateLimits` | Fetch rate limit config and history |

## Peer Dependencies

Required in consuming app:
- `@sudobility/types`
- `@tanstack/react-query` >= 5.0.0
- `react` >= 18.0.0

## Publishing

```bash
bun run prepublishOnly  # Clean + build
npm publish             # Publish to npm (restricted)
```

## Testing

Uses Vitest with React Testing Library:

```bash
bun run test           # Watch mode
bun run test:run       # Single run
```
