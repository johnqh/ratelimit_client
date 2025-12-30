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
 * Return type for useRateLimits hook
 */
export interface UseRateLimitsReturn {
  /** Current rate limits configuration and usage */
  config: Optional<RateLimitsConfigData>;
  /** Rate limit history for selected period */
  history: Optional<RateLimitHistoryData>;
  /** Loading state for config fetch */
  isLoadingConfig: boolean;
  /** Loading state for history fetch */
  isLoadingHistory: boolean;
  /** Error message if any */
  error: Optional<string>;

  /** Refresh rate limits configuration */
  refreshConfig: (token: FirebaseIdToken) => Promise<void>;

  /** Refresh rate limit history for a period type */
  refreshHistory: (
    periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
    token: FirebaseIdToken
  ) => Promise<void>;

  /** Clear error state */
  clearError: () => void;

  /** Reset all state */
  reset: () => void;
}

/**
 * Hook for fetching rate limit configuration and history
 * Provides read-only access to rate limit data
 */
export const useRateLimits = (
  networkClient: NetworkClient,
  baseUrl: string
): UseRateLimitsReturn => {
  const client = useMemo(
    () => new RateLimitClient({ baseUrl, networkClient }),
    [baseUrl, networkClient]
  );

  const [config, setConfig] = useState<Optional<RateLimitsConfigData>>(null);
  const [history, setHistory] = useState<Optional<RateLimitHistoryData>>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  /**
   * Refresh rate limits configuration
   */
  const refreshConfig = useCallback(
    async (token: FirebaseIdToken): Promise<void> => {
      setIsLoadingConfig(true);
      setError(null);

      try {
        const response = await client.getRateLimitsConfig(token);
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
   */
  const refreshHistory = useCallback(
    async (
      periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
      token: FirebaseIdToken
    ): Promise<void> => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await client.getRateLimitHistory(periodType, token);
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
