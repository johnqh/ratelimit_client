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
   * GET /ratelimits
   */
  async getRateLimitsConfig(
    token: FirebaseIdToken
  ): Promise<BaseResponse<RateLimitsConfigData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitsConfigData>
    >(buildUrl(this.baseUrl, '/ratelimits'), {
      headers,
    });

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
   * GET /ratelimits/history/:periodType
   *
   * @param periodType - 'hour', 'day', or 'month'
   * @param token - Firebase ID token
   */
  async getRateLimitHistory(
    periodType: RateLimitPeriodType | 'hour' | 'day' | 'month',
    token: FirebaseIdToken
  ): Promise<BaseResponse<RateLimitHistoryData>> {
    const headers = createAuthHeaders(token);

    const response = await this.networkClient.get<
      BaseResponse<RateLimitHistoryData>
    >(
      buildUrl(
        this.baseUrl,
        `/ratelimits/history/${encodeURIComponent(periodType)}`
      ),
      { headers }
    );

    if (!response.ok || !response.data) {
      throw handleApiError(response, 'get rate limit history');
    }

    return response.data;
  }
}
