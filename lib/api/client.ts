/**
 * API Client Utility
 *
 * Platform-aware API client for calling backend endpoints.
 *
 * - Browser (client-side): Relative URLs (/api/*)
 * - Server (SSR): Absolute URLs (http://localhost:3000/api/* or https://vercel.app/api/*)
 * - Native: Production Vercel URLs (https://wine-cellar.vercel.app/api/*)
 *
 * This enables:
 * - Single codebase for web + native
 * - API routes run on Vercel only
 * - Native apps call production APIs via HTTPS
 */

import { Platform } from '@/shared/platform';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

/**
 * Get base API URL based on environment
 *
 * Native app: Production URL
 * Server-side (SSR): Absolute URL (required for Node.js fetch)
 * Browser (client-side): Relative URL (most efficient)
 *
 * Computed lazily to avoid issues during webpack bundling
 */
function getApiBaseUrl(): string {
  // Native app: Call production Vercel API
  if (Platform.isNative) {
    return process.env.NEXT_PUBLIC_API_URL || 'https://wine-cellar.vercel.app';
  }

  // Server-side (SSR): Need absolute URL for fetch()
  if (typeof window === 'undefined') {
    // Vercel deployment
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Local development
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  // Browser (client-side): Use relative URLs
  return '';
}

/**
 * Get authentication headers for API requests
 *
 * Retrieves the current Supabase session and includes the access token
 * in the Authorization header. This is required for native apps where
 * cookies aren't automatically sent with fetch requests.
 *
 * @returns Headers object with Authorization header if user is authenticated
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  // Only get auth headers on client-side
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
  } catch (error) {
    console.error('Failed to get auth headers:', error);
  }

  return {};
}

/**
 * Generic API call wrapper
 *
 * Handles:
 * - Platform-aware URL construction
 * - Authentication headers (includes Supabase access token)
 * - Standard headers
 * - Error parsing
 * - Response parsing
 *
 * @param endpoint - API endpoint (e.g., '/api/bottles')
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function apiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options?.headers,
      },
      credentials: 'include', // Include cookies for web app
    });

    // Parse response body
    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<T> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestInit
): Promise<T> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * Upload file helper (for FormData)
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const authHeaders = await getAuthHeaders();

  try {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...authHeaders,
        ...options?.headers,
        // Don't set Content-Type header - browser will set it with boundary
      },
      credentials: 'include', // Include cookies for web app
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error(`Upload failed: ${endpoint}`, error);
    throw error;
  }
}

// ============================================================================
// Bottle API Wrappers
// ============================================================================

/**
 * Create new bottle
 */
export async function createBottle(formData: FormData) {
  return apiUpload('/api/bottles', formData);
}

/**
 * Create bottle from scanned label
 */
export async function createBottleFromScan(formData: FormData) {
  return apiUpload('/api/bottles/from-scan', formData);
}

/**
 * Get list of bottles with filters
 */
export async function getBottles(filters?: {
  wineType?: string;
  region?: string;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.wineType) params.set('wineType', filters.wineType);
  if (filters?.region) params.set('region', filters.region);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);

  const query = params.toString();
  return apiGet(`/api/bottles${query ? `?${query}` : ''}`);
}

/**
 * Get bottle by ID
 */
export async function getBottle(id: string) {
  return apiGet(`/api/bottles/${id}`);
}

/**
 * Update bottle
 */
export async function updateBottle(id: string, data: any) {
  return apiPatch(`/api/bottles/${id}`, data);
}

/**
 * Delete bottle
 */
export async function deleteBottle(id: string) {
  return apiDelete(`/api/bottles/${id}`);
}

/**
 * Consume bottle (record consumption)
 */
export async function consumeBottle(id: string, data: any) {
  return apiPost(`/api/bottles/${id}/consume`, data);
}

// ============================================================================
// Auth API Wrappers
// ============================================================================

/**
 * Logout current user
 */
export async function logout() {
  return apiPost('/api/auth/logout');
}

// ============================================================================
// Dashboard API Wrappers
// ============================================================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  return apiGet('/api/dashboard/stats');
}

// ============================================================================
// User API Wrappers
// ============================================================================

/**
 * Get user profile
 */
export async function getUserProfile() {
  return apiGet('/api/user/profile');
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: {
  name?: string;
  preferences?: any;
  settings?: any;
}) {
  return apiPatch('/api/user/profile', data);
}

/**
 * Update user password
 */
export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  return apiPatch('/api/user/password', data);
}

/**
 * Delete user account
 */
export async function deleteAccount() {
  return apiDelete('/api/user/account');
}
