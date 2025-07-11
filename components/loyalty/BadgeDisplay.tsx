'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';

interface UserBadge {
  id: string;
  name: string;
  name_ar: string;
  description_ar: string;
  icon: string;
  color: string;
  tier: string;
  category: string;
  awarded_at: string;
  is_featured: boolean;
}

interface BadgeDisplayProps {
  badges: UserBadge[];
  variant?: 'inline' | 'grid' | 'featured';
  maxDisplay?: number;
  showTooltip?: boolean;
  className?: string;
}

export default function BadgeDisplay({ 
  badges, 
  variant = 'inline', 
  maxDisplay = 3,
  showTooltip = true,
  className = ''
}: BadgeDisplayProps) {
  
  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800 border-amber-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      platinum: 'bg-purple-100 text-purple-800 border-purple-300',
      diamond: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return tierColors[tier] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTierIcon = (tier: string) => {
    const tierIcons: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      diamond: '💠'
    };
    return tierIcons[tier] || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // تصفية الشارات المميزة أو الحد الأقصى
  const displayBadges = variant === 'featured' 
    ? badges.filter(badge => badge.is_featured)
    : badges.slice(0, maxDisplay);

  const remainingCount = badges.length - displayBadges.length;

  if (badges.length === 0) {
    return null;
  }

  // عرض مضمن (للتعليقات)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getTierColor(badge.tier)}`}
            title={showTooltip ? `${badge.name_ar} - ${badge.description_ar}` : undefined}
          >
            <span className="text-sm">{badge.icon}</span>
            <span className="font-medium">{badge.name_ar}</span>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-300">
            <span>+{remainingCount}</span>
          </div>
        )}
      </div>
    );
  }

  // عرض شبكي (للملف الشخصي)
  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">{badge.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">{badge.name_ar}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${getTierColor(badge.tier)}`}>
                    {getTierIcon(badge.tier)} {badge.tier}
                  </Badge>
                  {badge.is_featured && (
                    <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                      ⭐ مميز
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {badge.description_ar}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>حصلت عليها في</span>
              <span>{formatDate(badge.awarded_at)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // عرض الشارات المميزة
  if (variant === 'featured') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${getTierColor(badge.tier)}`}
            title={showTooltip ? `${badge.name_ar} - ${badge.description_ar}` : undefined}
          >
            <span className="text-lg">{badge.icon}</span>
            <span className="font-medium text-sm">{badge.name_ar}</span>
            <span className="text-xs">{getTierIcon(badge.tier)}</span>
          </div>
        ))}
        
        {displayBadges.length === 0 && (
          <div className="text-gray-500 text-sm italic">
            لا توجد شارات مميزة
          </div>
        )}
      </div>
    );
  }

  return null;
}

// مكون شارة واحدة
interface SingleBadgeProps {
  badge: UserBadge;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showTier?: boolean;
  showDate?: boolean;
  className?: string;
}

export function SingleBadge({ 
  badge, 
  size = 'md', 
  showName = true,
  showTier = true,
  showDate = false,
  className = ''
}: SingleBadgeProps) {
  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      bronze: 'bg-amber-100 text-amber-800 border-amber-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      platinum: 'bg-purple-100 text-purple-800 border-purple-300',
      diamond: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return tierColors[tier] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm p-2';
      case 'lg':
        return 'text-lg p-4';
      default:
        return 'text-base p-3';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'lg':
        return 'text-3xl';
      default:
        return 'text-2xl';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-lg border ${getTierColor(badge.tier)} ${getSizeClasses()} ${className}`}
      title={`${badge.name_ar} - ${badge.description_ar}`}
    >
      <span className={getIconSize()}>{badge.icon}</span>
      
      <div className="flex-1">
        {showName && (
          <div className="font-medium">{badge.name_ar}</div>
        )}
        
        {showTier && (
          <div className="text-xs opacity-75 mt-1">
            {badge.tier}
          </div>
        )}
        
        {showDate && (
          <div className="text-xs opacity-75 mt-1">
            {formatDate(badge.awarded_at)}
          </div>
        )}
      </div>
      
      {badge.is_featured && (
        <div className="text-yellow-500 text-sm">⭐</div>
      )}
    </div>
  );
}

// مكون أيقونة الشارة المصغرة
interface BadgeIconProps {
  badge: UserBadge;
  size?: 'xs' | 'sm' | 'md';
  showTooltip?: boolean;
  className?: string;
}

export function BadgeIcon({ 
  badge, 
  size = 'sm', 
  showTooltip = true,
  className = ''
}: BadgeIconProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-4 h-4 text-xs';
      case 'md':
        return 'w-8 h-8 text-lg';
      default:
        return 'w-6 h-6 text-sm';
    }
  };

  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      bronze: 'bg-amber-100 border-amber-300',
      silver: 'bg-gray-100 border-gray-300',
      gold: 'bg-yellow-100 border-yellow-300',
      platinum: 'bg-purple-100 border-purple-300',
      diamond: 'bg-blue-100 border-blue-300'
    };
    return tierColors[tier] || 'bg-gray-100 border-gray-300';
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border ${getTierColor(badge.tier)} ${getSizeClasses()} ${className}`}
      title={showTooltip ? `${badge.name_ar} - ${badge.description_ar}` : undefined}
    >
      {badge.icon}
    </div>
  );
} 