/**
 * Wine Cellar Design System - Input Components
 */

import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input Component with Wine Cellar Styling
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-[#1A1410] border border-amber-900/30',
            'text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400',
            'transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/50 focus:ring-red-400/50 focus:border-red-400',
            className
          )}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component with Wine Cellar Styling
 */
export interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-[#1A1410] border border-amber-900/30',
            'text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400',
            'transition-all resize-y',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/50 focus:ring-red-400/50 focus:border-red-400',
            className
          )}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select Component with Wine Cellar Styling
 */
export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-[#1A1410] border border-amber-900/30',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400',
            'transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'cursor-pointer',
            error && 'border-red-500/50 focus:ring-red-400/50 focus:border-red-400',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
