# 🤖 Sabq AI CMS - نظام إدارة المحتوى الذكي

<div align="center">

![Sabq AI CMS](https://img.shields.io/badge/Sabq-AI%20CMS-blue?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

**نظام إدارة محتوى ذكي مدعوم بالذكاء الاصطناعي لصحيفة سبق الإلكترونية**

[📖 التوثيق](./docs/) | [🚀 البدء السريع](#البدء-السريع) | [🔧 التطوير](#التطوير) | [📊 الميزات](#الميزات)

</div>

## 🌟 نظرة عامة

**Sabq AI CMS** هو نظام إدارة محتوى متطور مصمم خصيصاً للمحتوى العربي، يجمع بين قوة **Next.js 15** والذكاء الاصطناعي لتوفير تجربة فريدة في إنشاء وإدارة ونشر المحتوى الرقمي.

## ✨ الميزات الرئيسية

### 🤖 الذكاء الاصطناعي
- **تلخيص المقالات** تلقائياً باللغة العربية
- **تحليل المشاعر** واستخراج الكلمات المفتاحية
- **توقع أداء المقالات** باستخدام التعلم الآلي
- **اقتراح العلامات** والتصنيفات الذكية
- **تحليل سهولة القراءة** للنصوص العربية

### 📊 التحليلات المتقدمة
- **لوحة تحكم تفاعلية** مع إحصائيات شاملة
- **تتبع سلوك المستخدمين** في الوقت الفعلي
- **تقارير الأداء** والمشاركات
- **توصيات المحتوى** الشخصية

### 🔐 الأمان والخصوصية
- **تشفير قوي** للبيانات الحساسة
- **مصادقة متعددة العوامل** (JWT + Session)
- **إدارة الأذونات** المرنة
- **حماية من CSRF** و XSS

### 🎨 واجهة مستخدم حديثة
- **تصميم متجاوب** يدعم جميع الشاشات
- **دعم كامل للعربية** (RTL)
- **سمات قابلة للتخصيص**
- **تفاعل سلس** مع animations

## 🏗️ البنية التقنية

```mermaid
graph TB
    A[المستخدم] --> B[Next.js Frontend]
    B --> C[API Routes]
    C --> D[Prisma ORM]
    D --> E[PostgreSQL]
    C --> F[Python ML Services]
    F --> G[FastAPI]
    G --> H[AI Models]
    C --> I[Redis Cache]
    J[Cloudinary] --> B
```

### التقنيات المستخدمة

**الواجهة الأمامية:**
- **Next.js 15** مع App Router
- **TypeScript** للأمان في الكتابة
- **Tailwind CSS** للتصميم
- **React** للمكونات التفاعلية

**الواجهة الخلفية:**
- **Next.js API Routes**
- **Prisma ORM** مع PostgreSQL
- **Redis** للتخزين المؤقت
- **JWT** للمصادقة

**الذكاء الاصطناعي:**
- **Python** مع **FastAPI**
- **Transformers** لمعالجة اللغة
- **NLTK** للنصوص العربية
- **Docker** للحاويات

## 🚀 البدء السريع

### المتطلبات الأساسية

- **Node.js** 18.0+ 
- **Python** 3.11+
- **PostgreSQL** 14+
- **Redis** 6.0+
- **Docker** (اختياري)

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/sabq4org/sabq.ai.git
cd sabq.ai

# تثبيت المتطلبات
npm install

# إعداد متغيرات البيئة
cp .env.example .env.local
# تحديث المتغيرات حسب بيئتك

# إعداد قاعدة البيانات
npx prisma migrate dev
npx prisma db seed

# تشغيل خدمات ML (في terminal منفصل)
cd ml-services
pip install -r requirements.txt
python app.py

# تشغيل التطبيق
npm run dev
```

### استخدام Docker

```bash
# تشغيل جميع الخدمات
cd ml-services
docker-compose up -d

# تشغيل التطبيق الرئيسي
npm run dev
```

## 🔧 التطوير

### هيكل المشروع

```
sabq-ai/
├── app/                    # صفحات Next.js
├── components/             # مكونات React
├── lib/                    # مكتبات مساعدة
├── ml-services/            # خدمات الذكاء الاصطناعي
├── prisma/                 # مخطط قاعدة البيانات
├── docs/                   # ملفات التوثيق
└── tests/                  # اختبارات النظام
```

### أوامر مفيدة

```bash
# التطوير
npm run dev              # تشغيل البيئة التطويرية
npm run build           # بناء المشروع للإنتاج
npm run start           # تشغيل الإنتاج

# قاعدة البيانات
npx prisma studio       # واجهة إدارة قاعدة البيانات
npx prisma generate     # توليد Prisma Client
npx prisma migrate dev  # تشغيل التهجيرات

# الاختبارات
npm run test            # تشغيل الاختبارات
npm run test:watch      # تشغيل الاختبارات مع المراقبة
npm run test:coverage   # تقرير التغطية

# الجودة
npm run lint            # فحص الكود
npm run type-check      # فحص TypeScript
npm run format          # تنسيق الكود
```

### خدمات ML

```bash
cd ml-services

# التطوير
python app.py           # تشغيل خدمات ML
uvicorn app:app --reload # تشغيل مع إعادة التحميل

# Docker
docker build -t sabq-ml .
docker run -p 8000:8000 sabq-ml
```

## 📋 متغيرات البيئة

إنشاء ملف `.env.local` وإضافة المتغيرات التالية:

```env
# قاعدة البيانات
DATABASE_URL="postgresql://user:pass@localhost:5432/sabq_ai"

# المصادقة
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# خدمات خارجية
OPENAI_API_KEY="your-openai-key"
CLOUDINARY_URL="your-cloudinary-url"

# خدمات ML
ML_SERVICE_URL="http://localhost:8000"
REDIS_URL="redis://localhost:6379"

# تطوير
NODE_ENV="development"
```

## 🧪 الاختبارات

```bash
# تشغيل جميع الاختبارات
npm run test

# اختبارات محددة
npm run test:unit           # اختبارات الوحدة
npm run test:integration    # اختبارات التكامل
npm run test:e2e           # اختبارات شاملة

# تغطية الكود
npm run test:coverage
```

## 📚 التوثيق

- [📖 دليل المطور](./docs/DEVELOPMENT_SETUP.md)
- [🏗️ هيكل المشروع](./docs/PROJECT_STRUCTURE.md)
- [🔌 توثيق APIs](./docs/API_DOCUMENTATION.md)
- [🗄️ مخطط قاعدة البيانات](./docs/DATABASE_SCHEMA.md)
- [🤖 دليل خدمات AI](./docs/AI_SERVICES_GUIDE.md)
- [🔐 إرشادات الأمان](./docs/SECURITY_GUIDELINES.md)

## 🚀 النشر

### Vercel (مُوصى به)

```bash
# رفع للمستودع وربط بـ Vercel
git push origin main

# أو استخدام Vercel CLI
npm i -g vercel
vercel --prod
```

### Docker

```bash
# بناء الصورة
docker build -t sabq-ai .

# تشغيل الحاوية
docker run -p 3000:3000 sabq-ai
```

## 🤝 المساهمة

نرحب بجميع المساهمات! اقرأ [دليل المساهمة](./CONTRIBUTING.md) للبدء.

### خطوات المساهمة

1. **Fork** المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. تطوير الميزة وإضافة الاختبارات
4. **Commit** التغييرات (`git commit -m 'Add amazing feature'`)
5. **Push** للفرع (`git push origin feature/amazing-feature`)
6. فتح **Pull Request**

## 📝 الترخيص

هذا المشروع مرخص تحت [MIT License](./LICENSE) - راجع الملف للتفاصيل.

## 👥 الفريق

- **علي الحازمي** - *المطور الرئيسي* - [@alialhazmi](https://github.com/alialhazmi)

## 🙏 الشكر والتقدير

- [Next.js](https://nextjs.org/) للإطار الممتاز
- [OpenAI](https://openai.com/) لنماذج الذكاء الاصطناعي
- [Tailwind CSS](https://tailwindcss.com/) للتصميم الجميل
- [Prisma](https://prisma.io/) لإدارة قاعدة البيانات

## 📞 التواصل

- **البريد الإلكتروني**: support@sabq-ai.com
- **الموقع**: [sabq-ai.com](https://sabq-ai.com)
- **GitHub Issues**: [تقارير الأخطاء والاقتراحات](https://github.com/sabq4org/sabq.ai/issues)

---

<div align="center">

**صُنع بـ ❤️ للمحتوى العربي**

⭐ إذا أعجبك المشروع، لا تنس إعطاءه نجمة!

</div>
