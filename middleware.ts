import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pktiwlfxgfkkqxzhtaxe.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdGl3bGZ4Z2Zra3F4emh0YXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTEwMTEsImV4cCI6MjA3Njk2NzAxMX0.5AV3OaWeLiLliq5GTpbrzWav4Gd_KNaceAyK14BRi4I';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ['/dashboard', '/cellar', '/bottle', '/admin'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing login/register/home with active session
  if ((request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
