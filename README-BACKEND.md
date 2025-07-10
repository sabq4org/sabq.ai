# 🚀 Sabq AI CMS - الواجهة الخلفية

نظام إدارة المحتوى الذكي لموقع سبق - الواجهة الخلفية المطورة بـ Node.js وTypeScript

## 📋 جدول المحتويات

- [المميزات](#المميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [متطلبات التشغيل](#متطلبات-التشغيل)
- [التثبيت والإعداد](#التثبيت-والإعداد)
- [تشغيل النظام](#تشغيل-النظام)
- [واجهات برمجة التطبيقات](#واجهات-برمجة-التطبيقات)
- [قاعدة البيانات](#قاعدة-البيانات)
- [الاختبارات](#الاختبارات)
- [النشر](#النشر)

## 🌟 المميزات

### 🔐 نظام المصادقة والتصريح
- تسجيل دخول آمن بـ JWT
- إدارة الأدوار والصلاحيات
- تشفير كلمات المرور
- حماية من هجمات CSRF و XSS

### 📚 إدارة المحتوى
- إدارة المقالات (إنشاء، تعديل، حذف، نشر)
- نظام التصنيفات والعلامات
- رفع وإدارة الوسائط
- نظام التعليقات والتفاعل

### 📊 التحليلات والإحصائيات
- تتبع سلوك المستخدمين
- إحصائيات مفصلة للمحتوى
- تقارير الأداء
- تحليلات الوقت الفعلي

### 🤖 الذكاء الاصطناعي
- نظام التوصيات الذكية
- تحليل المشاعر
- استخراج الكلمات المفتاحية
- تصنيف المحتوى التلقائي

### 🔧 مميزات تقنية
- API RESTful شامل
- تحديد معدل الطلبات
- تسجيل العمليات والأخطاء
- تخزين مؤقت ذكي
- دعم الوقت الفعلي

## 🛠 التقنيات المستخدمة

### Backend Framework
- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل ويب سريع
- **TypeScript** - JavaScript مع الأنواع الثابتة

### قاعدة البيانات
- **PostgreSQL** - قاعدة بيانات علائقية قوية
- **Prisma ORM** - أداة إدارة قواعد البيانات الحديثة
- **Redis** - تخزين مؤقت سريع

### المصادقة والأمان
- **JWT** - رموز الوصول الآمنة
- **bcryptjs** - تشفير كلمات المرور
- **Helmet.js** - حماية أمنية للعناوين
- **CORS** - مشاركة الموارد الآمنة

### الذكاء الاصطناعي
- **Python/FastAPI** - خدمة الذكاء الاصطناعي
- **scikit-learn** - خوارزميات التعلم الآلي
- **NumPy & Pandas** - معالجة البيانات

### أدوات التطوير
- **Jest** - اختبار الوحدات
- **ESLint** - فحص جودة الكود
- **Prettier** - تنسيق الكود
- **Nodemon** - تشغيل تطويري

## 📋 متطلبات التشغيل

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 13.0
- **Redis** >= 6.0 (اختياري)
- **Python** >= 3.8 (لخدمة الذكاء الاصطناعي)

## ⚙️ التثبيت والإعداد

### 1. استنساخ المشروع
```bash
git clone https://github.com/sabq4org/sabq-ai-cms.git
cd sabq-ai-cms
```

### 2. تثبيت التبعيات
```bash
# تثبيت تبعيات الواجهة الخلفية
cd api
npm install

# تثبيت تبعيات خدمة الذكاء الاصطناعي
cd ../ml-services
pip install -r requirements.txt
```

### 3. إعداد المتغيرات البيئية
```bash
# نسخ ملف المتغيرات البيئية
cp .env.example .env

# تحرير المتغيرات البيئية
nano .env
```

### متغيرات البيئة المطلوبة:
```env
# قاعدة البيانات
DATABASE_URL="postgresql://username:password@localhost:5432/sabq_cms"

# مفاتيح JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Redis (اختياري)
REDIS_URL="redis://localhost:6379"

# Cloudinary (للوسائط)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# خدمة الذكاء الاصطناعي
ML_SERVICE_URL="http://localhost:8000"

# البريد الإلكتروني
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. إعداد قاعدة البيانات
```bash
# تشغيل عمليات الهجرة
npx prisma migrate dev

# إنشاء البيانات الأولية
npx prisma db seed
```

## 🚀 تشغيل النظام

### تشغيل الواجهة الخلفية
```bash
cd api

# التطوير
npm run dev

# الإنتاج
npm run build
npm start
```

### تشغيل خدمة الذكاء الاصطناعي
```bash
cd ml-services

# تشغيل محلي
python -m uvicorn nlp.app:app --reload --host 0.0.0.0 --port 8000

# أو باستخدام السكريبت
./start-ml.sh
```

### تشغيل الاختبارات
```bash
# اختبار الوحدات
npm test

# اختبار مع التغطية
npm run test:coverage

# اختبار مراقب
npm run test:watch
```

## 📡 واجهات برمجة التطبيقات

### المصادقة والمستخدمين
```
POST   /api/auth/register        # تسجيل حساب جديد
POST   /api/auth/login           # تسجيل الدخول
POST   /api/auth/logout          # تسجيل الخروج
POST   /api/auth/refresh         # تجديد الرمز المميز
GET    /api/auth/me              # معلومات المستخدم الحالي
POST   /api/auth/change-password # تغيير كلمة المرور
POST   /api/auth/reset-password  # إعادة تعيين كلمة المرور
```

### إدارة المقالات
```
GET    /api/articles             # جلب جميع المقالات
POST   /api/articles             # إنشاء مقال جديد
GET    /api/articles/:id         # جلب مقال واحد
PUT    /api/articles/:id         # تحديث مقال
DELETE /api/articles/:id         # حذف مقال
PATCH  /api/articles/:id/publish # نشر/إلغاء نشر مقال
POST   /api/articles/:id/like    # إضافة/إزالة إعجاب
```

### التحليلات
```
POST   /api/analytics/events     # تسجيل حدث تحليلي
GET    /api/analytics/dashboard  # لوحة التحليلات
GET    /api/analytics/reports    # تقارير مفصلة
GET    /api/analytics/real-time  # إحصائيات الوقت الفعلي
GET    /api/analytics/export     # تصدير البيانات
```

### التوصيات الذكية
```
GET    /api/recommendations/:userId  # توصيات للمستخدم
POST   /api/recommendations/train    # تدريب النموذج
POST   /api/recommendations/:id/feedback  # تقييم التوصية
```

### صحة النظام
```
GET    /api/health               # فحص صحة الخادم
GET    /api/info                 # معلومات النظام
```

## 🗄 قاعدة البيانات

### الجداول الأساسية
- **users** - المستخدمون
- **roles** - الأدوار
- **user_roles** - أدوار المستخدمين
- **articles** - المقالات
- **categories** - التصنيفات
- **tags** - العلامات
- **comments** - التعليقات
- **analytics_events** - الأحداث التحليلية
- **recommendations** - التوصيات

### العمليات
```bash
# إنشاء هجرة جديدة
npx prisma migrate dev --name migration_name

# إعادة تعيين قاعدة البيانات
npx prisma migrate reset

# تحديث العميل
npx prisma generate

# فتح واجهة إدارة قاعدة البيانات
npx prisma studio
```

## 🧪 الاختبارات

### أنواع الاختبارات
- **اختبارات الوحدة** - فحص الدوال المفردة
- **اختبارات التكامل** - فحص تفاعل المكونات
- **اختبارات API** - فحص نقاط النهاية

### تشغيل الاختبارات
```bash
# جميع الاختبارات
npm test

# اختبار ملف واحد
npm test articles.test.ts

# اختبار مع التغطية
npm run test:coverage

# اختبار مراقب (يعيد التشغيل عند التغيير)
npm run test:watch
```

### كتابة اختبارات جديدة
```typescript
// tests/api/example.test.ts
describe("Example API", () => {
  it("should work correctly", async () => {
    const response = await request(app)
      .get("/api/example")
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

## 🚢 النشر

### Docker
```bash
# بناء الصورة
docker build -t sabq-backend .

# تشغيل الحاوية
docker run -p 4000:4000 sabq-backend

# مع Docker Compose
docker-compose up -d
```

### خادم الإنتاج
```bash
# بناء المشروع
npm run build

# تشغيل الإنتاج
npm start

# مع PM2
pm2 start dist/index.js --name sabq-backend
pm2 startup
pm2 save
```

## 📈 المراقبة والصيانة

### تسجيل الأخطاء
- **Winston** - تسجيل شامل
- **Morgan** - تسجيل طلبات HTTP
- دعم مستويات التسجيل المختلفة

### مراقبة الأداء
- **Redis** - تخزين مؤقت
- **Rate Limiting** - تحديد معدل الطلبات
- **Compression** - ضغط الاستجابات

### الصيانة الدورية
```bash
# تنظيف الجلسات المنتهية
npm run cleanup:sessions

# أرشفة البيانات القديمة
npm run archive:old-data

# تحسين قاعدة البيانات
npm run optimize:database
```

## 🔧 التطوير

### إضافة مسار جديد
```typescript
// api/routes/example.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, async (req, res) => {
  res.json({ message: "مسار جديد" });
});

export default router;
```

### إضافة middleware جديد
```typescript
// api/middleware/example.ts
import { Request, Response, NextFunction } from "express";

export function exampleMiddleware(req: Request, res: Response, next: NextFunction) {
  // منطق المعالجة
  next();
}
```

## 🤝 المساهمة

نرحب بمساهمات المطورين! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

- **البريد الإلكتروني**: support@sabq.ai
- **التوثيق**: https://docs.sabq.ai
- **Issues**: https://github.com/sabq4org/sabq-ai-cms/issues

## 🎯 خارطة الطريق

### الإصدار 2.2.0
- [ ] دعم التحقق بخطوتين
- [ ] نظام الإشعارات المتقدم
- [ ] تحسين خوارزميات الذكاء الاصطناعي
- [ ] دعم اللغات المتعددة

### الإصدار 2.3.0
- [ ] تطبيق محمول
- [ ] API GraphQL
- [ ] تحليلات متقدمة
- [ ] تكامل مع منصات التواصل الاجتماعي

---

<div dir="rtl">

**تم تطويره بـ ❤️ من قبل فريق سبق للذكاء الاصطناعي**

</div> 