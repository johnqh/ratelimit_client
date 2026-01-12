import type {
  NetworkClient,
  RateLimitHistoryData,
  RateLimitPeriodType,
  RateLimitsConfigData,
} from '@sudobility/types';
import type { FirebaseIdToken } from '../types';
import { buildUrl, createAuthHeaders, handleApiError } from '../utils';

/**
 * Response wrapper type matching BaseResponse from @sudobility/types
 */
interface BaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * Rate Limit API client
 * Provides typed methods for all rate limit API endpoints
 */
export class RateLimitClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;

  constructor(config: { baseUrl: string; networkClient: NetworkClient }) {
    this.baseUrl = config.baseUrl;
    this.networkClient = config.networkClient;
  }

  // =============================================================================
  // RATE LIMITS CONFIG (Firebase auth required)
  // =============================================================================

  /**
   * Get rate limit configuration and current usage
   * GET /api/v1/ratelimits/:rateLimitUserId
   *
   * @param token - Firebase ID token
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID)
   */
  async getRateLimitsConfig(
    token: FirebaseIdToken,
    rateLimitUserId: string
  ): Promise<BaseResponse<RateLimitsConfigData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitsConfigData>
    >(
      buildUrl(
        this.baseUrl,
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
   * Get rate limit usage history for a specific period type
   * GET /api/v1/ratelimits/:rateLimitUserId/history/:periodType
   *
   * @param periodType - 'hour', 'day', or 'month'
   * @param token - Firebase ID token
   * @param rateLimitUserId - Identifier for rate limit lookup (e.g., entity slug, user ID)
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
      buildUrl(
        this.baseUrl,
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
