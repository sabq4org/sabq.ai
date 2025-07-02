# 🎨 استخدام تصميم جُرعة في مشروع صحيفة سبق

## ✅ ما تم تطبيقه

### 1. **الملفات المضافة**
- `frontend/styles/jur3a-colors.css` - ملف الأنماط الأساسية
- `frontend/components/ui/AdvancedDataTable.tsx` - مكون جدول متقدم
- `frontend/components/ui/StatCard.tsx` - مكون بطاقة إحصائيات
- `frontend/components/ui/JuraButton.tsx` - مكون زر مخصص
- `frontend/public/example-jura-design.html` - صفحة مثال كاملة
- `docs/JURA_DESIGN_GUIDE.md` - دليل التصميم الشامل

### 2. **التعديلات على الملفات الموجودة**
- `frontend/app/globals.css` - إضافة استيراد أنماط جرعة والخط Tajawal
- `frontend/tailwind.config.js` - إضافة ألوان وإعدادات جرعة

## 🚀 كيفية الاستخدام

### استخدام الألوان في Tailwind
```jsx
// ألوان جرعة الأساسية
<div className="bg-jura-primary-500">خلفية زرقاء</div>
<div className="text-jura-secondary-600">نص سماوي</div>
<div className="border-jura-success">حدود خضراء</div>

// الظلال المخصصة
<div className="shadow-jura-md">ظل متوسط</div>
<div className="shadow-jura-colored">ظل ملون</div>

// الحركات
<div className="animate-float">عنصر متحرك</div>
<div className="animate-slide-up">حركة انزلاق</div>
```

### استخدام فئات CSS المخصصة
```jsx
// بطاقة إحصائيات
<div className="stat-card">
  <div className="stat-content">
    <div className="stat-info">
      <p>العنوان</p>
      <h3>1,234</h3>
    </div>
    <div className="stat-icon">
      <i className="icon"></i>
    </div>
  </div>
</div>

// أزرار جرعة
<button className="btn-primary">زر رئيسي</button>
<button className="btn-secondary">زر ثانوي</button>

// تأثير الزجاج
<div className="glass-effect">محتوى بتأثير زجاجي</div>

// تدرج النص
<h1 className="gradient-text">عنوان بتدرج لوني</h1>

// تدرج الخلفية
<div className="gradient-primary">خلفية بتدرج</div>
```

### استخدام الجداول
```jsx
// جدول بسيط
<div className="data-table-container">
  <table className="data-table">
    <thead>
      <tr>
        <th>العمود 1</th>
        <th>العمود 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>بيانات</td>
        <td>بيانات</td>
      </tr>
    </tbody>
  </table>
</div>

// شارات التصنيف
<span className="badge badge-primary">تقنية</span>
<span className="badge badge-success">رياضة</span>
<span className="badge badge-warning">اقتصاد</span>
```

## 📱 أمثلة في React/Next.js

### مثال بطاقة إحصائيات
```tsx
import { FileText } from 'lucide-react';

function StatsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="stat-card">
        <div className="stat-content">
          <div className="stat-info">
            <p className="text-sm text-gray-500">إجمالي الأخبار</p>
            <h3 className="text-3xl font-bold">15,234</h3>
          </div>
          <div 
            className="stat-icon"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #3b82f6dd)' }}
          >
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### مثال جدول بيانات
```tsx
function NewsTable() {
  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>العنوان</th>
            <th>التصنيف</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {news.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>
                <span className="badge badge-primary">
                  {item.category}
                </span>
              </td>
              <td>
                <span className={`badge badge-${item.status}`}>
                  {item.statusText}
                </span>
              </td>
              <td>
                <button className="btn-primary text-sm px-3 py-1">
                  عرض
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### مثال صفحة كاملة
```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="gradient-text text-2xl">
            لوحة التحكم - صحيفة سبق
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4">
        <StatsSection />
        <NewsTable />
      </main>
    </div>
  );
}
```

## 🎨 دالة ألوان التصنيفات

```javascript
// utils/categoryColors.js
export const getCategoryStyle = (category) => {
  const styles = {
    'تقنية': 'badge-primary',
    'رياضة': 'badge-success', 
    'اقتصاد': 'badge-warning',
    'ثقافة': 'badge-error',
    // أضف المزيد...
  };
  
  return styles[category] || 'badge';
};
```

## 🔗 روابط مفيدة

- **صفحة المثال**: افتح `/public/example-jura-design.html` في المتصفح
- **دليل التصميم الكامل**: اقرأ `/docs/JURA_DESIGN_GUIDE.md`
- **مرجع الألوان**: راجع متغيرات CSS في `/styles/jur3a-colors.css`

## 📝 ملاحظات

1. تأكد من أن الخط Tajawal محمل في جميع الصفحات
2. استخدم فئات Tailwind الجديدة مع البادئة `jura-` للألوان المخصصة
3. يمكن دمج الأنماط الجديدة مع الأنماط الموجودة بسلاسة
4. جميع الأنماط تدعم الوضع الليلي تلقائياً

## 🛠️ للتخصيص

يمكنك تعديل الألوان والأنماط من:
- `frontend/styles/jur3a-colors.css` - للأنماط الأساسية
- `frontend/tailwind.config.js` - لإعدادات Tailwind
- `frontend/app/globals.css` - للأنماط العامة 