'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AnalysisTypeIconProps {
  type?: 'manual' | 'ai' | 'mixed';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const AnalysisTypeIcon: React.FC<AnalysisTypeIconProps> = ({
  type = 'manual',
  size = 'small',
  showLabel = false,
  className = ''
}) => {
  const typeConfig = {
    manual: {
      icon: '✍️',
      label: 'تحرير يدوي بالكامل',
      color: 'text-blue-600'
    },
    ai: {
      icon: '🤖',
      label: 'مولّد بالذكاء الاصطناعي',
      color: 'text-purple-600'
    },
    mixed: {
      icon: '⚡',
      label: 'مزيج يدوي + AI',
      color: 'text-orange-600'
    }
  };

  const config = typeConfig[type];
  
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const iconElement = (
    <span 
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${config.color} ${className}`}
      title={config.label}
    >
      <span>{config.icon}</span>
      {showLabel && <span className="text-gray-600 dark:text-gray-400">{config.label}</span>}
    </span>
  );

  if (showLabel) {
    return iconElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {iconElement}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AnalysisTypeIcon; 