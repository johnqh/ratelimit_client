import { beforeEach, describe, expect, it } from 'vitest';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { RateLimitClient } from './RateLimitClient';

describe('RateLimitClient', () => {
  const baseUrl = 'https://api.example.com';
  const token = 'test-firebase-token';
  const rateLimitUserId = 'my-entity';
  let mockNetworkClient: MockNetworkClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
  });

  describe('constructor', () => {
    it('should create client with required config', () => {
      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      expect(client).toBeDefined();
    });

    it('should create client with testMode enabled', () => {
      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
        testMode: true,
      });
      expect(client).toBeDefined();
    });
  });

  describe('getRateLimitsConfig', () => {
    it('should fetch rate limits config successfully', async () => {
      const mockConfigData = {
        limits: {
          hour: { limit: 100, remaining: 50, resetAt: '2024-01-01T01:00:00Z' },
          day: { limit: 1000, remaining: 500, resetAt: '2024-01-02T00:00:00Z' },
          month: {
            limit: 10000,
            remaining: 5000,
            resetAt: '2024-02-01T00:00:00Z',
          },
        },
      };

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: {
            success: true,
            data: mockConfigData,
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      const result = await client.getRateLimitsConfig(token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity',
          'GET'
        )
      ).toBe(true);

      const lastRequest = mockNetworkClient.getLastRequest();
      expect(lastRequest?.options?.headers).toMatchObject({
        Authorization: 'Bearer test-firebase-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConfigData);
    });

    it('should throw error when response is not ok', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: false,
          data: { error: 'Unauthorized' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitsConfig(token, rateLimitUserId)
      ).rejects.toThrow('Failed to get rate limits config: Unauthorized');
    });

    it('should throw error when response data is missing', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: undefined,
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitsConfig(token, rateLimitUserId)
      ).rejects.toThrow('Failed to get rate limits config');
    });

    it('should encode special characters in rateLimitUserId', async () => {
      const mockConfigData = {
        limits: {
          hour: { limit: 100, remaining: 50, resetAt: '2024-01-01T01:00:00Z' },
        },
      };

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my%20org%2Ftest',
        {
          ok: true,
          data: {
            success: true,
            data: mockConfigData,
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitsConfig(token, 'my org/test');

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my%20org%2Ftest',
          'GET'
        )
      ).toBe(true);
    });

    it('should propagate network errors', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          error: new Error('Network connection refused'),
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitsConfig(token, rateLimitUserId)
      ).rejects.toThrow('Network connection refused');
    });

    it('should throw error for 401 Unauthorized response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: false,
          status: 401,
          data: { error: 'Invalid or expired token' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitsConfig(token, rateLimitUserId)
      ).rejects.toThrow(
        'Failed to get rate limits config: Invalid or expired token'
      );
    });

    it('should throw error for 404 Not Found response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: false,
          status: 404,
          data: { error: 'Rate limit configuration not found' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitsConfig(token, rateLimitUserId)
      ).rejects.toThrow(
        'Failed to get rate limits config: Rate limit configuration not found'
      );
    });

    it('should throw error for 500 Internal Server Error response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: false,
          status: 500,
          data: { error: 'Internal server error' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitsConfig(token, rateLimitUserId)
      ).rejects.toThrow(
        'Failed to get rate limits config: Internal server error'
      );
    });

    it('should include Content-Type and Accept headers', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitsConfig(token, rateLimitUserId);

      const lastRequest = mockNetworkClient.getLastRequest();
      expect(lastRequest?.options?.headers).toMatchObject({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer test-firebase-token',
      });
    });

    it('should handle baseUrl with trailing slash', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl: 'https://api.example.com/',
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitsConfig(token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity',
          'GET'
        )
      ).toBe(true);
    });
  });

  describe('getRateLimitHistory', () => {
    it('should fetch rate limit history for hour period', async () => {
      const mockHistoryData = {
        periodType: 'hour',
        history: [
          { timestamp: '2024-01-01T00:00:00Z', usage: 10 },
          { timestamp: '2024-01-01T01:00:00Z', usage: 15 },
        ],
      };

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: true,
          data: {
            success: true,
            data: mockHistoryData,
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      const result = await client.getRateLimitHistory(
        'hour',
        token,
        rateLimitUserId
      );

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
          'GET'
        )
      ).toBe(true);

      const lastRequest = mockNetworkClient.getLastRequest();
      expect(lastRequest?.options?.headers).toMatchObject({
        Authorization: 'Bearer test-firebase-token',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistoryData);
    });

    it('should fetch rate limit history for day period', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/day',
        {
          ok: true,
          data: {
            success: true,
            data: { periodType: 'day', history: [] },
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitHistory('day', token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity/history/day',
          'GET'
        )
      ).toBe(true);
    });

    it('should fetch rate limit history for month period', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/month',
        {
          ok: true,
          data: {
            success: true,
            data: { periodType: 'month', history: [] },
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitHistory('month', token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity/history/month',
          'GET'
        )
      ).toBe(true);
    });

    it('should throw error when history response is not ok', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: false,
          data: { message: 'Invalid period type' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitHistory('hour', token, rateLimitUserId)
      ).rejects.toThrow(
        'Failed to get rate limit history: Invalid period type'
      );
    });

    it('should throw error when history response data is missing', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: true,
          data: undefined,
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitHistory('hour', token, rateLimitUserId)
      ).rejects.toThrow('Failed to get rate limit history');
    });

    it('should encode special characters in rateLimitUserId and periodType', async () => {
      const mockHistoryData = {
        periodType: 'day',
        history: [],
      };

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/test%2Forg/history/day',
        {
          ok: true,
          data: {
            success: true,
            data: mockHistoryData,
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitHistory('day', token, 'test/org');

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/test%2Forg/history/day',
          'GET'
        )
      ).toBe(true);
    });

    it('should propagate network errors for history requests', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          error: new Error('Request timeout'),
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitHistory('hour', token, rateLimitUserId)
      ).rejects.toThrow('Request timeout');
    });

    it('should throw error for 401 Unauthorized history response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/day',
        {
          ok: false,
          status: 401,
          data: { error: 'Token expired' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitHistory('day', token, rateLimitUserId)
      ).rejects.toThrow('Failed to get rate limit history: Token expired');
    });

    it('should throw error for 500 Internal Server Error history response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/month',
        {
          ok: false,
          status: 500,
          data: { error: 'Database unavailable' },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });

      await expect(
        client.getRateLimitHistory('month', token, rateLimitUserId)
      ).rejects.toThrow(
        'Failed to get rate limit history: Database unavailable'
      );
    });
  });

  describe('testMode', () => {
    it('should append testMode=true to config URL when testMode is enabled', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity?testMode=true',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
        testMode: true,
      });
      await client.getRateLimitsConfig(token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity?testMode=true',
          'GET'
        )
      ).toBe(true);
    });

    it('should append testMode=true to history URL when testMode is enabled', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour?testMode=true',
        {
          ok: true,
          data: {
            success: true,
            data: { periodType: 'hour', history: [] },
          },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
        testMode: true,
      });
      await client.getRateLimitHistory('hour', token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity/history/hour?testMode=true',
          'GET'
        )
      ).toBe(true);
    });

    it('should not append testMode param when testMode is false', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
        testMode: false,
      });
      await client.getRateLimitsConfig(token, rateLimitUserId);

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity',
          'GET'
        )
      ).toBe(true);
    });

    it('should default testMode to false when not specified', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      const client = new RateLimitClient({
        baseUrl,
        networkClient: mockNetworkClient,
      });
      await client.getRateLimitsConfig(token, rateLimitUserId);

      // Should NOT have testMode in the URL
      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity',
          'GET'
        )
      ).toBe(true);
    });
  });
});
