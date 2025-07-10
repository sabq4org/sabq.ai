import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sabq AI CMS - نظام إدارة المحتوى الذكي',
  description: 'نظام إدارة محتوى ذكي لصحيفة سبق الإلكترونية مع دعم الذكاء الاصطناعي',
  keywords: 'سبق, أخبار, ذكاء اصطناعي, نظام إدارة محتوى',
  authors: [{ name: 'Ali Alhazmi' }],
  creator: 'Ali Alhazmi',
  publisher: 'Sabq News',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
} 