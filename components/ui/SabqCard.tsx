// مكون البطاقة المخصص لصحيفة سبق
import React from 'react';
import { cn } from '@/lib/utils';

interface SabqCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  statCard?: boolean;
}

export const SabqCard: React.FC<SabqCardProps> = ({
  children,
  className,
  hover = true,
  glow = false,
  statCard = false
}) => {
  return (
    <div
      className={cn(
        'sabq-card',
        hover && 'hover:sabq-shadow-blue',
        glow && 'sabq-glow',
        statCard && 'sabq-stat-card',
        className
      )}
    >
      {children}
    </div>
  );
};

// مكون رأس البطاقة
export const SabqCardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return (
    <div className={cn('p-6 pb-3', className)}>
      {children}
    </div>
  );
};

// مكون محتوى البطاقة
export const SabqCardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  );
};

// مكون تذييل البطاقة
export const SabqCardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return (
    <div className={cn('p-6 pt-0 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}; 