import type { FirebaseIdToken } from '../types';

/**
 * Creates authentication headers for Firebase-protected API endpoints.
 *
 * @description Builds a standard JSON request headers object that includes
 * a Bearer token in the Authorization header. Used by {@link RateLimitClient}
 * for all authenticated API calls.
 *
 * @param token - A Firebase ID token obtained from `user.getIdToken()`
 * @returns A headers record containing Content-Type, Accept, and Authorization fields
 *
 * @example
 * ```ts
 * const headers = createAuthHeaders('eyJhbGci...');
 * // {
 * //   'Content-Type': 'application/json',
 * //   Accept: 'application/json',
 * //   Authorization: 'Bearer eyJhbGci...'
 * // }
 * ```
 */
export function createAuthHeaders(
  token: FirebaseIdToken
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Creates standard request headers without authentication.
 *
 * @description Builds a basic JSON request headers object suitable for
 * unauthenticated API endpoints.
 *
 * @returns A headers record containing Content-Type and Accept fields
 *
 * @example
 * ```ts
 * const headers = createHeaders();
 * // { 'Content-Type': 'application/json', Accept: 'application/json' }
 * ```
 */
export function createHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Builds a full URL by combining a base URL with a path segment.
 *
 * @description Safely concatenates a base URL and path, removing any trailing
 * slash from the base URL to prevent double-slash issues.
 *
 * @param baseUrl - The base URL of the API (e.g., `'https://api.example.com'`).
 *   A trailing slash will be removed if present.
 * @param path - The path to append (e.g., `'/api/v1/ratelimits/user123'`).
 *   Should start with a forward slash.
 * @returns The concatenated URL string
 *
 * @example
 * ```ts
 * buildUrl('https://api.example.com/', '/api/v1/ratelimits');
 * // => 'https://api.example.com/api/v1/ratelimits'
 * ```
 */
export function buildUrl(baseUrl: string, path: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}${path}`;
}

/**
 * Extracts and formats an error message from an API response.
 *
 * @description Attempts to extract a human-readable error message from a network
 * response object by checking `response.data.error` and `response.data.message`
 * fields. Falls back to `'Unknown error'` if neither is present.
 *
 * @param response - The raw network response object. Expected shape:
 *   `{ data?: { error?: string; message?: string } }`
 * @param operation - A description of the failed operation (e.g., `'get rate limits config'`),
 *   used to construct the error message prefix.
 * @returns An Error instance with message in the format:
 *   `'Failed to {operation}: {errorMessage}'`
 *
 * @example
 * ```ts
 * const error = handleApiError(
 *   { data: { error: 'Rate limit exceeded' } },
 *   'get rate limits'
 * );
 * // Error: 'Failed to get rate limits: Rate limit exceeded'
 * ```
 */
export function handleApiError(response: unknown, operation: string): Error {
  const resp = response as { data?: { error?: string; message?: string } };
  const errorMessage =
    resp?.data?.error || resp?.data?.message || 'Unknown error';
  return new Error(`Failed to ${operation}: ${errorMessage}`);
}

/**
 * Builds a URL query string from a plain object of parameters.
 *
 * @description Converts an object of key-value pairs into a URL-encoded query string.
 * Entries with `undefined` or `null` values are silently skipped. All other values
 * are converted to strings via `String()`.
 *
 * @param params - An object whose entries become query parameters.
 *   Values that are `undefined` or `null` are excluded.
 * @returns A query string prefixed with `'?'`, or an empty string if no valid params exist
 *
 * @example
 * ```ts
 * buildQueryString({ page: 1, limit: 10, search: 'test' });
 * // => '?page=1&limit=10&search=test'
 *
 * buildQueryString({});
 * // => ''
 *
 * buildQueryString({ page: 1, filter: undefined });
 * // => '?page=1'
 * ```
 */
export function buildQueryString(params: object): string {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  }

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}
