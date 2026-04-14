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

  it('should include Bearer prefix in Authorization header', () => {
    const headers = createAuthHeaders('abc123');
    expect(headers.Authorization).toBe('Bearer abc123');
  });

  it('should always include Content-Type and Accept headers', () => {
    const headers = createAuthHeaders('any-token');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Accept).toBe('application/json');
  });

  it('should handle long token strings', () => {
    const longToken = 'a'.repeat(1000);
    const headers = createAuthHeaders(longToken);
    expect(headers.Authorization).toBe(`Bearer ${'a'.repeat(1000)}`);
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

  it('should not include Authorization header', () => {
    const headers = createHeaders();
    expect(headers).not.toHaveProperty('Authorization');
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

  it('should handle base URL without trailing slash', () => {
    const url = buildUrl('https://api.example.com', '/api/v1/test');
    expect(url).toBe('https://api.example.com/api/v1/test');
  });

  it('should handle empty path', () => {
    const url = buildUrl('https://api.example.com', '');
    expect(url).toBe('https://api.example.com');
  });

  it('should handle path with query parameters', () => {
    const url = buildUrl(
      'https://api.example.com',
      '/ratelimits?testMode=true'
    );
    expect(url).toBe('https://api.example.com/ratelimits?testMode=true');
  });

  it('should handle multiple trailing slashes', () => {
    const url = buildUrl('https://api.example.com/', '/path');
    expect(url).toBe('https://api.example.com/path');
  });
});

describe('handleApiError', () => {
  it('should extract error from response.data.error', () => {
    const response = { data: { error: 'Rate limit exceeded' } };
    const error = handleApiError(response, 'get rate limits');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(
      'Failed to get rate limits: Rate limit exceeded'
    );
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

  it('should prefer error field over message field', () => {
    const response = {
      data: { error: 'Primary error', message: 'Secondary message' },
    };
    const error = handleApiError(response, 'perform action');

    expect(error.message).toBe('Failed to perform action: Primary error');
  });

  it('should handle null response', () => {
    const error = handleApiError(null, 'process');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to process: Unknown error');
  });

  it('should handle undefined response', () => {
    const error = handleApiError(undefined, 'process');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to process: Unknown error');
  });

  it('should handle response with empty data', () => {
    const response = { data: {} };
    const error = handleApiError(response, 'load');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to load: Unknown error');
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

  it('should convert boolean values to strings', () => {
    const params = { active: true, disabled: false };
    const queryString = buildQueryString(params);

    expect(queryString).toBe('?active=true&disabled=false');
  });

  it('should convert numeric values to strings', () => {
    const params = { page: 0, limit: 100 };
    const queryString = buildQueryString(params);

    expect(queryString).toBe('?page=0&limit=100');
  });

  it('should handle single parameter', () => {
    const params = { key: 'value' };
    const queryString = buildQueryString(params);

    expect(queryString).toBe('?key=value');
  });

  it('should start with ? when params exist', () => {
    const queryString = buildQueryString({ a: 1 });
    expect(queryString.startsWith('?')).toBe(true);
  });
});
