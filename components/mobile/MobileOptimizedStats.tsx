'use client';

import React from 'react';

interface StatItem {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface MobileOptimizedStatsProps {
  stats: StatItem[];
  className?: string;
  variant?: 'dark' | 'light' | 'gradient';
}

export default function MobileOptimizedStats({ 
  stats, 
  className = '', 
  variant = 'dark' 
}: MobileOptimizedStatsProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'light':
        return 'bg-white/90 text-gray-800 border-gray-200';
      case 'gradient':
        return 'bg-gradient-to-r from-purple-900/90 to-blue-900/90 text-white border-white/20';
      default:
        return 'bg-black/80 text-white border-white/20';
    }
  };

  return (
    <div className={`stats-container ${getVariantStyles()} backdrop-blur-sm ${className}`}>
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={`stat-box ${index > 0 ? 'border-l' : ''}`}
          style={{ borderColor: 'inherit' }}
        >
          {stat.icon && (
            <div className="stat-icon mb-1 opacity-80">
              {stat.icon}
            </div>
          )}
          <div className="stat-value">
            {stat.value}
          </div>
          <div className="stat-label">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
} 