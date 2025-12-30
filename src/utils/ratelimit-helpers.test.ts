import { describe, expect, it } from 'vitest';
import {
  buildQueryString,
  buildUrl,
  createAuthHeaders,
  createHeaders,
  handleApiError,
} from './ratelimit-helpers';

describe('createAuthHeaders', () => {
  it('should create headers with authorization token', () => {
    const token = 'test-firebase-token';
    const headers = createAuthHeaders(token);

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer test-firebase-token',
    });
  });
});

describe('createHeaders', () => {
  it('should create standard headers without auth', () => {
    const headers = createHeaders();

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  });
});

describe('buildUrl', () => {
  it('should combine base URL and path', () => {
    const url = buildUrl('https://api.example.com', '/ratelimits');
    expect(url).toBe('https://api.example.com/ratelimits');
  });

  it('should handle trailing slash in base URL', () => {
    const url = buildUrl('https://api.example.com/', '/ratelimits');
    expect(url).toBe('https://api.example.com/ratelimits');
  });
});

describe('handleApiError', () => {
  it('should extract error from response.data.error', () => {
    const response = { data: { error: 'Rate limit exceeded' } };
    const error = handleApiError(response, 'get rate limits');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to get rate limits: Rate limit exceeded');
  });

  it('should extract error from response.data.message', () => {
    const response = { data: { message: 'Invalid token' } };
    const error = handleApiError(response, 'authenticate');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to authenticate: Invalid token');
  });

  it('should use default message for unknown errors', () => {
    const response = {};
    const error = handleApiError(response, 'fetch data');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to fetch data: Unknown error');
  });
});

describe('buildQueryString', () => {
  it('should build query string from params', () => {
    const params = { page: 1, limit: 10, search: 'test' };
    const queryString = buildQueryString(params);

    expect(queryString).toBe('?page=1&limit=10&search=test');
  });

  it('should return empty string for empty params', () => {
    const queryString = buildQueryString({});
    expect(queryString).toBe('');
  });

  it('should skip undefined and null values', () => {
    const params = { page: 1, search: undefined, filter: null, active: true };
    const queryString = buildQueryString(params);

    expect(queryString).toBe('?page=1&active=true');
  });
});
