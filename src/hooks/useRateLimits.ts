import { useCallback, useMemo, useState } from 'react';
import type {
  NetworkClient,
  Optional,
  RateLimitHistoryData,
  RateLimitPeriodType,
  RateLimitsConfigData,
} from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { RateLimitClient } from '../network/RateLimitClient';

/**
 * Return type for the {@link useRateLimits} hook.
 *
 * @description Contains all state values and action functions returned by the
 * `useRateLimits` hook. State includes the current rate limit configuration,
 * usage history, loading indicators, and error messages. Actions include
 * functions to refresh data, clear errors, and reset all state.
 */
export interface UseRateLimitsReturn {
  /** Current rate limits configuration and usage, or `null` if not yet fetched */
  config: Optional<RateLimitsConfigData>;
  /** Rate limit usage history for the most recently fetched period, or `null` if not yet fetched */
  history: Optional<RateLimitHistoryData>;
  /** `true` while a config fetch is in progress */
  isLoadingConfig: boolean;
  /** `true` while a history fetch is in progress */
  isLoadingHistory: boolean;
  /** Error message from the most recent failed operation, or `null` if no error */
  error: Optional<string>;

  /**
   * Fetches the rate limit configuration for the given user/entity.
   *
   * @description Triggers a `GET /api/v1/ratelimits/:rateLimitUserId` request.
   * On success, updates `config` state. On failure, sets `error` state.
   * Automatically clears any previous error before fetching.
   *
   * @param token - Firebase ID token for authentication
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID)
   */
  refreshConfig: (
    token: FirebaseIdToken,
    rateLimitUserId: string
  ) => Promise<void>;

  /**
   * Fetches the rate limit usage history for a specific period type.
   *
   * @description Triggers a `GET /api/v1/ratelimits/:rateLimitUserId/history/:periodType` request.
   * On success, updates `history` state. On failure, sets `error` state.
   * Automatically clears any previous error before fetching.
   *
   * @param periodType - The time period granularity: `'hour'`, `'day'`, or `'month'`
   * @param token - Firebase ID token for authentication
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID)
   */
  refreshHistory: (
    periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
    token: FirebaseIdToken,
    rateLimitUserId: string
  ) => Promise<void>;

  /** Clears the current error state, setting `error` to `null` */
  clearError: () => void;

  /** Resets all state to initial values (`null` for data/error, `false` for loading flags) */
  reset: () => void;
}

/**
 * React hook for fetching rate limit configuration and usage history.
 *
 * @description Provides read-only access to rate limit data through a
 * simple state-based API. Internally creates and memoizes a {@link RateLimitClient}
 * instance. All state transitions (loading, success, error) are handled
 * automatically.
 *
 * The hook does not fetch data automatically on mount -- call `refreshConfig`
 * and/or `refreshHistory` to trigger data fetching.
 *
 * @param networkClient - A `NetworkClient` instance for making HTTP requests
 * @param baseUrl - Base URL of the Rate Limit API (e.g., `'https://api.example.com'`)
 * @param testMode - When `true`, appends `testMode=true` query parameter to all
 *   requests, enabling sandbox/test behavior on the server. Defaults to `false`.
 * @returns An object containing rate limit state and action functions.
 *   See {@link UseRateLimitsReturn} for the full return type.
 *
 * @example
 * ```tsx
 * import { useRateLimits } from '@sudobility/ratelimit_client';
 *
 * function RateLimitDashboard({ networkClient, baseUrl, token, entitySlug }) {
 *   const {
 *     config,
 *     isLoadingConfig,
 *     history,
 *     isLoadingHistory,
 *     error,
 *     refreshConfig,
 *     refreshHistory,
 *     clearError,
 *     reset,
 *   } = useRateLimits(networkClient, baseUrl);
 *
 *   useEffect(() => {
 *     refreshConfig(token, entitySlug);
 *     refreshHistory('hour', token, entitySlug);
 *   }, [token, entitySlug]);
 *
 *   if (isLoadingConfig) return <Text>Loading...</Text>;
 *   if (error) return <Text>Error: {error}</Text>;
 *   if (!config) return null;
 *
 *   return <Text>Remaining: {config.limits.hour.remaining}</Text>;
 * }
 * ```
 */
export const useRateLimits = (
  networkClient: NetworkClient,
  baseUrl: string,
  testMode: boolean = false
): UseRateLimitsReturn => {
  const client = useMemo(
    () => new RateLimitClient({ baseUrl, networkClient, testMode }),
    [baseUrl, networkClient, testMode]
  );

  const [config, setConfig] = useState<Optional<RateLimitsConfigData>>(null);
  const [history, setHistory] = useState<Optional<RateLimitHistoryData>>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh rate limits configuration
   * @param token - Firebase ID token
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID)
   */
  const refreshConfig = useCallback(
    async (token: FirebaseIdToken, rateLimitUserId: string): Promise<void> => {
      setIsLoadingConfig(true);
      setError(null);

      try {
        const response = await client.getRateLimitsConfig(
          token,
          rateLimitUserId
        );
        if (response.success && response.data) {
          setConfig(response.data);
        } else {
          setError(response.error || 'Failed to fetch rate limits config');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch rate limits config';
        setError(errorMessage);
        console.error(
          '[useRateLimits] refreshConfig error:',
          errorMessage,
          err
        );
      } finally {
        setIsLoadingConfig(false);
      }
    },
    [client]
  );

  /**
   * Refresh rate limit history for a period type
   * @param periodType - 'hour', 'day', or 'month'
   * @param token - Firebase ID token
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID)
   */
  const refreshHistory = useCallback(
    async (
      periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
      token: FirebaseIdToken,
      rateLimitUserId: string
    ): Promise<void> => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await client.getRateLimitHistory(
          periodType,
          token,
          rateLimitUserId
        );
        if (response.success && response.data) {
          setHistory(response.data);
        } else {
          setError(response.error || 'Failed to fetch rate limit history');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch rate limit history';
        setError(errorMessage);
        console.error(
          '[useRateLimits] refreshHistory error:',
          errorMessage,
          err
        );
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setConfig(null);
    setHistory(null);
    setError(null);
    setIsLoadingConfig(false);
    setIsLoadingHistory(false);
  }, []);

  return useMemo(
    () => ({
      config,
      history,
      isLoadingConfig,
      isLoadingHistory,
      error,
      refreshConfig,
      refreshHistory,
      clearError,
      reset,
    }),
    [
      config,
      history,
      isLoadingConfig,
      isLoadingHistory,
      error,
      refreshConfig,
      refreshHistory,
      clearError,
      reset,
    ]
  );
};
