import type {
  NetworkClient,
  RateLimitHistoryData,
  RateLimitPeriodType,
  RateLimitsConfigData,
} from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { buildUrl, createAuthHeaders, handleApiError } from '../utils';

/**
 * Standard API response wrapper matching `BaseResponse` from `@sudobility/types`.
 *
 * @description Wraps all API responses with a consistent structure containing
 * a `success` flag, optional typed `data` payload, optional `error` message,
 * and optional ISO 8601 `timestamp`.
 *
 * @typeParam T - The type of the `data` payload
 */
interface BaseResponse<T> {
  /** Whether the API request was successful */
  success: boolean;
  /** The typed response payload, present when `success` is `true` */
  data?: T;
  /** Error message, present when `success` is `false` */
  error?: string;
  /** ISO 8601 timestamp of the response */
  timestamp?: string;
}

/**
 * HTTP client for the Rate Limit API.
 *
 * @description Provides typed methods for all rate limit API endpoints, including
 * fetching rate limit configuration/usage and historical usage data. All methods
 * require Firebase authentication and use a `NetworkClient` for HTTP requests.
 *
 * The `rateLimitUserId` parameter is a generic identifier -- it can represent an
 * entity slug, a user ID, or any other identifier depending on the application.
 *
 * @example
 * ```ts
 * import { RateLimitClient } from '@sudobility/ratelimit_client';
 *
 * const client = new RateLimitClient({
 *   baseUrl: 'https://api.example.com',
 *   networkClient: myNetworkClient,
 * });
 *
 * // Fetch rate limit config
 * const config = await client.getRateLimitsConfig(firebaseToken, 'my-entity');
 *
 * // Fetch hourly usage history
 * const history = await client.getRateLimitHistory('hour', firebaseToken, 'my-entity');
 * ```
 */
export class RateLimitClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;
  private readonly testMode: boolean;

  /**
   * Creates a new RateLimitClient instance.
   *
   * @param config - Client configuration
   * @param config.baseUrl - Base URL of the Rate Limit API (e.g., `'https://api.example.com'`)
   * @param config.networkClient - A `NetworkClient` instance for making HTTP requests
   * @param config.testMode - When `true`, appends `testMode=true` query parameter to all
   *   requests, enabling sandbox/test behavior on the server. Defaults to `false`.
   */
  constructor(config: {
    baseUrl: string;
    networkClient: NetworkClient;
    testMode?: boolean;
  }) {
    this.baseUrl = config.baseUrl;
    this.networkClient = config.networkClient;
    this.testMode = config.testMode ?? false;
  }

  /**
   * Builds a full URL from a path, optionally appending the `testMode=true` query parameter.
   *
   * @param path - The API path to append to the base URL
   * @returns The fully constructed URL string
   */
  private buildUrlWithTestMode(path: string): string {
    const url = buildUrl(this.baseUrl, path);
    if (this.testMode) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}testMode=true`;
    }
    return url;
  }

  // =============================================================================
  // RATE LIMITS CONFIG (Firebase auth required)
  // =============================================================================

  /**
   * Fetches the rate limit configuration and current usage for a given user/entity.
   *
   * @description Calls `GET /api/v1/ratelimits/:rateLimitUserId` with Firebase
   * authentication. Returns the current rate limit configuration including limits
   * and remaining quota for each period type (hour, day, month).
   *
   * The `rateLimitUserId` is URI-encoded to safely handle special characters
   * such as slashes and spaces.
   *
   * @param token - Firebase ID token for authentication
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID).
   *   Will be URI-encoded in the request URL.
   * @returns A promise resolving to a {@link BaseResponse} containing {@link RateLimitsConfigData}
   * @throws {Error} When the response is not ok or data is missing. The error message
   *   follows the format: `'Failed to get rate limits config: {detail}'`
   *
   * @example
   * ```ts
   * const result = await client.getRateLimitsConfig(token, 'my-entity');
   * if (result.success && result.data) {
   *   console.log(result.data.limits.hour.remaining);
   * }
   * ```
   */
  async getRateLimitsConfig(
    token: FirebaseIdToken,
    rateLimitUserId: string
  ): Promise<BaseResponse<RateLimitsConfigData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitsConfigData>
    >(
      this.buildUrlWithTestMode(
        `/api/v1/ratelimits/${encodeURIComponent(rateLimitUserId)}`
      ),
      {
        headers,
      }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get rate limits config');
    }

    return response.data;
  }

  // =============================================================================
  // RATE LIMITS HISTORY (Firebase auth required)
  // =============================================================================

  /**
   * Fetches the rate limit usage history for a specific period type.
   *
   * @description Calls `GET /api/v1/ratelimits/:rateLimitUserId/history/:periodType`
   * with Firebase authentication. Returns historical usage data for the specified
   * time period granularity.
   *
   * Both the `rateLimitUserId` and `periodType` are URI-encoded to safely handle
   * special characters.
   *
   * @param periodType - The time period granularity: `'hour'`, `'day'`, or `'month'`
   * @param token - Firebase ID token for authentication
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID).
   *   Will be URI-encoded in the request URL.
   * @returns A promise resolving to a {@link BaseResponse} containing {@link RateLimitHistoryData}
   * @throws {Error} When the response is not ok or data is missing. The error message
   *   follows the format: `'Failed to get rate limit history: {detail}'`
   *
   * @example
   * ```ts
   * const result = await client.getRateLimitHistory('hour', token, 'my-entity');
   * if (result.success && result.data) {
   *   for (const entry of result.data.history) {
   *     console.log(`${entry.timestamp}: ${entry.usage} requests`);
   *   }
   * }
   * ```
   */
  async getRateLimitHistory(
    periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
    token: FirebaseIdToken,
    rateLimitUserId: string
  ): Promise<BaseResponse<RateLimitHistoryData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitHistoryData>
    >(
      this.buildUrlWithTestMode(
        `/api/v1/ratelimits/${encodeURIComponent(rateLimitUserId)}/history/${encodeURIComponent(periodType)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get rate limit history');
    }

    return response.data;
  }
}
