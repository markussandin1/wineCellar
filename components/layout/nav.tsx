'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Wine, Home, LogOut, Settings } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { playfair } from '@/lib/design-system/fonts';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Cellar',
    href: '/cellar',
    icon: Wine,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-amber-900/20 bg-gradient-to-r from-[#1A1410] to-[#0A0A0A] backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 text-xl font-bold transition-all hover:scale-105',
              playfair.className
            )}
          >
            <Wine className="h-6 w-6 text-amber-400" />
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Wine Cellar
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-all',
                    'hover:text-amber-400 hover:scale-105',
                    isActive
                      ? 'text-amber-400'
                      : 'text-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="flex items-center gap-4">
            <form action={logout}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-4 pb-4 border-t border-amber-900/10 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-all',
                  isActive
                    ? 'text-amber-400'
                    : 'text-gray-300 hover:text-amber-400'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
