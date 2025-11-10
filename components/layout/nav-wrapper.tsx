import { isCurrentUserAdmin } from '@/lib/auth/admin';
import { Nav } from './nav';

export async function NavWrapper() {
  const admin = await isCurrentUserAdmin();

  return <Nav isAdmin={admin} />;
}
