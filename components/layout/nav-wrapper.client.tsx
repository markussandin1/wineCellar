'use client';

import { Nav } from './nav';

export function NavWrapper() {
  // For Capacitor builds, admin check happens client-side via API calls if needed
  // Default to false for static export, will be checked client-side after mount
  return <Nav isAdmin={false} />;
}
