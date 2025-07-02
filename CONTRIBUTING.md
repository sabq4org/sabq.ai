# 🤝 دليل المساهمة - Contributing Guide

<div align="center">

[العربية](#العربية) | [English](#english)

</div>

---

<div dir="rtl">

## العربية

### 🎯 مرحباً بك في مجتمع سبق الذكية!

نشكرك على اهتمامك بالمساهمة في تطوير منصة سبق الذكية. كل مساهمة مهمة بالنسبة لنا!

### 📋 قبل البدء

1. **اقرأ التوثيق**: تأكد من قراءة [README.md](README.md) و [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
2. **تحقق من Issues**: تأكد من عدم وجود issue مشابه قبل إنشاء واحد جديد
3. **اتبع معايير الكود**: استخدم نفس أسلوب الكود الموجود

### 🚀 كيفية المساهمة

#### 1. Fork المشروع
```bash
# Fork من GitHub ثم clone
git clone https://github.com/YOUR_USERNAME/sabq-ai-cms.git
cd sabq-ai-cms
```

#### 2. إنشاء فرع جديد
```bash
git checkout -b feature/amazing-feature
# أو
git checkout -b fix/bug-fix
```

#### 3. قم بالتغييرات
- اتبع نظام الألوان والتصميم الموجود
- استخدم `rounded-2xl` أو `rounded-3xl` للزوايا
- أضف `transition-all duration-300` للانتقالات
- اكتب تعليقات بالعربية

#### 4. اختبر التغييرات
```bash
npm run dev
# تأكد من عمل كل شيء على http://localhost:3001
```

#### 5. Commit التغييرات
```bash
git add .
git commit -m "✨ إضافة: وصف مختصر للميزة الجديدة"
```

##### أنواع Commits:
- ✨ `:sparkles:` ميزة جديدة
- 🐛 `:bug:` إصلاح خطأ
- 📚 `:books:` توثيق
- 🎨 `:art:` تحسينات في UI/UX
- ⚡ `:zap:` تحسينات في الأداء
- 🔧 `:wrench:` تغييرات في الإعدادات

#### 6. Push و Pull Request
```bash
git push origin feature/amazing-feature
```

### 📝 معايير Pull Request

عنوان PR يجب أن يكون واضح:
- **جيد**: "✨ إضافة نظام التنبيهات في الوقت الفعلي"
- **سيء**: "تحديثات"

في وصف PR، اشرح:
1. ما الذي تم تغييره؟
2. لماذا تم التغيير؟
3. كيف تم اختباره؟
4. Screenshots إذا كان تغيير في UI

### 🎨 معايير الكود

#### TypeScript/React:
```typescript
// ✅ جيد - تعليق بالعربية
// مكون عرض بطاقة المقال
const ArticleCard: React.FC<ArticleProps> = ({ article }) => {
  // استخدم hooks في الأعلى
  const [isLiked, setIsLiked] = useState(false);
  
  return (
    <div className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      {/* محتوى البطاقة */}
    </div>
  );
};
```

#### Tailwind CSS:
```jsx
// ✅ استخدم التدرجات المعتمدة
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  {/* محتوى */}
</div>

// ✅ استخدم الزوايا المنحنية المعتمدة
<button className="rounded-2xl px-6 py-3">
  اضغط هنا
</button>
```

### 🐛 الإبلاغ عن الأخطاء

عند إنشاء Issue للإبلاغ عن خطأ، اذكر:
1. **وصف المشكلة**: شرح واضح ومختصر
2. **خطوات إعادة الإنتاج**: كيف يمكن إعادة إنتاج الخطأ
3. **السلوك المتوقع**: ما الذي يجب أن يحدث
4. **Screenshots**: إذا كان ممكناً
5. **البيئة**: المتصفح، نظام التشغيل، إلخ

### 💡 اقتراح مميزات جديدة

عند اقتراح ميزة جديدة:
1. **شرح الفكرة**: وصف واضح للميزة
2. **الفائدة**: كيف ستفيد المستخدمين
3. **أمثلة**: أمثلة على كيفية العمل
4. **تصميم مقترح**: إذا كان لديك تصور

### 📞 التواصل

- **Issues**: للأسئلة والنقاشات التقنية
- **Discussions**: للأفكار والنقاشات العامة
- **Email**: dev@sabq.ai (للأمور الخاصة)

</div>

---

## English

### 🎯 Welcome to Sabq AI CMS Community!

Thank you for your interest in contributing to Sabq AI CMS. Every contribution matters!

### 📋 Before You Start

1. **Read the docs**: Make sure to read [README.md](README.md) and [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
2. **Check Issues**: Ensure no similar issue exists before creating a new one
3. **Follow code standards**: Use the same coding style as the existing code

### 🚀 How to Contribute

#### 1. Fork the Project
```bash
# Fork on GitHub then clone
git clone https://github.com/YOUR_USERNAME/sabq-ai-cms.git
cd sabq-ai-cms
```

#### 2. Create a New Branch
```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-fix
```

#### 3. Make Your Changes
- Follow the existing color and design system
- Use `rounded-2xl` or `rounded-3xl` for corners
- Add `transition-all duration-300` for transitions
- Write comments in Arabic when appropriate

#### 4. Test Your Changes
```bash
npm run dev
# Make sure everything works at http://localhost:3001
```

#### 5. Commit Your Changes
```bash
git add .
git commit -m "✨ Add: Brief description of the new feature"
```

#### 6. Push and Create Pull Request
```bash
git push origin feature/amazing-feature
```

### 📝 Pull Request Guidelines

PR title should be clear:
- **Good**: "✨ Add real-time notifications system"
- **Bad**: "Updates"

### 🎨 Code Standards

Follow the TypeScript/React conventions and Tailwind CSS classes as shown in the existing code.

### 🐛 Bug Reports

When creating an Issue for a bug report, include:
1. **Problem description**
2. **Steps to reproduce**
3. **Expected behavior**
4. **Screenshots** (if applicable)
5. **Environment**: Browser, OS, etc.

### 💡 Feature Requests

When suggesting a new feature:
1. **Explain the idea**
2. **Benefits**: How it will benefit users
3. **Examples**: How it would work
4. **Proposed design** (if you have a vision)

---

<div align="center">

**شكراً لمساهمتك! Thank you for contributing! 🙏**

</div> 