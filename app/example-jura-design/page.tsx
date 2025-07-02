'use client';

import React from 'react';

export default function JuraDesignExample() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="gradient-text text-2xl">تصميم جُرعة - صحيفة سبق</h1>
            </div>
            <button className="btn-primary">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة جديد
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* بطاقات الإحصائيات */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-6">بطاقات الإحصائيات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* بطاقة 1 */}
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="text-sm text-gray-500">إجمالي الأخبار</p>
                  <h3 className="text-3xl font-bold mt-1">15,234</h3>
                </div>
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #3b82f6dd)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* بطاقة 2 */}
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="text-sm text-gray-500">المحررون النشطون</p>
                  <h3 className="text-3xl font-bold mt-1">48</h3>
                </div>
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #10b981dd)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* بطاقة 3 */}
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="text-sm text-gray-500">نسبة النشر</p>
                  <h3 className="text-3xl font-bold mt-1">87.5%</h3>
                </div>
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #f59e0bdd)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* بطاقة 4 */}
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="text-sm text-gray-500">تحليلات AI</p>
                  <h3 className="text-3xl font-bold mt-1">2,156</h3>
                </div>
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #8b5cf6dd)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* جدول البيانات */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">آخر الأخبار</h2>
            <button className="btn-secondary">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              فلترة
            </button>
          </div>
          
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>التصنيف</th>
                  <th>الحالة</th>
                  <th>الكاتب</th>
                  <th>التاريخ</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>رؤية 2030: تحول رقمي شامل في القطاع الحكومي</td>
                  <td><span className="badge badge-primary">تقنية</span></td>
                  <td><span className="badge badge-success">منشور</span></td>
                  <td>أحمد السعيد</td>
                  <td>15 يونيو 2025</td>
                  <td>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>
                      عرض
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>الأخضر السعودي يتأهل لكأس العالم 2026</td>
                  <td><span className="badge badge-success">رياضة</span></td>
                  <td><span className="badge badge-warning">مسودة</span></td>
                  <td>محمد العلي</td>
                  <td>14 يونيو 2025</td>
                  <td>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>
                      عرض
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>ارتفاع مؤشرات البورصة السعودية بنسبة 3.5%</td>
                  <td><span className="badge badge-warning">اقتصاد</span></td>
                  <td><span className="badge badge-primary">قيد المراجعة</span></td>
                  <td>سارة الحربي</td>
                  <td>13 يونيو 2025</td>
                  <td>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>
                      عرض
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* أمثلة الأزرار */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-6">أنماط الأزرار</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">زر رئيسي</button>
            <button className="btn-secondary">زر ثانوي</button>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              زر نجاح
            </button>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              زر تحذير
            </button>
            <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              زر معطل
            </button>
          </div>
        </section>

        {/* بطاقات المحتوى */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-6">بطاقات المحتوى</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-effect p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-2">تأثير الزجاج</h3>
              <p className="text-gray-600 mb-4">
                بطاقة بتأثير Glass Morphism المميز مع خلفية شفافة وحواف ناعمة.
              </p>
              <div className="flex gap-2">
                <span className="badge badge-primary">جديد</span>
                <span className="badge badge-success">مميز</span>
              </div>
            </div>
            
            <div className="section-container">
              <h3 className="text-lg font-bold mb-2">حاوية القسم</h3>
              <p className="text-gray-600 mb-4">
                حاوية بتصميم أنيق مع تدرج خفيف وظلال ناعمة لعرض المحتوى.
              </p>
              <button className="btn-primary text-sm">اكتشف المزيد</button>
            </div>
            
            <div className="stat-card animate-float">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">بطاقة متحركة</h3>
                <p className="text-gray-600 mb-4">
                  بطاقة مع تأثير الطفو المستمر لجذب الانتباه.
                </p>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="أدخل نصاً هنا..."
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 