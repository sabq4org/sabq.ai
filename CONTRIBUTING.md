# 🤝 دليل المساهمة في Sabq AI CMS

نرحب بمساهماتكم في تطوير **Sabq AI CMS**! هذا الدليل يوضح كيفية المساهمة بفعالية في المشروع.

---

## 🎯 طرق المساهمة

### 1. تقرير المشاكل (Issues)
- 🐛 **الأخطاء**: تقرير الأخطاء والمشاكل التقنية
- 💡 **الاقتراحات**: اقتراح ميزات جديدة أو تحسينات
- 📚 **التوثيق**: تحسين أو إضافة وثائق
- 🔒 **الأمان**: تقرير مشاكل الأمان

### 2. تطوير الكود
- 🔧 **إصلاح الأخطاء**: حل المشاكل الموجودة
- ✨ **إضافة ميزات**: تطوير ميزات جديدة
- 🚀 **تحسين الأداء**: تحسين سرعة وكفاءة النظام
- 🧪 **الاختبارات**: كتابة وتحسين الاختبارات

### 3. التوثيق
- 📖 **أدلة المستخدم**: تحسين الأدلة والشروحات
- 🔧 **التوثيق التقني**: توثيق APIs والكود
- 🌐 **الترجمة**: ترجمة المحتوى للغات أخرى
- 📝 **أمثلة عملية**: إضافة أمثلة وحالات استخدام

---

## 🚀 البدء السريع

### 1. إعداد البيئة التطويرية

```bash
# 1. استنساخ المستودع
git clone https://github.com/sabq-ai/sabq-ai-cms.git
cd sabq-ai-cms

# 2. تثبيت المتطلبات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env.local
# قم بتحديث القيم في .env.local

# 4. إعداد قاعدة البيانات
npx prisma generate
npx prisma db push

# 5. تشغيل النظام
npm run dev
```

### 2. إعداد خدمات الذكاء الاصطناعي

```bash
# تشغيل خدمات ML
cd ml-services
pip install -r requirements.txt
docker-compose up -d
```

### 3. تشغيل الاختبارات

```bash
# اختبارات الوحدة
npm run test

# اختبارات التكامل
npm run test:integration

# اختبارات E2E
npm run test:e2e
```

---

## 📋 معايير الكود

### 1. معايير JavaScript/TypeScript
```typescript
// ✅ جيد
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('المستخدم غير موجود');
    return user;
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    throw error;
  }
};

// ❌ سيء
const getUser = (id) => {
  return prisma.user.findUnique({ where: { id } });
};
```

### 2. معايير تسمية الملفات
```
✅ أسماء جيدة:
- UserProfile.tsx
- api/auth/login.ts
- lib/utils/dateFormatter.ts
- types/user.types.ts

❌ أسماء سيئة:
- user.tsx
- api.ts
- utils.ts
- types.ts
```

### 3. معايير CSS/Styling
```css
/* ✅ جيد - استخدام Tailwind CSS */
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white">العنوان</h2>
</div>

/* ❌ سيء - CSS مخصص غير ضروري */
<div style={{display: 'flex', padding: '16px'}}>
```

---

## 🔄 سير العمل (Workflow)

### 1. Fork والاستنساخ
```bash
# 1. عمل Fork للمستودع على GitHub
# 2. استنساخ Fork الخاص بك
git clone https://github.com/YOUR-USERNAME/sabq-ai-cms.git
cd sabq-ai-cms

# 3. إضافة المستودع الأصلي كـ remote
git remote add upstream https://github.com/sabq-ai/sabq-ai-cms.git
```

### 2. إنشاء فرع جديد
```bash
# إنشاء فرع للميزة أو الإصلاح
git checkout -b feature/new-feature-name
# أو
git checkout -b fix/bug-description
```

### 3. تطوير الكود
```bash
# التأكد من تحديث الفرع
git fetch upstream
git rebase upstream/main

# إجراء التغييرات
# ...

# إضافة وحفظ التغييرات
git add .
git commit -m "feat: إضافة ميزة جديدة للتحليلات"
```

### 4. Push وإنشاء Pull Request
```bash
# دفع التغييرات للفرع
git push origin feature/new-feature-name

# إنشاء Pull Request على GitHub
```

---

## 📝 معايير Commit Messages

نتبع التنسيق التالي لرسائل الـ Commit:

```
نوع(النطاق): وصف مختصر

وصف مفصل اختياري

المراجع: #123
```

### أنواع Commit المدعومة:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تحديث التوثيق
- `style`: تحسينات التصميم
- `refactor`: إعادة هيكلة الكود
- `test`: إضافة أو تحديث اختبارات
- `chore`: مهام صيانة
- `perf`: تحسين الأداء
- `security`: تحسينات الأمان

### أمثلة:
```bash
feat(auth): إضافة المصادقة الثنائية
fix(api): إصلاح خطأ في استعلام المقالات
docs(readme): تحديث دليل التثبيت
style(ui): تحسين تصميم الأزرار
test(integration): إضافة اختبارات API الدفع
```

---

## 🧪 الاختبارات

### 1. اختبارات الوحدة
```typescript
// tests/utils.test.ts
import { formatDate } from '@/lib/utils/dateFormatter';

describe('formatDate', () => {
  it('يجب أن يعيد التاريخ بالتنسيق العربي', () => {
    const date = new Date('2024-12-20');
    const formatted = formatDate(date, 'ar-SA');
    expect(formatted).toBe('٢٠ ديسمبر ٢٠٢٤');
  });
});
```

### 2. اختبارات API
```typescript
// tests/api/auth.test.ts
import { POST } from '@/app/api/auth/login/route';

describe('/api/auth/login', () => {
  it('يجب أن يسمح بتسجيل الدخول بيانات صحيحة', async () => {
    const response = await POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    }));
    
    expect(response.status).toBe(200);
  });
});
```

---

## 📚 التوثيق

### 1. تعليقات الكود
```typescript
/**
 * يقوم بتشفير البيانات الحساسة
 * @param data البيانات المراد تشفيرها
 * @param key مفتاح التشفير
 * @returns البيانات المشفرة
 */
export function encryptData(data: string, key: string): string {
  // تنفيذ التشفير
}
```

### 2. توثيق API
```typescript
/**
 * POST /api/articles
 * 
 * إنشاء مقال جديد
 * 
 * @body {
 *   title: string,
 *   content: string,
 *   categoryId: string,
 *   tags: string[]
 * }
 * 
 * @returns {
 *   success: boolean,
 *   data: Article
 * }
 */
```

---

## 🔒 الأمان

### 1. مبادئ الأمان
- لا تضع أبداً مفاتيح API أو كلمات مرور في الكود
- استخدم متغيرات البيئة للبيانات الحساسة
- تحقق من المدخلات دائماً
- استخدم HTTPS في جميع الاتصالات

### 2. تقرير مشاكل الأمان
```
Subject: [SECURITY] وصف المشكلة
To: security@sabq.ai

وصف المشكلة:
- نوع الثغرة
- خطوات إعادة الإنتاج
- التأثير المحتمل
- الحل المقترح (اختياري)
```

---

## 🎨 معايير واجهة المستخدم

### 1. التصميم المتجاوب
```tsx
// ✅ جيد
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {articles.map(article => (
    <ArticleCard key={article.id} article={article} />
  ))}
</div>

// ❌ سيء
<div style={{display: 'flex', flexWrap: 'wrap'}}>
```

### 2. دعم العربية والـ RTL
```tsx
// ✅ جيد
<div className="text-right rtl:text-left" dir="rtl">
  <h1 className="text-2xl font-bold">العنوان الرئيسي</h1>
</div>
```

### 3. إمكانية الوصول
```tsx
// ✅ جيد
<button
  className="btn btn-primary"
  aria-label="حفظ المقال"
  disabled={isLoading}
>
  {isLoading ? 'جاري الحفظ...' : 'حفظ'}
</button>
```

---

## 📋 قائمة مراجعة Pull Request

قبل إرسال Pull Request، تأكد من:

### الكود
- [ ] الكود يتبع معايير المشروع
- [ ] جميع الاختبارات تمر بنجاح
- [ ] لا توجد تحذيرات ESLint
- [ ] الكود موثق بشكل مناسب

### الوظائف
- [ ] الميزة تعمل كما هو متوقع
- [ ] تم اختبار الميزة في بيئات مختلفة
- [ ] لا تؤثر على الميزات الموجودة
- [ ] تتبع معايير UX/UI

### التوثيق
- [ ] تم تحديث التوثيق إذا لزم الأمر
- [ ] تم إضافة أمثلة استخدام
- [ ] تم تحديث CHANGELOG.md
- [ ] تم إضافة اختبارات للكود الجديد

---

## 🏆 المساهمون المميزون

نشكر جميع المساهمين في تطوير Sabq AI CMS:

- **المطور الرئيسي**: فريق Sabq AI
- **المساهمون**: [قائمة المساهمين](https://github.com/sabq-ai/sabq-ai-cms/graphs/contributors)

---

## 📞 الحصول على المساعدة

### قنوات التواصل
- **GitHub Issues**: للمشاكل والاقتراحات
- **البريد الإلكتروني**: dev@sabq.ai
- **Discord**: [رابط الخادم](https://discord.gg/sabq-ai)

### الموارد المفيدة
- [التوثيق الرسمي](./docs/)
- [أمثلة الاستخدام](./examples/)
- [الأسئلة الشائعة](./docs/FAQ.md)

---

شكراً لك على اهتمامك بالمساهمة في **Sabq AI CMS**! 🙏

**المطور:** فريق Sabq AI  
**آخر تحديث:** ديسمبر 2024 