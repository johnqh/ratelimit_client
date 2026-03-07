# @sudobility/ratelimit_client

React client library for the Rate Limit API with hooks for fetching rate limit config and usage history.

## Installation

```bash
bun add @sudobility/ratelimit_client
```

### Peer Dependencies

- `react` >= 18.0.0
- `@sudobility/types`
- `@sudobility/di`

## Usage

```tsx
import { RateLimitClient, useRateLimits } from '@sudobility/ratelimit_client';

// Direct client usage
const client = new RateLimitClient({ baseUrl, networkClient });
const config = await client.getRateLimitsConfig(token, rateLimitUserId);
const history = await client.getRateLimitHistory('hour', token, rateLimitUserId);

// React hook usage
const { config, isLoadingConfig, history, refreshConfig, refreshHistory, error } =
  useRateLimits(networkClient, baseUrl);

await refreshConfig(token, rateLimitUserId);
await refreshHistory('day', token, rateLimitUserId);
```

## API

### RateLimitClient

| Method | Description |
|--------|-------------|
| `getRateLimitsConfig(token, rateLimitUserId)` | Get rate limit config and current usage |
| `getRateLimitHistory(period, token, rateLimitUserId)` | Get usage history (`'hour'` / `'day'` / `'month'`) |

### useRateLimits Hook

Returns: `config`, `isLoadingConfig`, `history`, `isLoadingHistory`, `error`, `refreshConfig`, `refreshHistory`, `clearError`, `reset`.

### Types (from `@sudobility/types`)

`RateLimitsConfigData`, `RateLimitHistoryData`, `RateLimitPeriodType`

### Local Exports

`FirebaseIdToken` (type), `QUERY_KEYS`

## Development

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

Pre-commit:

```bash
bun run typecheck && bun run lint && bun run test && bun run build
```

## License

BUSL-1.1
