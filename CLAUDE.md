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

## Testing

Uses Vitest with mock network client:

```bash
bun run test         # Run tests
```

Test coverage includes:
- Config fetching with rateLimitUserId
- History fetching for all period types
- Error handling (network errors, API errors)
- URL encoding for special characters
