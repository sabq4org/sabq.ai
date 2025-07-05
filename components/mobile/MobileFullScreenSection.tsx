'use client';

import React from 'react';

interface MobileFullScreenSectionProps {
  children: React.ReactNode;
  background?: 'gradient-blue' | 'gradient-purple' | 'solid' | 'transparent';
  className?: string;
  roundedBottom?: boolean;
  roundedTop?: boolean;
}

export default function MobileFullScreenSection({
  children,
  background = 'transparent',
  className = '',
  roundedBottom = false,
  roundedTop = false
}: MobileFullScreenSectionProps) {
  const getBackgroundStyles = () => {
    switch (background) {
      case 'gradient-blue':
        return 'bg-gradient-to-b from-blue-600 to-blue-400';
      case 'gradient-purple':
        return 'bg-gradient-to-br from-purple-600 to-blue-500';
      case 'solid':
        return 'bg-blue-600';
      default:
        return '';
    }
  };

  const getRoundedStyles = () => {
    if (roundedBottom && roundedTop) {
      return 'rounded-t-3xl rounded-b-3xl';
    } else if (roundedBottom) {
      return 'rounded-b-3xl';
    } else if (roundedTop) {
      return 'rounded-t-3xl';
    }
    return '';
  };

  return (
    <section 
      className={`
        w-full 
        ${getBackgroundStyles()} 
        ${getRoundedStyles()}
        ${className}
      `}
      style={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        paddingLeft: 'calc(50vw - 50%)',
        paddingRight: 'calc(50vw - 50%)'
      }}
    >
      <div className="px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </section>
  );
} 