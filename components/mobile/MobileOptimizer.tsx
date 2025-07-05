'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Battery, Signal } from 'lucide-react';

interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
}

export default function MobileOptimizer() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ online: true });
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    // تحديد معلومات الجهاز
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      setDeviceInfo({
        isMobile: screenWidth <= 768,
        isTablet: screenWidth > 768 && screenWidth <= 1024,
        isIOS: /iPad|iPhone|iPod/.test(userAgent),
        isAndroid: /Android/.test(userAgent),
        screenWidth,
        screenHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      });
    };

    // مراقبة حالة الشبكة
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      });
    };

    // مراقبة البطارية (إذا كانت متاحة)
    const updateBatteryStatus = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        }
      } catch (error) {
        console.log('Battery API not supported');
      }
    };

    detectDevice();
    updateNetworkStatus();
    updateBatteryStatus();

    // إضافة مستمعي الأحداث
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    window.addEventListener('resize', detectDevice);

    // إظهار المؤشر عند انقطاع الاتصال
    const handleOffline = () => setIsVisible(true);
    const handleOnline = () => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // تحسين الصور للأجهزة المحمولة
  useEffect(() => {
    if (!deviceInfo?.isMobile) return;

    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-loaded="false"], img:not([data-loaded])');
      
      images.forEach((img) => {
        const imageElement = img as HTMLImageElement;
        
        // إضافة lazy loading
        if (!imageElement.loading) {
          imageElement.loading = 'lazy';
        }
        
        // تحسين الجودة حسب الشبكة
        if (networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g') {
          // استخدام صور منخفضة الجودة للشبكات البطيئة
          const src = imageElement.src;
          if (src.includes('cloudinary.com')) {
            imageElement.src = src.replace(/q_auto/, 'q_30');
          }
        }
        
        // إضافة معالج التحميل
        imageElement.addEventListener('load', () => {
          imageElement.setAttribute('data-loaded', 'true');
        });
        
        imageElement.addEventListener('error', () => {
          imageElement.setAttribute('data-loaded', 'false');
          // استخدام صورة احتياطية
          imageElement.src = '/images/placeholder-article.jpg';
        });
      });
    };

    // تشغيل التحسين بعد تحميل الصفحة
    const timer = setTimeout(optimizeImages, 1000);
    
    // مراقبة الصور الجديدة
    const observer = new MutationObserver(optimizeImages);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [deviceInfo, networkStatus]);

  // تحسين التمرير للموبايل
  useEffect(() => {
    if (!deviceInfo?.isMobile) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // إخفاء عناصر غير مرئية لتحسين الأداء
          const elements = document.querySelectorAll('.animate-element');
          elements.forEach((element) => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
              element.classList.add('in-viewport');
            } else {
              element.classList.remove('in-viewport');
            }
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [deviceInfo]);

  // تحسين اللمس للأجهزة المحمولة
  useEffect(() => {
    if (!deviceInfo?.isMobile) return;

    // إضافة تأثيرات اللمس
    const addTouchEffects = () => {
      const touchElements = document.querySelectorAll('button, a, .tap-highlight');
      
      touchElements.forEach((element) => {
        element.addEventListener('touchstart', () => {
          element.classList.add('touch-active');
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
          setTimeout(() => {
            element.classList.remove('touch-active');
          }, 150);
        }, { passive: true });
      });
    };

    addTouchEffects();
    
    // منع الـ zoom عند النقر المزدوج
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

  }, [deviceInfo]);

  if (!deviceInfo?.isMobile || !isVisible) return null;

  return (
    <div className="network-indicator fixed top-16 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm ${
        networkStatus.online 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {networkStatus.online ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">متصل</span>
            {networkStatus.effectiveType && (
              <span className="text-xs opacity-90">
                {networkStatus.effectiveType.toUpperCase()}
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">غير متصل</span>
          </>
        )}
        
        {/* مؤشر البطارية */}
        {batteryLevel !== null && batteryLevel <= 20 && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/30">
            <Battery className="w-3 h-3" />
            <span className="text-xs">{batteryLevel}%</span>
          </div>
        )}
        
        {/* مؤشر قوة الإشارة */}
        {networkStatus.online && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/30">
            <Signal className="w-3 h-3" />
            {networkStatus.downlink && (
              <span className="text-xs">
                {networkStatus.downlink.toFixed(1)} Mbps
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// CSS إضافي للتأثيرات
const additionalStyles = `
  .touch-active {
    transform: scale(0.98) !important;
    opacity: 0.8 !important;
  }
  
  .in-viewport {
    will-change: transform, opacity;
  }
  
  .animate-element:not(.in-viewport) {
    will-change: auto;
  }
  
  @media (max-width: 768px) {
    .network-indicator {
      font-size: 14px;
    }
    
    .touch-active {
      transition: all 0.1s ease !important;
    }
  }
`;

// إضافة الأنماط إلى الصفحة
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = additionalStyles;
  document.head.appendChild(styleElement);
} 