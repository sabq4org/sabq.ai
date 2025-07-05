'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  Mail, 
  FileText, 
  Archive,
  Send
} from 'lucide-react';

interface EmailSection {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const emailSections: EmailSection[] = [
  {
    href: '/dashboard/email/analytics',
    label: 'لوحة الإحصائيات',
    icon: BarChart3,
    description: 'نظرة عامة على الأداء'
  },
  {
    href: '/dashboard/email/subscribers',
    label: 'المشتركون',
    icon: Users,
    description: 'إدارة قائمة المشتركين'
  },
  {
    href: '/dashboard/email/compose',
    label: 'إنشاء رسالة',
    icon: Send,
    description: 'إرسال رسالة جديدة'
  },
  {
    href: '/dashboard/email/templates',
    label: 'القوالب',
    icon: FileText,
    description: 'قوالب الرسائل المحفوظة'
  },
  {
    href: '/dashboard/email/archive',
    label: 'الأرشيف',
    icon: Archive,
    description: 'الرسائل المرسلة سابقاً'
  }
];

export default function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* القائمة الفرعية */}
      <aside className="lg:w-64">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            القائمة البريدية
          </h2>
          
          <nav className="space-y-2">
            {emailSections.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;
              
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{section.label}</p>
                    {section.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* إحصائيات سريعة */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              إحصائيات سريعة
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">المشتركون النشطون</span>
                <span className="font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">رسائل هذا الشهر</span>
                <span className="font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">متوسط معدل الفتح</span>
                <span className="font-medium text-green-600 dark:text-green-400">0%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 