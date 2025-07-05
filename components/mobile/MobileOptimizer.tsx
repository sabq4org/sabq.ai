'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Wifi, WifiOff, Battery, Signal } from 'lucide-react';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export default function MobileOptimizer({ children }: MobileOptimizerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [networkType, setNetworkType] = useState<string>('');

  useEffect(() => {
    // فحص نوع الجهاز
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    // فحص حالة الشبكة
    const checkNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkType(connection.effectiveType || 'unknown');
      }
    };

    // فحص مستوى البطارية
    const checkBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    // تطبيق تحسينات الموبايل
    const applyMobileOptimizations = () => {
      // إضافة CSS للموبايل
      const mobileStyles = `
        /* تحسينات الموبايل الأساسية */
        @media (max-width: 768px) {
          /* تحسين التمرير */
          * {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          /* تحسين النصوص */
          body {
            font-size: 16px;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
          }
          
          /* تحسين الأزرار */
          button, a {
            min-height: 44px;
            min-width: 44px;
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
          }
          
          /* تحسين المدخلات */
          input, select, textarea {
            font-size: 16px;
            padding: 12px;
            border-radius: 8px;
          }
          
          /* تحسين البطاقات */
          .card, .group {
            border-radius: 12px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          /* تحسين الشبكة */
          .grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          /* تحسين الهوامش */
          .container {
            padding-left: 16px;
            padding-right: 16px;
          }
          
          /* تحسين العناوين */
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 18px; }
          
          /* تحسين النصوص */
          p { font-size: 16px; }
          .text-sm { font-size: 14px; }
          .text-xs { font-size: 12px; }
        }
        
        /* تحسينات للشاشات الصغيرة جداً */
        @media (max-width: 375px) {
          .container {
            padding-left: 12px;
            padding-right: 12px;
          }
          
          h1 { font-size: 20px; }
          h2 { font-size: 18px; }
          h3 { font-size: 16px; }
        }
        
        /* تحسينات للوضع المظلم */
        @media (prefers-color-scheme: dark) {
          .mobile-dark {
            background-color: #111827;
            color: #f9fafb;
          }
        }
        
        /* تحسينات للأداء */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;

      const styleElement = document.createElement('style');
      styleElement.textContent = mobileStyles;
      document.head.appendChild(styleElement);
    };

    // تنفيذ الفحوصات
    checkDevice();
    checkNetworkStatus();
    checkBattery();
    applyMobileOptimizations();

    // مراقبة تغييرات الشبكة
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    // مراقبة تغيير حجم الشاشة
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  // مؤشر حالة الشبكة
  const NetworkIndicator = () => {
    if (!isMobile) return null;

    return (
      <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>{networkType}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>غير متصل</span>
          </>
        )}
      </div>
    );
  };

  // مؤشر البطارية
  const BatteryIndicator = () => {
    if (!isMobile || batteryLevel === null) return null;

    const getBatteryColor = (level: number) => {
      if (level > 50) return 'text-green-500';
      if (level > 20) return 'text-yellow-500';
      return 'text-red-500';
    };

    const getBatteryIcon = (level: number) => {
      if (level > 80) return 'battery-full';
      if (level > 60) return 'battery-high';
      if (level > 40) return 'battery-medium';
      if (level > 20) return 'battery-low';
      return 'battery-empty';
    };

    return (
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-1 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm text-xs font-medium ${getBatteryColor(batteryLevel)}`}>
        <Battery className="w-3 h-3" />
        <span>{batteryLevel}%</span>
      </div>
    );
  };

  // تحسينات إضافية للموبايل
  const MobileEnhancements = () => {
    if (!isMobile) return null;

    return (
      <>
        {/* إضافة safe area للـ iPhone */}
        <div className="safe-area-top" />
        
        {/* تحسين التمرير */}
        <style jsx global>{`
          body {
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          
          /* تحسين أزرار اللمس */
          button, a {
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
          }
          
          /* منع التكبير في المدخلات */
          input, select, textarea {
            font-size: 16px !important;
          }
          
          /* تحسين العرض للنصوص العربية */
          body {
            direction: rtl;
            text-align: right;
          }
        `}</style>
      </>
    );
  };

  return (
    <>
      {children}
      <NetworkIndicator />
      <BatteryIndicator />
      <MobileEnhancements />
    </>
  );
}

// مكون لتحسين الأداء على الموبايل
export function MobilePerformanceOptimizer() {
  useEffect(() => {
    // تحسين تحميل الصور
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
      });
    };

    // تحسين الخطوط
    const optimizeFonts = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.href = '/fonts/arabic-font.woff2';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // تحسين التمرير
    const optimizeScrolling = () => {
      (document.body.style as any).webkitOverflowScrolling = 'touch';
      document.body.style.scrollBehavior = 'smooth';
    };

    optimizeImages();
    optimizeFonts();
    optimizeScrolling();
  }, []);

  return null;
}

// مكون لتحسين التفاعل باللمس
export function TouchInteractionOptimizer() {
  useEffect(() => {
    // تحسين أزرار اللمس
    const optimizeTouchTargets = () => {
      const touchElements = document.querySelectorAll('button, a, input, select, textarea');
      touchElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.minHeight = '44px';
        htmlElement.style.minWidth = '44px';
        (htmlElement.style as any).webkitTapHighlightColor = 'rgba(59, 130, 246, 0.1)';
      });
    };

    // تحسين ردود الأفعال
    const optimizeTouchFeedback = () => {
      document.addEventListener('touchstart', () => {}, { passive: true });
      document.addEventListener('touchmove', () => {}, { passive: true });
    };

    optimizeTouchTargets();
    optimizeTouchFeedback();
  }, []);

  return null;
}

// مكون لتحسين العرض
export function DisplayOptimizer() {
  useEffect(() => {
    // تحسين العرض للنصوص العربية
    const optimizeArabicText = () => {
      document.body.style.direction = 'rtl';
      document.body.style.textAlign = 'right';
      document.body.style.fontFamily = "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    };

    // تحسين التباين
    const optimizeContrast = () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 768px) {
          .text-gray-600 { color: #4b5563 !important; }
          .text-gray-500 { color: #6b7280 !important; }
          .dark .text-gray-400 { color: #d1d5db !important; }
        }
      `;
      document.head.appendChild(style);
    };

    optimizeArabicText();
    optimizeContrast();
  }, []);

  return null;
} 