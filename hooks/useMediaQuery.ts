import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // تحديث الحالة الأولية
    setMatches(media.matches)

    // الاستماع للتغييرات
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // إضافة المستمع
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // دعم المتصفحات القديمة
      media.addListener(listener)
    }

    // التنظيف
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        // دعم المتصفحات القديمة
        media.removeListener(listener)
      }
    }
  }, [query])

  return matches
}

// استعلامات جاهزة شائعة الاستخدام
export const BREAKPOINTS = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)'
}

// hooks مخصصة للأحجام الشائعة
export function useIsMobile() {
  return useMediaQuery(BREAKPOINTS.mobile)
}

export function useIsTablet() {
  return useMediaQuery(BREAKPOINTS.tablet)
}

export function useIsDesktop() {
  return useMediaQuery(BREAKPOINTS.desktop)
} 