import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ملفك الذكي',
  description: 'اكتشف شخصيتك القرائية وتابع إحصائياتك وإنجازاتك في صحيفة سبق الإلكترونية',
  openGraph: {
    title: 'ملفك الذكي | صحيفة سبق الإلكترونية',
    description: 'اكتشف شخصيتك القرائية وتابع إحصائياتك وإنجازاتك',
    type: 'profile',
  },
  twitter: {
    card: 'summary',
    title: 'ملفك الذكي | صحيفة سبق',
    description: 'اكتشف شخصيتك القرائية وتابع إحصائياتك وإنجازاتك',
  },
};

export default function SmartProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 