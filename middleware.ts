// TODO: Implement Supabase Auth middleware
// Temporarily disabled NextAuth middleware until we implement proper Supabase auth

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, allow all requests through
  // TODO: Add Supabase session verification here
  return NextResponse.next();
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
