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
        'https://api.example.com/api/v1/ratelimits',
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
        await result.current.refreshConfig(token);
      });

      expect(result.current.config).toEqual(mockConfigData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoadingConfig).toBe(false);
    });

    it('should handle API error response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits',
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
        await result.current.refreshConfig(token);
      });

      expect(result.current.error).toBe('Rate limit exceeded');
      expect(result.current.config).toBeNull();
    });

    it('should handle network error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits',
        {
          error: new Error('Network error'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoadingConfig).toBe(false);
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
        'https://api.example.com/api/v1/ratelimits/history/hour',
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
        await result.current.refreshHistory('hour', token);
      });

      expect(result.current.history).toEqual(mockHistoryData);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoadingHistory).toBe(false);
    });

    it('should handle history API error response', async () => {
      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/history/hour',
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
        await result.current.refreshHistory('hour', token);
      });

      expect(result.current.error).toBe('Invalid period type');
      expect(result.current.history).toBeNull();
    });

    it('should handle history network error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits/history/month',
        {
          error: new Error('Connection failed'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshHistory('month', token);
      });

      expect(result.current.error).toBe('Connection failed');
      expect(result.current.isLoadingHistory).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits',
        {
          error: new Error('Some error'),
        },
        'GET'
      );

      const { result } = renderHook(() =>
        useRateLimits(mockNetworkClient, baseUrl)
      );

      await act(async () => {
        await result.current.refreshConfig(token);
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const mockConfigData = { limits: {} };

      mockNetworkClient.setMockResponse(
        'https://api.example.com/api/v1/ratelimits',
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
        await result.current.refreshConfig(token);
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
