import { cookies, headers } from 'next/headers';

async function getServerBaseUrl(): Promise<string> {
  const headerList = await headers();
  const forwardedProto = headerList.get('x-forwarded-proto');
  const forwardedHost = headerList.get('x-forwarded-host');
  const host = forwardedHost || headerList.get('host');

  if (host) {
    const protocol = forwardedProto || 'https';
    return `${protocol}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

async function serializeCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  if (allCookies.length === 0) return undefined;

  return allCookies.map(({ name, value }) => `${name}=${value}`).join('; ');
}

async function serverApiCall<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const baseUrl = await getServerBaseUrl();
  const cookieHeader = await serializeCookies();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers: {
      ...init?.headers,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch (error) {
    // Non-JSON response
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `API request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function serverGetBottles(filters?: {
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
  const result = await serverApiCall<{ bottles: any[] }>(
    `/api/bottles${query ? `?${query}` : ''}`
  );
  return result.bottles ?? [];
}

export async function serverGetBottle(id: string) {
  const result = await serverApiCall<{ bottle: any }>(`/api/bottles/${id}`);
  return result.bottle;
}

export async function serverGetDashboardStats() {
  return serverApiCall<{
    totalBottles: number;
    uniqueWines: number;
    totalValue: number;
    currency: string;
    recentBottles: any[];
    byType: Record<string, number>;
    byRegion: Record<string, number>;
  }>('/api/dashboard/stats');
}

export async function serverGetUserProfile() {
  return serverApiCall<{
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    preferences: any;
    settings: any;
    bottleCount: number;
  }>('/api/user/profile');
}
