'use client';

import React from 'react';
import { AlHilalWorldCupBlock } from '@/components/smart-blocks/AlHilalWorldCupBlock';

export default function AlHilalBlockDemo() {
  const sampleArticles = [
    {
      id: '1',
      title: 'الهلال يحقق فوزاً تاريخياً على ريال مدريد في نصف النهائي',
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      publishedAt: new Date().toISOString(),
      views: 3420,
      isNew: true,
      category: 'الهلال'
    },
    {
      id: '2',
      title: 'نيمار يقود الهلال للتأهل إلى نهائي كأس العالم للأندية',
      imageUrl: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=800&q=80',
      publishedAt: new Date(Date.now() - 3600000).toISOString(), // قبل ساعة
      views: 2150,
      isNew: false,
      category: 'الهلال'
    },
    {
      id: '3',
      title: 'الهلال يستعد لمواجهة مانشستر سيتي في النهائي التاريخي',
      imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80',
      publishedAt: new Date(Date.now() - 7200000).toISOString(), // قبل ساعتين
      views: 1890,
      isNew: false,
      category: 'الهلال'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
          مكون بلوك الهلال في بطولة العالم - نماذج مختلفة
        </h1>

        {/* النموذج الافتراضي */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            1. النموذج الافتراضي (الأزرق الفاتح)
          </h2>
          <AlHilalWorldCupBlock articles={sampleArticles} />
        </div>

        {/* نموذج بألوان الهلال الرسمية */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            2. نموذج بألوان الهلال الرسمية
          </h2>
          <AlHilalWorldCupBlock 
            articles={sampleArticles}
            backgroundColor="#001f3f" // الأزرق الداكن
            primaryColor="#ffd700" // الذهبي
            textColor="#ffffff"
          />
        </div>

        {/* نموذج فاتح مع لون أزرق سماوي */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            3. نموذج فاتح (أزرق سماوي)
          </h2>
          <AlHilalWorldCupBlock 
            articles={[sampleArticles[1]]}
            backgroundColor="#e0f2fe" // أزرق سماوي فاتح جداً
            primaryColor="#0284c7" // أزرق سماوي
            textColor="#0c4a6e"
          />
        </div>

        {/* نموذج محايد */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            4. نموذج محايد (رمادي فاتح)
          </h2>
          <AlHilalWorldCupBlock 
            articles={[sampleArticles[2]]}
            backgroundColor="#f8fafc"
            primaryColor="#3b82f6"
            textColor="#1e293b"
          />
        </div>

        {/* نموذج بدون مقالات */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            5. نموذج بدون مقالات (يعرض المقال الافتراضي)
          </h2>
          <AlHilalWorldCupBlock />
        </div>

        {/* معلومات الاستخدام */}
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            كيفية الاستخدام:
          </h3>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="language-tsx">{`import { AlHilalWorldCupBlock } from '@/components/smart-blocks/AlHilalWorldCupBlock';

// استخدام أساسي
<AlHilalWorldCupBlock articles={articles} />

// مع تخصيص الألوان
<AlHilalWorldCupBlock 
  articles={articles}
  backgroundColor="#f0f7ff"
  primaryColor="#005eb8"
  textColor="#1a1a1a"
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
} 