'use client'

import { useEffect, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// مكون تحسين الأداء للموبايل
export function MobilePerformanceOptimizer({ children }: { children: React.ReactNode }) {
  const [connectionType, setConnectionType] = useState<string>('4g')
  const [saveData, setSaveData] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    // التحقق من نوع الاتصال
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || '4g')
      setSaveData(connection.saveData || false)

      // الاستماع للتغييرات
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || '4g')
        setSaveData(connection.saveData || false)
      }

      connection.addEventListener('change', handleConnectionChange)
      return () => {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  // تمرير معلومات الأداء للمكونات الفرعية
  return (
    <PerformanceContext.Provider value={{ connectionType, saveData, isMobile }}>
      {children}
    </PerformanceContext.Provider>
  )
}

// Context للأداء
import { createContext, useContext } from 'react'

interface PerformanceContextType {
  connectionType: string
  saveData: boolean
  isMobile: boolean
}

const PerformanceContext = createContext<PerformanceContextType>({
  connectionType: '4g',
  saveData: false,
  isMobile: false
})

export function usePerformance() {
  return useContext(PerformanceContext)
}

// مكون الصورة المحسنة للأداء
export function OptimizedImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  sizes = '100vw'
}: { 
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}) {
  const { connectionType, saveData, isMobile } = usePerformance()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')

  useEffect(() => {
    // تحديد جودة الصورة بناءً على سرعة الاتصال
    let quality = 90
    if (saveData) {
      quality = 30
    } else if (connectionType === 'slow-2g' || connectionType === '2g') {
      quality = 40
    } else if (connectionType === '3g') {
      quality = 60
    } else if (isMobile) {
      quality = 70
    }

    // تحديد حجم الصورة
    let width = 1920
    if (isMobile) {
      width = 640
    } else if (window.innerWidth < 1024) {
      width = 1024
    }

    // بناء URL محسن للصورة
    if (src.includes('cloudinary')) {
      const optimizedSrc = src.replace('/upload/', `/upload/q_${quality},w_${width},f_auto/`)
      setImageSrc(optimizedSrc)
    } else {
      setImageSrc(src)
    }
  }, [src, connectionType, saveData, isMobile])

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setImageLoaded(true)}
        sizes={sizes}
      />
    </div>
  )
}

// مكون التحميل التدريجي
export function ProgressiveContent({ 
  children, 
  skeleton,
  delay = 0 
}: { 
  children: React.ReactNode
  skeleton?: React.ReactNode
  delay?: number
}) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isLoaded && skeleton) {
    return <>{skeleton}</>
  }

  return <>{children}</>
}

// مكون مؤشر سرعة الاتصال
export function ConnectionIndicator() {
  const { connectionType, saveData } = usePerformance()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (connectionType === 'slow-2g' || connectionType === '2g' || saveData) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [connectionType, saveData])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50">
      <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">
          {saveData ? 'وضع توفير البيانات نشط' : 'اتصال بطيء - تم تقليل جودة الصور'}
        </span>
      </div>
    </div>
  )
}

// مكون تحميل البيانات عند الطلب
export function LazyLoadOnDemand({ 
  children, 
  placeholder,
  threshold = 0.1 
}: { 
  children: React.ReactNode
  placeholder: React.ReactNode
  threshold?: number
}) {
  const [isInView, setIsInView] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsInView(true)
          setHasLoaded(true)
        }
      },
      { threshold }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [hasLoaded, threshold])

  return (
    <div ref={elementRef}>
      {isInView ? children : placeholder}
    </div>
  )
}

// مكون Skeleton للتحميل
export function Skeleton({ 
  className = '', 
  variant = 'text' 
}: { 
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  )
}

// مكون قائمة المقالات مع skeleton
export function ArticleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex gap-4">
            <Skeleton variant="rectangular" className="w-24 h-24 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-3/4 h-4" />
              <div className="flex gap-4 mt-2">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-16 h-3" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 