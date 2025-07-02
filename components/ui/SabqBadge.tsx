// مكون الشارات والتنبيهات المخصص لصحيفة سبق
import React from 'react';
import { cn } from '@/lib/utils';

// أنواع الشارات
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

// أنواع التصنيفات
type CategoryType = 'politics' | 'economy' | 'tech' | 'culture' | 'sports' | 'health' | 'society' | 'education';

interface SabqBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const SabqBadge: React.FC<SabqBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const variantClasses = {
    default: 'bg-[hsl(var(--sabq-bg-secondary))] text-[hsl(var(--sabq-text-primary))]',
    success: 'sabq-badge-success',
    warning: 'sabq-badge-warning',
    error: 'sabq-badge-error',
    info: 'sabq-alert-info'
  };

  return (
    <span
      className={cn(
        'sabq-category-badge font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

// مكون شارة التصنيف
interface SabqCategoryBadgeProps {
  category: CategoryType;
  size?: BadgeSize;
  className?: string;
}

export const SabqCategoryBadge: React.FC<SabqCategoryBadgeProps> = ({
  category,
  size = 'md',
  className
}) => {
  const categoryClasses = {
    politics: 'sabq-category-politics',
    economy: 'sabq-category-economy',
    tech: 'sabq-category-tech',
    culture: 'sabq-category-culture',
    sports: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    health: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    society: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  };

  const categoryLabels = {
    politics: 'سياسة',
    economy: 'اقتصاد',
    tech: 'تقنية',
    culture: 'ثقافة',
    sports: 'رياضة',
    health: 'صحة',
    society: 'مجتمع',
    education: 'تعليم'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span
      className={cn(
        'sabq-category-badge font-medium',
        sizeClasses[size],
        categoryClasses[category],
        className
      )}
    >
      {categoryLabels[category]}
    </span>
  );
};

// مكون التنبيه
interface SabqAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: React.ReactNode;
  closeable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const SabqAlert: React.FC<SabqAlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  closeable = false,
  onClose,
  className
}) => {
  const variantClasses = {
    info: 'sabq-alert-info',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
  };

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={cn('sabq-alert', variantClasses[variant], className)}>
      <div className="flex-shrink-0">
        {icon || defaultIcons[variant]}
      </div>
      
      <div className="flex-1">
        {title && (
          <h3 className="font-semibold mb-1">{title}</h3>
        )}
        <div>{children}</div>
      </div>
      
      {closeable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 mr-2 hover:opacity-70 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}; 