/**
 * Wine Cellar Design System - Reusable Components
 *
 * This file contains small, reusable UI components that implement
 * the Wine Cellar design system.
 */

import { cn } from '@/lib/utils';
import { playfair } from './fonts';
import { type WineType, wineTypes } from './colors';

/**
 * GradientText Component
 * Renders text with the signature candlelight gradient
 * Use for hero headings and large stat numbers only
 */
interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
}

export function GradientText({
  children,
  className,
  as: Component = 'span'
}: GradientTextProps) {
  return (
    <Component
      className={cn(
        'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500',
        'bg-clip-text text-transparent',
        playfair.className,
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * WineTypeIcon Component
 * Renders a wine bottle icon with wine type-specific coloring
 */
interface WineTypeIconProps {
  type: WineType | null;
  className?: string;
}

export function WineTypeIcon({ type, className }: WineTypeIconProps) {
  if (!type) return null;

  const colors = wineTypes[type];

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        className
      )}
      style={{
        background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`
      }}
    >
      <svg
        className="w-4 h-4"
        fill="currentColor"
        viewBox="0 0 24 24"
        style={{
          color: type === 'white' || type === 'sparkling' ? '#78350F' : '#FEF3C7'
        }}
      >
        <path d="M7 2h10v2h-1v15c0 1.654-1.346 3-3 3s-3-1.346-3-3V4H9V2z"/>
      </svg>
    </div>
  );
}

/**
 * WineTypeBadge Component
 * Renders a badge with wine type-specific styling
 */
interface WineTypeBadgeProps {
  type: WineType | null;
  className?: string;
}

export function WineTypeBadge({ type, className }: WineTypeBadgeProps) {
  if (!type) return null;

  const colors = wineTypes[type];
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'text-xs font-semibold uppercase tracking-wider rounded-full',
        className
      )}
      style={{
        background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`,
        color: type === 'white' || type === 'sparkling' ? '#78350F' : '#FEF3C7'
      }}
    >
      {label}
    </span>
  );
}

/**
 * CellarCard Component
 * Standard card component with wine cellar styling
 */
interface CellarCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function CellarCard({
  children,
  className,
  hover = false,
  glow = false
}: CellarCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-amber-900/30',
        'bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-6',
        'backdrop-blur-sm',
        hover && 'hover:scale-105 transition-all cursor-pointer',
        glow && 'shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * StatCard Component
 * Card for displaying statistics with gradient number
 */
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  className
}: StatCardProps) {
  return (
    <CellarCard className={className} glow>
      {/* Ambient glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-300 uppercase tracking-wider">{label}</p>
          {icon && <div className="text-amber-400">{icon}</div>}
        </div>

        <p className={cn(
          'text-5xl font-bold mb-2',
          'bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent'
        )}>
          {value}
        </p>

        {subtitle && (
          <p className="text-sm text-gray-300">{subtitle}</p>
        )}
      </div>
    </CellarCard>
  );
}

/**
 * PageHeader Component
 * Standard page header with Playfair Display
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8', className)}>
      <div>
        <h1 className={cn(
          playfair.className,
          'text-2xl sm:text-4xl md:text-5xl font-bold mb-2',
          'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500',
          'bg-clip-text text-transparent'
        )}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg text-gray-300">{subtitle}</p>
        )}
      </div>
      {action && <div className="sm:flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * SectionHeader Component
 * Section heading with wine cellar styling
 */
interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  action,
  className
}: SectionHeaderProps) {
  return (
    <div className={cn('flex justify-between items-center mb-6', className)}>
      <h2 className={cn(
        playfair.className,
        'text-2xl md:text-3xl font-bold text-amber-400'
      )}>
        {title}
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}
