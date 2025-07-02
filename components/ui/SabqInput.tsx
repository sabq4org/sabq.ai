// مكون الإدخالات المخصص لصحيفة سبق
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SabqInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const SabqInput = forwardRef<HTMLInputElement, SabqInputProps>(
  ({ className, label, error, hint, icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[hsl(var(--sabq-text-primary))] mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--sabq-text-light))]">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              'sabq-input',
              icon && iconPosition === 'left' && 'pr-10',
              icon && iconPosition === 'right' && 'pl-10',
              error && 'border-[hsl(var(--sabq-error))] focus:ring-[hsl(var(--sabq-error)/0.5)]',
              className
            )}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--sabq-text-light))]">
              {icon}
            </div>
          )}
        </div>
        
        {hint && !error && (
          <p className="mt-1 text-sm text-[hsl(var(--sabq-text-light))]">{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-[hsl(var(--sabq-error))]">{error}</p>
        )}
      </div>
    );
  }
);

SabqInput.displayName = 'SabqInput';

// مكون منطقة النص
interface SabqTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const SabqTextarea = forwardRef<HTMLTextAreaElement, SabqTextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[hsl(var(--sabq-text-primary))] mb-2">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={cn(
            'sabq-input min-h-[100px] resize-y',
            error && 'border-[hsl(var(--sabq-error))] focus:ring-[hsl(var(--sabq-error)/0.5)]',
            className
          )}
          {...props}
        />
        
        {hint && !error && (
          <p className="mt-1 text-sm text-[hsl(var(--sabq-text-light))]">{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-[hsl(var(--sabq-error))]">{error}</p>
        )}
      </div>
    );
  }
);

SabqTextarea.displayName = 'SabqTextarea';

// مكون اختيار
interface SabqSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const SabqSelect = forwardRef<HTMLSelectElement, SabqSelectProps>(
  ({ className, label, error, hint, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[hsl(var(--sabq-text-primary))] mb-2">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={cn(
            'sabq-input appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238B9BAD%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:20px] bg-no-repeat bg-left bg-[left_12px_center]',
            'pl-10',
            error && 'border-[hsl(var(--sabq-error))] focus:ring-[hsl(var(--sabq-error)/0.5)]',
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
        
        {hint && !error && (
          <p className="mt-1 text-sm text-[hsl(var(--sabq-text-light))]">{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-[hsl(var(--sabq-error))]">{error}</p>
        )}
      </div>
    );
  }
);

SabqSelect.displayName = 'SabqSelect'; 