'use client';

import React, { useState } from 'react';
import {
  SabqCard,
  SabqCardHeader,
  SabqCardContent,
  SabqCardFooter,
  SabqButton,
  SabqButtonGroup,
  SabqInput,
  SabqTextarea,
  SabqSelect,
  SabqBadge,
  SabqCategoryBadge,
  SabqAlert
} from '@/components/ui';

export default function ComponentsShowcase() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('option1');
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div className="min-h-screen bg-[hsl(var(--sabq-bg-primary))] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[hsl(var(--sabq-text-primary))] mb-8 text-center">
          🎨 مكونات UI لصحيفة سبق
        </h1>

        {/* قسم البطاقات */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">البطاقات</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SabqCard>
              <SabqCardHeader>
                <h3 className="text-lg font-semibold">بطاقة عادية</h3>
              </SabqCardHeader>
              <SabqCardContent>
                <p className="text-[hsl(var(--sabq-text-secondary))]">
                  هذه بطاقة عادية مع تأثير التحويم الافتراضي
                </p>
              </SabqCardContent>
              <SabqCardFooter>
                <SabqButton size="sm">إجراء</SabqButton>
              </SabqCardFooter>
            </SabqCard>

            <SabqCard statCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[hsl(var(--sabq-text-light))] text-sm">المقالات اليوم</p>
                  <p className="text-2xl font-bold text-[hsl(var(--sabq-text-primary))] mt-1">458</p>
                  <p className="text-sm text-[hsl(var(--sabq-success))] mt-2">+15% من الأمس</p>
                </div>
                <div className="p-3 bg-[hsl(var(--sabq-primary)/0.1)] rounded-lg">
                  <svg className="w-6 h-6 text-[hsl(var(--sabq-primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </SabqCard>

            <SabqCard glow hover={false}>
              <SabqCardContent className="py-6">
                <h3 className="text-lg font-semibold mb-2">بطاقة متوهجة</h3>
                <p className="text-[hsl(var(--sabq-text-secondary))]">
                  بطاقة مع تأثير التوهج الأزرق
                </p>
              </SabqCardContent>
            </SabqCard>
          </div>
        </section>

        {/* قسم الأزرار */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">الأزرار</h2>
          
          <div className="space-y-4">
            <SabqButtonGroup>
              <SabqButton variant="primary">زر أساسي</SabqButton>
              <SabqButton variant="secondary">زر ثانوي</SabqButton>
              <SabqButton variant="ghost">زر شفاف</SabqButton>
              <SabqButton variant="danger">زر خطر</SabqButton>
            </SabqButtonGroup>

            <SabqButtonGroup>
              <SabqButton size="sm">صغير</SabqButton>
              <SabqButton size="md">متوسط</SabqButton>
              <SabqButton size="lg">كبير</SabqButton>
            </SabqButtonGroup>

            <SabqButtonGroup>
              <SabqButton loading>جاري التحميل...</SabqButton>
              <SabqButton disabled>معطل</SabqButton>
              <SabqButton 
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                مع أيقونة
              </SabqButton>
            </SabqButtonGroup>
          </div>
        </section>

        {/* قسم الإدخالات */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">النماذج</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SabqInput
              label="البريد الإلكتروني"
              type="email"
              placeholder="example@sabq.org"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              hint="سنستخدم بريدك للتواصل معك"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <SabqInput
              label="كلمة المرور"
              type="password"
              placeholder="أدخل كلمة المرور"
              error="كلمة المرور يجب أن تكون 8 أحرف على الأقل"
            />

            <SabqSelect
              label="التصنيف"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              options={[
                { value: 'politics', label: 'سياسة' },
                { value: 'economy', label: 'اقتصاد' },
                { value: 'tech', label: 'تقنية' },
                { value: 'culture', label: 'ثقافة' }
              ]}
            />

            <SabqTextarea
              label="الوصف"
              placeholder="اكتب وصفاً مفصلاً..."
              rows={4}
              hint="200 حرف كحد أقصى"
            />
          </div>
        </section>

        {/* قسم الشارات */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">الشارات</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <SabqBadge>افتراضي</SabqBadge>
              <SabqBadge variant="success">نجاح</SabqBadge>
              <SabqBadge variant="warning">تحذير</SabqBadge>
              <SabqBadge variant="error">خطأ</SabqBadge>
              <SabqBadge variant="info">معلومة</SabqBadge>
            </div>

            <div className="flex flex-wrap gap-3">
              <SabqCategoryBadge category="politics" />
              <SabqCategoryBadge category="economy" />
              <SabqCategoryBadge category="tech" />
              <SabqCategoryBadge category="culture" />
              <SabqCategoryBadge category="sports" />
              <SabqCategoryBadge category="health" />
              <SabqCategoryBadge category="society" />
              <SabqCategoryBadge category="education" />
            </div>

            <div className="flex flex-wrap gap-3">
              <SabqCategoryBadge category="tech" size="sm" />
              <SabqCategoryBadge category="tech" size="md" />
              <SabqCategoryBadge category="tech" size="lg" />
            </div>
          </div>
        </section>

        {/* قسم التنبيهات */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">التنبيهات</h2>
          
          <div className="space-y-4">
            <SabqAlert variant="info" title="معلومة مهمة">
              هذا تنبيه معلوماتي يحتوي على معلومات مفيدة للمستخدم
            </SabqAlert>

            <SabqAlert variant="success" title="تمت العملية بنجاح">
              تم حفظ المقال بنجاح وسيتم نشره في الوقت المحدد
            </SabqAlert>

            <SabqAlert variant="warning" title="تحذير">
              يرجى مراجعة البيانات المدخلة قبل المتابعة
            </SabqAlert>

            {showAlert && (
              <SabqAlert 
                variant="error" 
                title="خطأ في النظام"
                closeable
                onClose={() => setShowAlert(false)}
              >
                حدث خطأ أثناء محاولة حفظ البيانات. يرجى المحاولة مرة أخرى
              </SabqAlert>
            )}
          </div>
        </section>

        {/* قسم الجدول */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">الجداول</h2>
          
          <div className="sabq-table">
            <table className="w-full">
              <thead className="sabq-table-header">
                <tr>
                  <th className="px-6 py-3 text-right">العنوان</th>
                  <th className="px-6 py-3 text-right">التصنيف</th>
                  <th className="px-6 py-3 text-right">الحالة</th>
                  <th className="px-6 py-3 text-right">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sabq-table-row">
                  <td className="px-6 py-4">مقال تجريبي عن التقنية</td>
                  <td className="px-6 py-4">
                    <SabqCategoryBadge category="tech" size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <SabqBadge variant="success" size="sm">منشور</SabqBadge>
                  </td>
                  <td className="px-6 py-4 text-[hsl(var(--sabq-text-light))]">قبل 5 دقائق</td>
                </tr>
                <tr className="sabq-table-row">
                  <td className="px-6 py-4">خبر عاجل في الاقتصاد</td>
                  <td className="px-6 py-4">
                    <SabqCategoryBadge category="economy" size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <SabqBadge variant="warning" size="sm">مسودة</SabqBadge>
                  </td>
                  <td className="px-6 py-4 text-[hsl(var(--sabq-text-light))]">قبل ساعة</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* تأثيرات خاصة */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[hsl(var(--sabq-text-primary))] mb-6">التأثيرات الخاصة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="sabq-card sabq-wave-bg p-6">
              <h3 className="text-lg font-semibold mb-2">خلفية موجية</h3>
              <p className="text-[hsl(var(--sabq-text-secondary))]">
                تأثير الموجة الزرقاء الخفيفة
              </p>
            </div>

            <div className="sabq-card sabq-shadow-blue p-6">
              <h3 className="text-lg font-semibold mb-2">ظل أزرق</h3>
              <p className="text-[hsl(var(--sabq-text-secondary))]">
                ظلال زرقاء خفيفة مخصصة
              </p>
            </div>

            <div className="sabq-card sabq-glow sabq-animate-pulse p-6">
              <h3 className="text-lg font-semibold mb-2">نبض متوهج</h3>
              <p className="text-[hsl(var(--sabq-text-secondary))]">
                تأثير النبض مع التوهج
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 