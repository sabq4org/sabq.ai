'use client';

import React from 'react';
import Link from 'next/link';

// ===============================
// أنواع البيانات
// ===============================

interface Category {
  id: number;
  name_ar: string;
  name_en?: string;
  slug: string;
  color_hex: string;
  icon?: string;
  description?: string;
}

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'ghost';
  showIcon?: boolean;
  clickable?: boolean;
  className?: string;
}

// تحديد ألوان النص بناءً على لون الخلفية
const getTextColor = (backgroundColor: string) => {
  const colorMap: { [key: string]: string } = {
    '#E5F1FA': '#1E40AF',
    '#E3FCEF': '#065F46', 
    '#FFF5E5': '#C2410C',
    '#FDE7F3': '#BE185D',
    '#F2F6FF': '#6366F1',
    '#FEF3C7': '#D97706',
    '#F0FDF4': '#047857',
    '#EFF6FF': '#1D4ED8',
    '#FAF5FF': '#7C3AED',
    '#FFF7ED': '#EA580C',
  };
  
  return colorMap[backgroundColor] || '#374151';
};

// ===============================
// مكون شارة التصنيف
// ===============================

export default function CategoryBadge({
  category,
  size = 'md',
  variant = 'filled',
  showIcon = true,
  clickable = true,
  className = ''
}: CategoryBadgeProps) {
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const getVariantClasses = () => {
    const textColor = getTextColor(category.color_hex);
    
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: category.color_hex,
          color: textColor,
          border: 'none'
        };
      
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: textColor,
          borderColor: category.color_hex,
          borderWidth: '1px',
          borderStyle: 'solid'
        };
      
      case 'ghost':
        return {
          backgroundColor: `${category.color_hex}20`,
          color: textColor,
          border: 'none'
        };
      
      default:
        return {
          backgroundColor: category.color_hex,
          color: textColor,
          border: 'none'
        };
    }
  };

  const variantStyles = getVariantClasses();

  const badgeContent = (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full 
        transition-all duration-200 hover:scale-105 hover:shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
      style={variantStyles}
      title={category.description || category.name_ar}
    >
      {showIcon && category.icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {category.icon}
        </span>
      )}
      
      <span className="truncate">
        {category.name_ar}
      </span>
    </span>
  );

  if (clickable) {
    return (
      <Link 
        href={`/news/${category.slug}`}
        className="inline-block no-underline hover:no-underline"
      >
        {badgeContent}
      </Link>
    );
  }

  return badgeContent;
}

// ===============================
// مكون قائمة التنقل بالتصنيفات
// ===============================

interface CategoryNavigationProps {
  categories: Category[];
  activeSlug?: string;
  className?: string;
}

export function CategoryNavigation({
  categories,
  activeSlug,
  className = ''
}: CategoryNavigationProps) {
  
  return (
    <nav 
      className={`flex flex-wrap gap-2 ${className}`}
      aria-label="تصنيفات الأخبار"
    >
      {categories.map((category) => {
        const isActive = category.slug === activeSlug;
        
        return (
          <Link
            key={category.id}
            href={`/news/${category.slug}`}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg
              transition-all duration-200 font-medium text-sm
              ${isActive 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
            style={isActive ? {
              backgroundColor: `${category.color_hex}20`,
              color: getTextColor(category.color_hex),
              borderColor: `${category.color_hex}40`
            } : {}}
          >
            {category.icon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {category.icon}
              </span>
            )}
            
            <span className="truncate">
              {category.name_ar}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export { getTextColor }; 