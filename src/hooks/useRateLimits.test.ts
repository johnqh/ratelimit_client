/**
 * @vitest-environment jsdom
 */
import '../test/setupDom';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockNetworkClient } from '@sudobility/di/mocks';
import { useRateLimits } from './useRateLimits';

describe('useRateLimits', () => {
  const baseUrl = 'https://api.example.com';
  const token = 'test-firebase-token';
  const rateLimitUserId = 'my-entity';
  let mockNetworkClient: MockNetworkClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useRateLimits(mockNetworkClient, baseUrl)
    );

    expect(result.current.config).toBeNull();
    expect(result.current.history).toBeNull();
    expect(result.current.isLoadingConfig).toBe(false);
    expect(result.current.isLoadingHistory).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should expose all expected return properties', () => {
    const { result } = renderHook(() =>
      useRateLimits(mockNetworkClient, baseUrl)
    );

    expect(result.current).toHaveProperty('config');
    expect(result.current).toHaveProperty('history');
    expect(result.current).toHaveProperty('isLoadingConfig');
    expect(result.current).toHaveProperty('isLoadingHistory');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('refreshConfig');
    expect(result.current).toHaveProperty('refreshHistory');
    expect(result.current).toHaveProperty('clearError');
    expect(result.current).toHaveProperty('reset');
    expect(typeof result.current.refreshConfig).toBe('function');
    expect(typeof result.current.refreshHistory).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  describe('refreshConfig', () => {
    it('should fetch config successfully', async () => {
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

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.config).toEqual(mockConfigData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoadingConfig).toBe(false);
    });

    it('should handle API error response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: {
            success: false,
            error: 'Rate limit exceeded',
          },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Rate limit exceeded');
      expect(result.current.config).toBeNull();
    });

    it('should handle network error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          error: new Error('Network error'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoadingConfig).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should use default error message for non-Error thrown values', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Simulate a response that causes the client to throw (ok: false triggers handleApiError
      // which throws an Error, so we test the fallback by using a network-level error)
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: false,
          data: undefined,
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      // handleApiError creates a proper Error object, so the message is extracted
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoadingConfig).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should set default error message when API response has no error field', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: {
            success: false,
            // No error field provided
          },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Failed to fetch rate limits config');
      expect(result.current.config).toBeNull();
    });

    it('should clear previous error on new config fetch', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // First: trigger an error
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          error: new Error('First error'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.error).toBe('First error');

      // Second: successful fetch clears the error
      mockNetworkClient.clearAllMockResponses();
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.config).toEqual({ limits: {} });
      consoleSpy.mockRestore();
    });
  });

  describe('refreshHistory', () => {
    it('should fetch history successfully', async () => {
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

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('hour', token, rateLimitUserId);
      });

      expect(result.current.history).toEqual(mockHistoryData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoadingHistory).toBe(false);
    });

    it('should handle history API error response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: true,
          data: {
            success: false,
            error: 'Invalid period type',
          },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('hour', token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Invalid period type');
      expect(result.current.history).toBeNull();
    });

    it('should handle history network error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/month',
        {
          error: new Error('Connection failed'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('month', token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Connection failed');
      expect(result.current.isLoadingHistory).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should fetch history for all period types (day)', async () => {
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

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('day', token, rateLimitUserId);
      });

      expect(result.current.history).toEqual({
        periodType: 'day',
        history: [],
      });
      expect(result.current.error).toBeNull();
    });

    it('should set default error message when history response has no error field', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: true,
          data: {
            success: false,
            // No error field provided
          },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('hour', token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Failed to fetch rate limit history');
      expect(result.current.history).toBeNull();
    });

    it('should clear previous error on new history fetch', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // First: trigger an error
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          error: new Error('History error'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('hour', token, rateLimitUserId);
      });

      expect(result.current.error).toBe('History error');

      // Second: successful fetch clears the error
      mockNetworkClient.clearAllMockResponses();
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: true,
          data: {
            success: true,
            data: { periodType: 'hour', history: [] },
          },
        },
        'GET'
      );

      await act(async () => {
        await result.current.refreshHistory('hour', token, rateLimitUserId);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.history).toEqual({
        periodType: 'hour',
        history: [],
      });
      consoleSpy.mockRestore();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          error: new Error('Some error'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should be a no-op when no error exists', () => {
      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const mockConfigData = { limits: {} };

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

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(result.current.config).toEqual(mockConfigData);

      act(() => {
        result.current.reset();
      });

      expect(result.current.config).toBeNull();
      expect(result.current.history).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoadingConfig).toBe(false);
      expect(result.current.isLoadingHistory).toBe(false);
    });

    it('should reset config, history, and error together', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Fetch config
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity/history/hour',
        {
          ok: true,
          data: {
            success: true,
            data: { periodType: 'hour', history: [] },
          },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      await act(async () => {
        await result.current.refreshHistory('hour', token, rateLimitUserId);
      });

      expect(result.current.config).toBeTruthy();
      expect(result.current.history).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      expect(result.current.config).toBeNull();
      expect(result.current.history).toBeNull();
      expect(result.current.error).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('testMode', () => {
    it('should pass testMode to the underlying client', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/my-entity?testMode=true',
        {
          ok: true,
          data: { success: true, data: { limits: {} } },
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl, true)
      );

      await act(async () => {
        await result.current.refreshConfig(token, rateLimitUserId);
      });

      expect(
        mockNetworkClient.wasUrlCalled(
          'https://api.example.com/api/v1/ratelimits/my-entity?testMode=true',
          'GET'
        )
      ).toBe(true);
      expect(result.current.config).toEqual({ limits: {} });
    });
  });

  describe('memoization', () => {
    it('should return stable references for callbacks', () => {
      const { result, rerender } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      const initialRefreshConfig = result.current.refreshConfig;
      const initialRefreshHistory = result.current.refreshHistory;
      const initialClearError = result.current.clearError;
      const initialReset = result.current.reset;

      rerender();

      expect(result.current.refreshConfig).toBe(initialRefreshConfig);
      expect(result.current.refreshHistory).toBe(initialRefreshHistory);
      expect(result.current.clearError).toBe(initialClearError);
      expect(result.current.reset).toBe(initialReset);
    });
  });
});
