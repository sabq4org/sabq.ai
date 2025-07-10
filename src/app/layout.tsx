import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import AuthProvider from "../../providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });
const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "سبق الذكية - نظام إدارة المحتوى",
  description: "نظام إدارة محتوى ذكي مدعوم بالذكاء الاصطناعي، مصمم خصيصاً للمواقع العربية والمؤسسات الإعلامية",
  keywords: ["سبق", "CMS", "إدارة المحتوى", "ذكاء اصطناعي", "العربية"],
  authors: [{ name: "فريق Sabq AI" }],
  openGraph: {
    title: "سبق الذكية - نظام إدارة المحتوى",
    description: "نظام إدارة محتوى ذكي مدعوم بالذكاء الاصطناعي",
    type: "website",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary_large_image",
    title: "سبق الذكية - نظام إدارة المحتوى",
    description: "نظام إدارة محتوى ذكي مدعوم بالذكاء الاصطناعي",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body className={`${cairo.className} antialiased bg-gray-50`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-600">
                  <p>&copy; 2024 سبق الذكية. جميع الحقوق محفوظة.</p>
                  <p className="text-sm mt-2">
                    صنع بـ ❤️ في المملكة العربية السعودية
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
