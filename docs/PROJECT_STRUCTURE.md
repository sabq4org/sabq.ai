# هيكل مشروع Sabq AI CMS

## نظرة عامة

هذا المستند يوضح الهيكل التفصيلي لمشروع **Sabq AI CMS** - نظام إدارة محتوى ذكي يدعم الذكاء الاصطناعي.

## البنية التقنية

```
sabq-ai-cms/
├── app/                        # Next.js App Router (الواجهة الأمامية)
├── components/                 # مكونات React قابلة لإعادة الاستخدام
├── lib/                        # مكتبات وأدوات مساعدة
├── api/                        # نقاط نهاية API (خدمات خلفية)
├── ml-services/                # خدمات الذكاء الاصطناعي (Python)
├── prisma/                     # مخطط قاعدة البيانات
├── docs/                       # ملفات التوثيق
├── tests/                      # اختبارات النظام
└── scripts/                    # سكربتات مساعدة
```

## تفاصيل المجلدات

### 📁 app/ (Next.js App Router)
```
app/
├── layout.tsx                  # تخطيط أساسي للتطبيق
├── page.tsx                    # الصفحة الرئيسية
├── globals.css                 # أنماط CSS عامة
├── dashboard/                  # صفحات لوحة التحكم
│   ├── layout.tsx             # تخطيط لوحة التحكم
│   ├── page.tsx               # صفحة لوحة التحكم الرئيسية
│   ├── articles/              # إدارة المقالات
│   ├── analytics/             # التحليلات والإحصائيات
│   ├── settings/              # إعدادات النظام
│   └── ai/                    # واجهة الذكاء الاصطناعي
└── api/                       # API Routes (Next.js)
    ├── auth/                  # المصادقة وتسجيل الدخول
    ├── articles/              # إدارة المقالات
    ├── analytics/             # تجميع البيانات
    └── ml/                    # واجهة خدمات الذكاء الاصطناعي
```

### 📁 components/ (مكونات React)
```
components/
├── ui/                        # مكونات واجهة المستخدم الأساسية
│   ├── Header.tsx            # رأس الصفحة
│   ├── Footer.tsx            # تذييل الصفحة
│   ├── Card.tsx              # مكون البطاقة
│   ├── Button.tsx            # مكون الزر
│   ├── Input.tsx             # مكون الإدخال
│   └── Modal.tsx             # مكون النافذة المنبثقة
├── navigation/                # مكونات التنقل
│   ├── Navbar.tsx            # شريط التنقل
│   ├── Sidebar.tsx           # الشريط الجانبي
│   └── Breadcrumb.tsx        # مسار التنقل
├── forms/                     # مكونات النماذج
│   ├── ArticleForm.tsx       # نموذج إنشاء/تحرير المقال
│   ├── LoginForm.tsx         # نموذج تسجيل الدخول
│   └── SettingsForm.tsx      # نموذج الإعدادات
└── analytics/                 # مكونات التحليلات
    ├── Chart.tsx             # مكون الرسوم البيانية
    ├── StatsCard.tsx         # بطاقة الإحصائيات
    └── Dashboard.tsx         # لوحة التحكم التحليلية
```

### 📁 lib/ (المكتبات والأدوات)
```
lib/
├── config.ts                  # إعدادات النظام الشاملة
├── security.ts                # أدوات الأمان والتشفير
├── auth.ts                    # أدوات المصادقة
├── database.ts                # اتصال قاعدة البيانات
├── analytics.ts               # أدوات التحليلات
├── utils.ts                   # دوال مساعدة عامة
├── api-client.ts              # عميل API
├── validation.ts              # تحقق من صحة البيانات
└── hooks/                     # React Hooks مخصصة
    ├── useAuth.ts            # hook المصادقة
    ├── useAnalytics.ts       # hook التحليلات
    └── useApi.ts             # hook استدعاء API
```

### 📁 api/ (خدمات API الخلفية)
```
api/
├── auth/                      # خدمات المصادقة
│   ├── login.ts              # تسجيل الدخول
│   ├── logout.ts             # تسجيل الخروج
│   └── register.ts           # إنشاء حساب جديد
├── articles/                  # إدارة المقالات
│   ├── create.ts             # إنشاء مقال جديد
│   ├── update.ts             # تحديث مقال
│   ├── delete.ts             # حذف مقال
│   └── list.ts               # قائمة المقالات
├── analytics/                 # خدمات التحليلات
│   ├── events.ts             # تتبع الأحداث
│   ├── reports.ts            # تقارير التحليلات
│   └── dashboard.ts          # بيانات لوحة التحكم
├── recommendations/           # نظام التوصيات
│   ├── content.ts            # توصيات المحتوى
│   └── personalized.ts       # توصيات شخصية
└── notifications/             # نظام الإشعارات
    ├── send.ts               # إرسال إشعار
    └── list.ts               # قائمة الإشعارات
```

### 📁 ml-services/ (خدمات الذكاء الاصطناعي)
```
ml-services/
├── app.py                     # التطبيق الرئيسي (FastAPI)
├── requirements.txt           # متطلبات Python
├── Dockerfile                 # إعداد Docker
├── docker-compose.yml         # تشغيل الخدمات
├── nlp/                       # معالجة اللغة الطبيعية
│   ├── nlp_service.py        # خدمة NLP أساسية
│   ├── text_api.py           # تحليل النصوص
│   ├── summarizer.py         # تلخيص النصوص
│   └── sentiment.py          # تحليل المشاعر
├── models/                    # نماذج الذكاء الاصطناعي
│   ├── arabic_bert/          # نموذج BERT العربي
│   └── performance_model/    # نموذج توقع الأداء
└── utils/                     # أدوات مساعدة
    ├── preprocessing.py      # معالجة البيانات
    └── evaluation.py         # تقييم النماذج
```

### 📁 prisma/ (قاعدة البيانات)
```
prisma/
├── schema.prisma              # مخطط قاعدة البيانات
├── seed.ts                    # بيانات تجريبية
└── migrations/                # ملفات التهجير
    └── [timestamp]_init/      # تهجير أولي
```

### 📁 docs/ (التوثيق)
```
docs/
├── PROJECT_STRUCTURE.md       # هيكل المشروع (هذا الملف)
├── API_DOCUMENTATION.md       # توثيق APIs
├── DATABASE_SCHEMA.md         # مخطط قاعدة البيانات
├── DEPLOYMENT_GUIDE.md        # دليل النشر
├── DEVELOPMENT_SETUP.md       # إعداد بيئة التطوير
├── SECURITY_GUIDELINES.md     # إرشادات الأمان
├── AI_SERVICES_GUIDE.md       # دليل خدمات الذكاء الاصطناعي
└── CHANGELOG.md               # سجل التغييرات
```

### 📁 tests/ (الاختبارات)
```
tests/
├── setup.ts                   # إعداد بيئة الاختبارات
├── unit/                      # اختبارات الوحدة
│   ├── lib/                  # اختبار المكتبات
│   ├── components/           # اختبار المكونات
│   └── utils/                # اختبار الأدوات
├── integration/               # اختبارات التكامل
│   ├── api/                  # اختبار APIs
│   └── database/             # اختبار قاعدة البيانات
└── e2e/                      # اختبارات من البداية للنهاية
    ├── auth.test.ts          # اختبار المصادقة
    └── articles.test.ts      # اختبار إدارة المقالات
```

## التقنيات المستخدمة

### الواجهة الأمامية
- **Next.js 15** مع App Router
- **TypeScript** للكتابة الآمنة
- **Tailwind CSS** للتصميم
- **React** للمكونات التفاعلية

### الواجهة الخلفية
- **Next.js API Routes** أو **Node.js/Express**
- **Prisma ORM** لقاعدة البيانات
- **PostgreSQL** كقاعدة بيانات رئيسية
- **Redis** للتخزين المؤقت

### الذكاء الاصطناعي
- **Python** مع **FastAPI**
- **Transformers** لنماذج اللغة
- **PyTorch** للتعلم الآلي
- **NLTK/spaCy** لمعالجة النصوص

### البنية التحتية
- **Docker** للحاويات
- **GitHub Actions** للنشر المستمر
- **Vercel/AWS** للاستضافة
- **Cloudinary** لإدارة الصور

## تدفق البيانات

```
المستخدم → Next.js Frontend → API Routes → Prisma → PostgreSQL
                            ↓
                     Python ML Services → AI Models
                            ↓
                     Redis Cache ← Analytics Data
```

## الأمان والخصوصية

1. **التشفير**: جميع كلمات المرور مشفرة بـ bcrypt
2. **JWT**: استخدام JSON Web Tokens للمصادقة
3. **HTTPS**: تشفير جميع الاتصالات
4. **تحقق من الصحة**: فحص جميع المدخلات
5. **معدل التحديد**: منع الهجمات DDoS

## إرشادات التطوير

### 1. إضافة ميزة جديدة
```bash
# إنشاء فرع جديد
git checkout -b feature/new-feature

# تطوير الميزة
# - إضافة المكونات في components/
# - إضافة APIs في api/
# - إضافة الاختبارات في tests/
# - تحديث التوثيق

# اختبار الميزة
npm test
npm run build

# رفع التغييرات
git commit -m "Add: new feature description"
git push origin feature/new-feature
```

### 2. إعداد بيئة التطوير
```bash
# تثبيت المتطلبات
npm install

# إعداد قاعدة البيانات
npx prisma migrate dev

# تشغيل خدمات ML
cd ml-services && python -m uvicorn app:app --reload

# تشغيل التطبيق
npm run dev
```

### 3. معايير الكود
- استخدام **TypeScript** لجميع الملفات
- اتباع **ESLint** و **Prettier** للتنسيق
- كتابة **اختبارات** لجميع الميزات الجديدة
- **توثيق** جميع functions والمكونات

## الصيانة والمراقبة

1. **السجلات**: مراقبة جميع العمليات
2. **الأداء**: قياس سرعة الاستجابة
3. **الأخطاء**: تتبع وإصلاح الأخطاء
4. **النسخ الاحتياطي**: نسخ احتياطية يومية لقاعدة البيانات
5. **التحديثات**: تحديث المكتبات والأمان دورياً

---

**آخر تحديث**: ديسمبر 2024
**المطور**: علي الحازمي
**الإصدار**: 1.0.0 