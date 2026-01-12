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
      ).rejects.toThrow('Failed to get rate limit history: Invalid period type');
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
  });
});
