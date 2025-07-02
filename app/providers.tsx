'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { DarkModeProvider } from '@/contexts/DarkModeContext'
import { migrateThemeSettings } from '@/lib/theme-migration'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // ترحيل إعدادات الثيم القديمة عند التحميل
  useEffect(() => {
    migrateThemeSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
} 