import React from 'react';

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

interface AvatarFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ className, children }) => {
  return (
    <div className={`relative inline-block rounded-full overflow-hidden ${className || ''}`}>
      {children}
    </div>
  );
};

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className, children }) => {
  return (
    <div className={`w-full h-full flex items-center justify-center font-medium ${className || ''}`}>
      {children}
    </div>
  );
}; 