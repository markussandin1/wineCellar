import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Wine, ArrowLeft } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Tillbaka till appen
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-xl font-semibold text-neutral-900">
                Admin Panel
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            <Link
              href="/admin/analytics"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-b-2 border-transparent hover:border-neutral-300 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analys
            </Link>
            <Link
              href="/admin/wines"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border-b-2 border-transparent hover:border-neutral-300 transition-colors"
            >
              <Wine className="h-4 w-4" />
              Vinkatalog
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
