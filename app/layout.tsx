import { Metadata } from 'next'
import './globals.css'
import '@/styles/tiptap-editor.css'
import '@/styles/deep-analysis.css'
import '@/styles/fix-layout.css'
import '@/styles/dashboard-enhanced.css'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeScript } from './theme-script'

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sabq.org'),
  title: {
    default: 'صحيفة سبق الإلكترونية | أخبار السعودية والعالم',
    template: '%s | صحيفة سبق الإلكترونية'
  },
  description: 'صحيفة سبق الإلكترونية - أول صحيفة سعودية تأسست على الإنترنت. تغطية شاملة لأخبار السعودية والخليج والعالم، السياسة، الاقتصاد، الرياضة، التقنية، والمزيد.',
  keywords: 'أخبار السعودية، صحيفة سبق، أخبار عاجلة، الرياض، جدة، مكة، أخبار الخليج، أخبار العالم، اقتصاد، رياضة، تقنية، ثقافة، صحة',
  authors: [{ name: 'صحيفة سبق الإلكترونية' }],
  creator: 'صحيفة سبق الإلكترونية',
  publisher: 'صحيفة سبق الإلكترونية',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'صحيفة سبق الإلكترونية | أخبار السعودية والعالم',
    description: 'أول صحيفة سعودية تأسست على الإنترنت. تغطية شاملة لأخبار السعودية والخليج والعالم.',
    url: 'https://sabq.org',
    siteName: 'صحيفة سبق الإلكترونية',
    images: [
      {
        url: 'https://sabq.org/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'صحيفة سبق الإلكترونية'
      }
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'صحيفة سبق الإلكترونية',
    description: 'أول صحيفة سعودية تأسست على الإنترنت',
    site: '@sabqorg',
    creator: '@sabqorg',
    images: ['https://sabq.org/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      }
    ]
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://sabq.org',
    languages: {
      'ar-SA': 'https://sabq.org',
      'en-US': 'https://en.sabq.org',
    },
    types: {
      'application/rss+xml': 'https://sabq.org/rss.xml',
    },
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
    yahoo: 'yahoo-site-verification-code',
  },
  category: 'news',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="transition-colors duration-300" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={cn(
        ibmPlexSansArabic.variable,
        "font-sans antialiased min-h-screen w-full",
        "bg-white text-gray-900",
        "dark:bg-gray-900 dark:text-gray-100",
        "transition-all duration-300"
      )} suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
} 