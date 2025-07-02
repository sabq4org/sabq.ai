import React, { useState } from 'react';
import Image from 'next/image';

interface SabqLogoProps {
  className?: string;
  width?: number;
  height?: number;
  isWhite?: boolean;
}

export default function SabqLogo({ className = "", width = 120, height = 40, isWhite = false }: SabqLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  // التحقق من الوضع الليلي
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  
  // يمكنك تغيير هذا الرابط إلى رابط شعارك
  const logoUrl = "/logo.png"; // أو استخدم رابط خارجي مثل "https://example.com/logo.png"
  
  // شعار نصي احتياطي
  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`} 
        style={{ width, height }}
      >
        <span className={`text-2xl font-bold ${isWhite ? 'text-white' : isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          سبق
        </span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={logoUrl}
        alt="سبق"
        width={width}
        height={height}
        className="object-contain"
        priority
        unoptimized={logoUrl.startsWith('http')} // للروابط الخارجية
        onError={() => setImageError(true)}
      />
    </div>
  );
} 