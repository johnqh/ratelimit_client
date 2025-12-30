/**
 * Local types for ratelimit_client
 */

/**
 * Firebase ID token for authentication
 */
export type FirebaseIdToken = string;

/**
 * Query key types for TanStack Query
 */
export const QUERY_KEYS = {
  rateLimitsConfig: () => ['ratelimit', 'config'] as const,
  rateLimitsHistory: (periodType: string) =>
    ['ratelimit', 'history', periodType] as const,
} as const;
