# RateLimit Client

React client library for Rate Limit API with hooks for fetching rate limit config and history.

**npm**: `@sudobility/ratelimit_client`

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Bun
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
bun run test         # Run Vitest (watch mode)
bun run test:run     # Run tests once
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
const config = await client.getRateLimitsConfig(token);
const config = await client.getRateLimitsConfig(token, entitySlug);

// Get usage history by period
const history = await client.getRateLimitHistory('hour', token);
const history = await client.getRateLimitHistory('day', token, entitySlug);
const history = await client.getRateLimitHistory('month', token);
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

// Fetch config
await refreshConfig(token);
await refreshConfig(token, entitySlug);

// Fetch history
await refreshHistory('hour', token);
await refreshHistory('day', token, entitySlug);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ratelimits` | Get rate limit config and current usage |
| GET | `/api/v1/ratelimits?entitySlug=x` | Get config for specific entity |
| GET | `/api/v1/ratelimits/history/:periodType` | Get usage history (hour/day/month) |

## Types

```typescript
interface RateLimitConfig {
  currentUsage: { hourly: number; daily: number; monthly: number };
  currentLimits: { hourly: number; daily: number; monthly: number };
  currentEntitlement: string;
  tiers: RateLimitTier[];
}

interface RateLimitHistory {
  periodType: 'hour' | 'day' | 'month';
  history: { timestamp: string; usage: number }[];
}
```

## Peer Dependencies

Required in consuming app:
- `react` >= 18.0.0
- `@sudobility/types` - Common types

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

## Testing

Uses Vitest with mock network client:

```bash
bun run test         # Watch mode
bun run test:run     # Single run
```

Test coverage includes:
- Config fetching with/without entity slug
- History fetching for all period types
- Error handling (network errors, API errors)
- URL encoding for special characters
