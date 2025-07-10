# دليل التكاملات - سبق الذكية CMS

## 🔗 نظرة عامة

مشروع **سبق الذكية CMS** يدعم تكاملات متقدمة مع العديد من الخدمات الخارجية لتوفير تجربة شاملة ومتطورة. هذا الدليل يوضح كيفية إعداد وإدارة جميع التكاملات المدعومة.

## 📦 التكاملات المدعومة

### 🗄️ تخزين البيانات
- **Supabase** - قاعدة البيانات والتخزين الرئيسية
- **Redis** - التخزين المؤقت والجلسات

### 🌐 شبكة توصيل المحتوى (CDN)
- **Cloudinary** - إدارة الوسائط والتحويلات
- **AWS CloudFront** - توزيع المحتوى العالمي

### 🤖 الذكاء الاصطناعي
- **OpenAI** - توليد وتحليل المحتوى
- **Anthropic Claude** - مراجعة وتصنيف المحتوى

### 📧 الاتصالات
- **SMTP** - البريد الإلكتروني
- **Twilio** - الرسائل النصية
- **Firebase** - الإشعارات الفورية

### 📊 التحليلات
- **Google Analytics** - تحليل زوار الموقع
- **Facebook Pixel** - تتبع التحويلات

### 💳 المدفوعات
- **Stripe** - معالجة المدفوعات والاشتراكات

### 🔍 البحث
- **Algolia** - محرك بحث متقدم

## 🚀 الإعداد السريع

### 1. التحقق من البيئة
```bash
# تشغيل التحقق من متغيرات البيئة
npm run validate:env

# تشغيل إعداد التكاملات
npm run setup:integrations
```

### 2. إعداد التكاملات الأساسية
```bash
# إعداد Supabase و Cloudinary فقط
npm run setup:integrations --filter=Supabase,Cloudinary

# إعداد جميع التكاملات (وضع التجربة)
npm run setup:integrations --dry-run
```

## 🔧 التكاملات بالتفصيل

### 📊 Supabase - قاعدة البيانات الرئيسية

#### الإعداد:
```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### الميزات المدعومة:
- إدارة قاعدة البيانات
- المصادقة والتخويل
- تخزين الملفات
- الوقت الفعلي (Realtime)
- Edge Functions

#### أمثلة الاستخدام:
```typescript
import { supabaseClient } from '@/lib/integrations/supabase';

// جلب المقالات
const { data: articles } = await supabaseClient
  .from('articles')
  .select('*')
  .eq('status', 'published');

// رفع ملف
const { data, error } = await supabaseClient.storage
  .from('uploads')
  .upload('articles/image.jpg', file);
```

### 🖼️ Cloudinary - إدارة الوسائط

#### الإعداد:
```env
CLOUDINARY_CLOUD_NAME="sabq-ai"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_PRESET="sabq-ai-uploads"
```

#### الميزات المدعومة:
- رفع الصور والفيديو
- تحويل وضغط الوسائط
- توليد الصور المصغرة
- التحسين التلقائي
- CDN عالمي

#### أمثلة الاستخدام:
```typescript
import { cloudinaryClient } from '@/lib/integrations/cloudinary';

// رفع صورة مع تحويل
const result = await cloudinaryClient.uploader.upload(imageFile, {
  folder: 'articles',
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', format: 'auto' }
  ]
});

// توليد رابط محسن
const optimizedUrl = cloudinaryClient.url('image-id', {
  transformation: [
    { width: 300, height: 200, crop: 'fill' },
    { quality: 'auto', format: 'webp' }
  ]
});
```

### 🤖 OpenAI - الذكاء الاصطناعي

#### الإعداد:
```env
OPENAI_API_KEY="sk-your-api-key"
```

#### الميزات المدعومة:
- توليد المحتوى
- تلخيص المقالات
- الترجمة التلقائية
- تصنيف المحتوى
- إنشاء العناوين

#### أمثلة الاستخدام:
```typescript
import { openaiClient } from '@/lib/integrations/openai';

// توليد محتوى
const completion = await openaiClient.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "user",
      content: "اكتب مقال عن التقنية الحديثة"
    }
  ],
  max_tokens: 1000
});

// تلخيص مقال
const summary = await openaiClient.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "user", 
      content: `لخص هذا المقال: ${articleContent}`
    }
  ],
  max_tokens: 200
});
```

### 🧠 Anthropic Claude - مراجعة المحتوى

#### الإعداد:
```env
ANTHROPIC_API_KEY="sk-ant-your-api-key"
```

#### الميزات المدعومة:
- مراجعة المحتوى
- فحص الحقائق
- تصنيف المواضيع
- تحليل المشاعر
- الإشراف على التعليقات

#### أمثلة الاستخدام:
```typescript
import { anthropicClient } from '@/lib/integrations/anthropic';

// مراجعة محتوى
const analysis = await anthropicClient.messages.create({
  model: "claude-3-sonnet-20240229",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: "راجع هذا المحتوى وتأكد من دقة المعلومات"
    }
  ]
});

// فحص التعليقات
const moderation = await anthropicClient.messages.create({
  model: "claude-3-sonnet-20240229",
  max_tokens: 100,
  messages: [
    {
      role: "user",
      content: `هل هذا التعليق مناسب؟ "${comment}"`
    }
  ]
});
```

### 📧 SMTP - البريد الإلكتروني

#### الإعداد:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="سبق الذكية <noreply@sabq.ai>"
```

#### الميزات المدعومة:
- إرسال رسائل الترحيب
- إشعارات المقالات الجديدة
- رسائل إعادة تعيين كلمة المرور
- النشرات الإخبارية
- إشعارات التعليقات

#### أمثلة الاستخدام:
```typescript
import { emailService } from '@/lib/integrations/email';

// إرسال رسالة ترحيب
await emailService.sendWelcomeEmail({
  to: user.email,
  name: user.name,
  lang: 'ar'
});

// إرسال إشعار مقال جديد
await emailService.sendArticleNotification({
  to: subscribers,
  article: {
    title: 'مقال جديد',
    summary: 'ملخص المقال',
    url: '/articles/new-article'
  }
});
```

### 💬 Twilio - الرسائل النصية

#### الإعداد:
```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

#### الميزات المدعومة:
- التحقق من رقم الهاتف
- إشعارات عاجلة
- تذكيرات
- رموز التحقق الثنائي

#### أمثلة الاستخدام:
```typescript
import { twilioService } from '@/lib/integrations/twilio';

// إرسال رمز تحقق
await twilioService.sendVerificationCode({
  to: user.phone,
  code: generateVerificationCode()
});

// إرسال إشعار عاجل
await twilioService.sendBreakingNews({
  to: subscribedPhones,
  message: 'خبر عاجل: تطور مهم في القضية'
});
```

### 🔔 Firebase - الإشعارات الفورية

#### الإعداد:
```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

#### الميزات المدعومة:
- إشعارات المتصفح
- إشعارات الهاتف المحمول
- إشعارات مجدولة
- إشعارات مخصصة حسب الاهتمامات

#### أمثلة الاستخدام:
```typescript
import { firebaseService } from '@/lib/integrations/firebase';

// إرسال إشعار فوري
await firebaseService.sendNotification({
  title: 'مقال جديد',
  body: 'تم نشر مقال جديد في قسم التقنية',
  data: {
    articleId: 'article-123',
    category: 'technology'
  },
  target: userTokens
});

// إرسال إشعار مجدول
await firebaseService.scheduleNotification({
  title: 'تذكير يومي',
  body: 'اطلع على آخر الأخبار',
  scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
});
```

### 📈 Google Analytics - التحليلات

#### الإعداد:
```env
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

#### الميزات المدعومة:
- تتبع الزوار
- تحليل السلوك
- إحصائيات المحتوى
- تقارير التحويلات
- البيانات الديموغرافية

#### أمثلة الاستخدام:
```typescript
import { analyticsService } from '@/lib/integrations/analytics';

// تتبع مشاهدة صفحة
analyticsService.trackPageView({
  page: '/articles/new-article',
  title: 'مقال جديد',
  category: 'content'
});

// تتبع حدث مخصص
analyticsService.trackEvent({
  action: 'article_share',
  category: 'engagement',
  label: 'social_media',
  value: 1
});
```

### 💰 Stripe - المدفوعات

#### الإعداد:
```env
STRIPE_PUBLISHABLE_KEY="pk_test_your-key"
STRIPE_SECRET_KEY="sk_test_your-key"
STRIPE_WEBHOOK_SECRET="whsec_your-secret"
```

#### الميزات المدعومة:
- اشتراكات شهرية/سنوية
- دفعات لمرة واحدة
- إدارة الفواتير
- استرداد الأموال
- تقارير المبيعات

#### أمثلة الاستخدام:
```typescript
import { stripeService } from '@/lib/integrations/stripe';

// إنشاء اشتراك
const subscription = await stripeService.createSubscription({
  customerId: customer.id,
  priceId: 'price_premium_monthly',
  metadata: {
    userId: user.id,
    plan: 'premium'
  }
});

// معالجة دفعة
const paymentIntent = await stripeService.createPaymentIntent({
  amount: 2000, // 20 ريال
  currency: 'sar',
  metadata: {
    orderId: 'order_123'
  }
});
```

### 🔍 Algolia - البحث المتقدم

#### الإعداد:
```env
ALGOLIA_APP_ID="your-app-id"
ALGOLIA_API_KEY="your-api-key"
ALGOLIA_INDEX_NAME="sabq_ai_articles"
```

#### الميزات المدعومة:
- البحث السريع والدقيق
- الفلترة المتقدمة
- الترتيب الذكي
- البحث الصوتي
- اقتراحات البحث

#### أمثلة الاستخدام:
```typescript
import { algoliaService } from '@/lib/integrations/algolia';

// فهرسة مقال جديد
await algoliaService.indexArticle({
  objectID: article.id,
  title: article.title,
  content: article.content,
  category: article.section.name,
  tags: article.tags.map(t => t.name),
  publishedAt: article.publishedAt
});

// البحث في المقالات
const results = await algoliaService.search({
  query: 'التقنية الحديثة',
  filters: 'category:تقنية',
  hitsPerPage: 10
});
```

## 🔄 إدارة التكاملات

### إضافة تكامل جديد

#### 1. إنشاء موفر الخدمة:
```typescript
// lib/integrations/providers/new-service.ts
export class NewServiceProvider {
  constructor(private config: NewServiceConfig) {}
  
  async testConnection(): Promise<boolean> {
    // اختبار الاتصال
  }
  
  async performAction(data: any): Promise<any> {
    // تنفيذ العملية
  }
}
```

#### 2. تسجيل التكامل:
```typescript
// lib/integrations/index.ts
import { NewServiceProvider } from './providers/new-service';

export const integrations = {
  // ... تكاملات موجودة
  newService: new NewServiceProvider({
    apiKey: process.env.NEW_SERVICE_API_KEY,
    endpoint: process.env.NEW_SERVICE_ENDPOINT
  })
};
```

#### 3. إضافة واجهة API:
```typescript
// app/api/integrations/new-service/route.ts
export async function POST(request: Request) {
  const data = await request.json();
  const result = await integrations.newService.performAction(data);
  return Response.json(result);
}
```

### اختبار التكاملات

#### اختبار شامل:
```bash
# اختبار جميع التكاملات
npm run test:integrations

# اختبار تكامل محدد
npm run test:integrations --service=openai

# اختبار الأداء
npm run test:integrations --performance
```

#### اختبار يدوي:
```typescript
import { testIntegration } from '@/lib/integrations/testing';

// اختبار Supabase
const supabaseTest = await testIntegration('supabase', {
  operations: ['connect', 'query', 'upload']
});

// اختبار OpenAI
const openaiTest = await testIntegration('openai', {
  model: 'gpt-4',
  maxTokens: 100
});
```

## 📊 مراقبة التكاملات

### لوحة المراقبة
```typescript
// الحصول على حالة جميع التكاملات
const status = await getIntegrationsStatus();

// مراقبة الأداء
const metrics = await getIntegrationsMetrics({
  timeRange: '24h',
  services: ['openai', 'cloudinary', 'supabase']
});
```

### التنبيهات التلقائية
```typescript
// إعداد تنبيه عند فشل تكامل
await setupIntegrationAlert({
  service: 'openai',
  condition: 'error_rate > 5%',
  notification: {
    email: 'admin@sabq.ai',
    webhook: 'https://sabq.ai/alerts'
  }
});
```

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### مشكلة اتصال Supabase:
```bash
# فحص الرابط
curl -X GET "https://your-project.supabase.co/rest/v1/"

# التحقق من المفاتيح
echo $SUPABASE_ANON_KEY | wc -c  # يجب أن يكون أكثر من 100 حرف
```

#### مشكلة رفع ملفات Cloudinary:
```bash
# اختبار الاتصال
curl -X POST "https://api.cloudinary.com/v1_1/your-cloud/image/upload" \
  -F "file=@test.jpg" \
  -F "upload_preset=your-preset"
```

#### مشكلة OpenAI API:
```bash
# فحص حد الاستخدام
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models"
```

### أدوات التشخيص
```bash
# فحص شامل للتكاملات
npm run diagnose:integrations

# تقرير صحة النظام
npm run health:check

# فحص أداء التكاملات
npm run performance:check
```

## 📚 مراجع وروابط مفيدة

### الوثائق الرسمية
- [Supabase Docs](https://supabase.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Twilio Docs](https://www.twilio.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Algolia Docs](https://www.algolia.com/doc)

### أدوات مفيدة
- [Postman Collections](./postman/) - مجموعات اختبار API
- [Integration Tests](../tests/integrations/) - اختبارات التكاملات
- [Monitoring Scripts](../scripts/monitoring/) - نصوص المراقبة

### نصائح للأداء
- استخدم التخزين المؤقت للبيانات المتكررة
- تنفيذ آلية إعادة المحاولة للطلبات الفاشلة
- مراقبة حدود الاستخدام لكل خدمة
- تنفيذ التحقق من الحالة الدوري
- تسجيل جميع العمليات للمراجعة

---

> **ملاحظة**: تأكد من تحديث مفاتيح API وإعدادات الأمان بانتظام لضمان الأمان والاستقرار. 