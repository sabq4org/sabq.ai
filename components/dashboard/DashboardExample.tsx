// مثال على لوحة التحكم بتصميم صحيفة سبق الأزرق
import React from 'react';

const DashboardExample = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--sabq-bg-primary))]">
      {/* الشريط العلوي */}
      <nav className="sabq-navbar h-16 flex items-center px-6">
        <div className="flex items-center gap-4">
          <img src="/logo-sabq.svg" alt="صحيفة سبق" className="h-10 w-auto" />
          <h1 className="text-xl font-bold">لوحة التحكم</h1>
        </div>
        
        <div className="mr-auto flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/avatar.jpg" alt="المستخدم" className="w-8 h-8 rounded-full" />
            <span className="text-sm">مرحباً، أحمد</span>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* الشريط الجانبي */}
        <aside className="sabq-sidebar w-64 min-h-[calc(100vh-4rem)] p-4">
          <ul className="space-y-2">
            <li>
              <a href="#" className="sabq-sidebar-item active flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                الرئيسية
              </a>
            </li>
            <li>
              <a href="#" className="sabq-sidebar-item flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                المقالات
              </a>
            </li>
            <li>
              <a href="#" className="sabq-sidebar-item flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                المحررون
              </a>
            </li>
            <li>
              <a href="#" className="sabq-sidebar-item flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                الإحصائيات
              </a>
            </li>
          </ul>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-6">
          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="sabq-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[hsl(var(--sabq-text-light))] text-sm">المقالات اليوم</p>
                  <p className="text-2xl font-bold text-[hsl(var(--sabq-text-primary))] mt-1">145</p>
                  <p className="text-sm text-[hsl(var(--sabq-success))] mt-2">+12% من الأمس</p>
                </div>
                <div className="p-3 bg-[hsl(var(--sabq-primary)/0.1)] rounded-lg">
                  <svg className="w-6 h-6 text-[hsl(var(--sabq-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="sabq-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[hsl(var(--sabq-text-light))] text-sm">الزوار النشطون</p>
                  <p className="text-2xl font-bold text-[hsl(var(--sabq-text-primary))] mt-1">3,456</p>
                  <p className="text-sm text-[hsl(var(--sabq-warning))] mt-2">-2% من الأمس</p>
                </div>
                <div className="p-3 bg-[hsl(var(--sabq-primary)/0.1)] rounded-lg">
                  <svg className="w-6 h-6 text-[hsl(var(--sabq-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="sabq-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[hsl(var(--sabq-text-light))] text-sm">التفاعلات</p>
                  <p className="text-2xl font-bold text-[hsl(var(--sabq-text-primary))] mt-1">892</p>
                  <p className="text-sm text-[hsl(var(--sabq-success))] mt-2">+23% من الأمس</p>
                </div>
                <div className="p-3 bg-[hsl(var(--sabq-primary)/0.1)] rounded-lg">
                  <svg className="w-6 h-6 text-[hsl(var(--sabq-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="sabq-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[hsl(var(--sabq-text-light))] text-sm">المشاهدات</p>
                  <p className="text-2xl font-bold text-[hsl(var(--sabq-text-primary))] mt-1">23.5K</p>
                  <p className="text-sm text-[hsl(var(--sabq-success))] mt-2">+18% من الأمس</p>
                </div>
                <div className="p-3 bg-[hsl(var(--sabq-primary)/0.1)] rounded-lg">
                  <svg className="w-6 h-6 text-[hsl(var(--sabq-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex gap-4 mb-8">
            <button className="sabq-btn-primary">
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              مقال جديد
            </button>
            <button className="sabq-btn-secondary">
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              تصفية
            </button>
          </div>

          {/* جدول المقالات */}
          <div className="sabq-table">
            <table className="w-full">
              <thead className="sabq-table-header">
                <tr>
                  <th className="px-6 py-3 text-right">العنوان</th>
                  <th className="px-6 py-3 text-right">التصنيف</th>
                  <th className="px-6 py-3 text-right">الكاتب</th>
                  <th className="px-6 py-3 text-right">الحالة</th>
                  <th className="px-6 py-3 text-right">التاريخ</th>
                  <th className="px-6 py-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sabq-table-row">
                  <td className="px-6 py-4">اجتماع قادة دول مجلس التعاون لمناقشة التحديات الإقليمية</td>
                  <td className="px-6 py-4">
                    <span className="sabq-category-politics sabq-category-badge">سياسة</span>
                  </td>
                  <td className="px-6 py-4">أحمد محمد</td>
                  <td className="px-6 py-4">
                    <span className="sabq-badge-success px-2 py-1 rounded-full text-xs">منشور</span>
                  </td>
                  <td className="px-6 py-4">قبل 5 دقائق</td>
                  <td className="px-6 py-4">
                    <button className="text-[hsl(var(--sabq-primary))] hover:underline">تحرير</button>
                  </td>
                </tr>
                
                <tr className="sabq-table-row">
                  <td className="px-6 py-4">إطلاق منصة جديدة للتجارة الإلكترونية في المملكة</td>
                  <td className="px-6 py-4">
                    <span className="sabq-category-tech sabq-category-badge">تقنية</span>
                  </td>
                  <td className="px-6 py-4">فاطمة عبدالله</td>
                  <td className="px-6 py-4">
                    <span className="sabq-badge-warning px-2 py-1 rounded-full text-xs">مسودة</span>
                  </td>
                  <td className="px-6 py-4">قبل 20 دقيقة</td>
                  <td className="px-6 py-4">
                    <button className="text-[hsl(var(--sabq-primary))] hover:underline">تحرير</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardExample; 