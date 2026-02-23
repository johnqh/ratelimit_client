/**
 * @sudobility/ratelimit_client
 *
 * @description React client library for the Rate Limit API. Provides a typed
 * HTTP client ({@link RateLimitClient}), a React hook ({@link useRateLimits}),
 * and utility functions for building requests and handling errors.
 *
 * All API endpoints require Firebase authentication. The `rateLimitUserId`
 * parameter is a generic identifier that can be an entity slug, user ID, or
 * any other application-specific identifier.
 *
 * @example
 * ```ts
 * // Direct client usage
 * import { RateLimitClient } from '@sudobility/ratelimit_client';
 *
 * const client = new RateLimitClient({ baseUrl, networkClient });
 * const config = await client.getRateLimitsConfig(token, entitySlug);
 *
 * // React hook usage
 * import { useRateLimits } from '@sudobility/ratelimit_client';
 *
 * const { config, refreshConfig } = useRateLimits(networkClient, baseUrl);
 * await refreshConfig(token, entitySlug);
 * ```
 *
 * @packageDocumentation
 */

// Network client
export * from './network';

// Hooks
export * from './hooks';

// Utilities
export * from './utils';

// Local types
export type { FirebaseIdToken } from './types';
export { QUERY_KEYS } from './types';
