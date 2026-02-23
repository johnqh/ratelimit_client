/**
 * Local types for ratelimit_client
 *
 * @description Contains client-specific type definitions and query key factories
 * used throughout the ratelimit_client package. Domain types such as
 * {@link RateLimitsConfigData} and {@link RateLimitHistoryData} are imported
 * from `@sudobility/types`.
 * @module types
 */

/**
 * Firebase ID token used for authenticating API requests.
 *
 * @description A string representing a Firebase Authentication ID token.
 * This token is obtained from Firebase Auth (e.g., `user.getIdToken()`) and
 * is passed as a Bearer token in the Authorization header of API requests.
 */
export type FirebaseIdToken = string;

/**
 * Query key factories for TanStack Query cache management.
 *
 * @description Provides deterministic query key arrays for use with TanStack Query's
 * `useQuery` and `queryClient.invalidateQueries`. These keys ensure proper cache
 * isolation and invalidation for rate limit data.
 *
 * @example
 * ```ts
 * import { QUERY_KEYS } from '@sudobility/ratelimit_client';
 *
 * // Use as a query key for config
 * const configKey = QUERY_KEYS.rateLimitsConfig();
 * // => ['ratelimit', 'config']
 *
 * // Use as a query key for history with a period type
 * const historyKey = QUERY_KEYS.rateLimitsHistory('hour');
 * // => ['ratelimit', 'history', 'hour']
 * ```
 */
export const QUERY_KEYS = {
  /**
   * Returns the query key for rate limit configuration data.
   *
   * @returns A readonly tuple `['ratelimit', 'config']`
   */
  rateLimitsConfig: () => ['ratelimit', 'config'] as const,

  /**
   * Returns the query key for rate limit history data for a given period type.
   *
   * @param periodType - The period type ('hour', 'day', or 'month')
   * @returns A readonly tuple `['ratelimit', 'history', periodType]`
   */
  rateLimitsHistory: (periodType: string) =>
    ['ratelimit', 'history', periodType] as const,
} as const;
