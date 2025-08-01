# 🙋‍♂️ الأسئلة الشائعة - Sabq AI CMS

## نظرة عامة

هذا الملف يحتوي على إجابات للأسئلة الأكثر شيوعاً حول **Sabq AI CMS**. إذا لم تجد إجابة لسؤالك، يرجى مراسلتنا على support@sabq.ai.

---

## 📋 الفهرس

1. [🎯 أسئلة عامة](#-أسئلة-عامة)
2. [🚀 التثبيت والإعداد](#-التثبيت-والإعداد)
3. [🔧 التكوين والاستخدام](#-التكوين-والاستخدام)
4. [🔗 التكاملات](#-التكاملات)
5. [🛡️ الأمان](#-الأمان)
6. [🤖 الذكاء الاصطناعي](#-الذكاء-الاصطناعي)
7. [🐛 حل المشاكل](#-حل-المشاكل)
8. [💳 الدفع والتسعير](#-الدفع-والتسعير)
9. [📚 التطوير والمساهمة](#-التطوير-والمساهمة)
10. [📞 الدعم الفني](#-الدعم-الفني)

---

## 🎯 أسئلة عامة

### ما هو Sabq AI CMS؟
**Sabq AI CMS** هو نظام إدارة محتوى ذكي مدعوم بالذكاء الاصطناعي، مصمم خصيصاً للمواقع العربية والمؤسسات الإعلامية. يوفر تكاملات شاملة مع أكثر من 25 خدمة خارجية.

### ما الذي يميز Sabq AI CMS عن أنظمة إدارة المحتوى الأخرى؟
- **دعم كامل للعربية** مع RTL
- **ذكاء اصطناعي متقدم** لتوليد وتحليل المحتوى
- **25+ تكامل** مع مزودي الخدمات الرائدين
- **أمان متقدم** مع تشفير AES-256
- **أداء عالي** محسّن للمواقع العربية

### هل النظام مجاني؟
نعم، النظام مفتوح المصدر ومرخص تحت رخصة MIT. يمكنك استخدامه مجاناً للأغراض التجارية والشخصية.

### هل يدعم النظام مواقع متعددة؟
نعم، يدعم النظام إدارة مواقع متعددة من لوحة تحكم واحدة مع إعدادات منفصلة لكل موقع.

---

## 🚀 التثبيت والإعداد

### ما هي متطلبات النظام؟
```
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0 (اختياري)
- Python >= 3.9 (لخدمات ML)
```

### كيف يمكنني تثبيت النظام؟
```bash
# 1. استنساخ المستودع
git clone https://github.com/sabq-ai/sabq-ai-cms.git
cd sabq-ai-cms

# 2. تثبيت التبعيات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env.local

# 4. إعداد قاعدة البيانات
npx prisma generate
npx prisma db push

# 5. تشغيل النظام
npm run dev
```

### أين يمكنني العثور على ملف .env.example؟
يوجد ملف `.env.example` في المجلد الجذر للمشروع. انسخه إلى `.env.local` وقم بتحديث القيم المطلوبة.

### هل يمكنني استخدام قاعدة بيانات أخرى غير PostgreSQL؟
حالياً، النظام محسّن للعمل مع PostgreSQL. يمكنك استخدام قواعد بيانات أخرى مدعومة من Prisma، لكن قد تحتاج لتعديل بعض الاستعلامات.

---

## 🔧 التكوين والاستخدام

### كيف يمكنني تغيير لغة النظام؟
النظام يدعم العربية والإنجليزية افتراضياً. يمكنك تغيير اللغة من إعدادات النظام أو عبر متغير البيئة:
```env
DEFAULT_LOCALE=ar
```

### كيف يمكنني إضافة مستخدمين جدد؟
يمكنك إضافة مستخدمين جدد عبر:
1. **لوحة التحكم**: `/admin/users`
2. **API**: `POST /api/auth/register`
3. **سطر الأوامر**: `npm run seed:users`

### كيف يمكنني تخصيص التصميم؟
يمكنك تخصيص التصميم عبر:
- **Tailwind CSS**: تعديل `tailwind.config.js`
- **CSS مخصص**: إضافة أنماط في `globals.css`
- **مكونات**: تعديل مكونات في `components/`

### هل يمكنني إضافة حقول مخصصة للمقالات؟
نعم، يمكنك إضافة حقول مخصصة عبر:
1. تعديل مخطط قاعدة البيانات في `prisma/schema.prisma`
2. إضافة الحقول في نماذج الإدخال
3. تحديث APIs المتعلقة

---

## 🔗 التكاملات

### ما هي التكاملات المدعومة؟
النظام يدعم أكثر من 25 تكامل في فئات مختلفة:
- **الدفع**: Stripe, Tap, PayPal
- **الإشعارات**: OneSignal, FCM
- **الشبكات الاجتماعية**: X, Facebook, LinkedIn
- **CDN**: Cloudflare, AWS CloudFront
- **التحليلات**: Google Analytics, Metabase

### كيف يمكنني إضافة تكامل جديد؟
1. إضافة إعدادات التكامل في `lib/integrations/providers.ts`
2. إنشاء API endpoint في `src/app/api/integrations/`
3. إضافة النموذج في قاعدة البيانات
4. تحديث واجهة إدارة التكاملات

### هل يمكنني تعطيل تكاملات معينة؟
نعم، يمكنك تعطيل أي تكامل من لوحة التحكم أو عبر متغيرات البيئة.

### كيف يمكنني اختبار التكاملات؟
```bash
# اختبار تكامل محدد
npm run test:integration -- --testNamePattern="Stripe"

# اختبار جميع التكاملات
npm run test:integrations
```

---

## 🛡️ الأمان

### كيف يتم حماية البيانات الحساسة؟
- **تشفير AES-256** لجميع البيانات الحساسة
- **تخزين آمن** لمفاتيح API
- **HTTPS إجباري** في الإنتاج
- **مراجعة دورية** للصلاحيات

### هل يدعم النظام المصادقة الثنائية؟
نعم، النظام يدعم المصادقة الثنائية عبر:
- **TOTP** (Google Authenticator, Authy)
- **SMS** (اختياري)
- **البريد الإلكتروني** (اختياري)

### كيف يمكنني تقرير مشكلة أمنية؟
يرجى إرسال تقرير مفصل إلى security@sabq.ai. لا تقم بإنشاء Issue عام للمشاكل الأمنية.

### هل يمكنني تدقيق الكود الأمني؟
نعم، يمكنك تشغيل الأدوات التالية:
```bash
npm run security:audit
npm run security:scan
```

---

## 🤖 الذكاء الاصطناعي

### ما هي خدمات الذكاء الاصطناعي المدعومة؟
- **OpenAI GPT-4**: توليد المحتوى
- **Anthropic Claude**: تحليل المحتوى
- **Google AI**: الترجمة والتحليل
- **خدمات مخصصة**: تحليل المشاعر والتصنيف

### كيف يمكنني إعداد خدمات الذكاء الاصطناعي؟
```bash
# إعداد متغيرات البيئة
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# تشغيل خدمات ML
cd ml-services
docker-compose up -d
```

### هل يمكنني إضافة نماذج ذكاء اصطناعي مخصصة؟
نعم، يمكنك إضافة نماذجك المخصصة في `ml-services/models/` وتكوين APIs المطلوبة.

### كيف يمكنني تحسين دقة التوصيات؟
- **جمع المزيد من البيانات** عن سلوك المستخدمين
- **تدريب النماذج** بانتظام
- **ضبط المعايير** في `ml-services/config/`

---

## 🐛 حل المشاكل

### لا يمكنني الوصول للنظام بعد التثبيت
تأكد من:
1. **تشغيل قاعدة البيانات**: PostgreSQL
2. **تحديث متغيرات البيئة**: `.env.local`
3. **تشغيل Migrations**: `npx prisma db push`
4. **التحقق من المنافذ**: 3000 غير مستخدم

### رسائل خطأ في تسجيل الدخول
```bash
# تحقق من إعدادات المصادقة
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# أعد تشغيل النظام
npm run dev
```

### مشاكل في تحميل الصور
تأكد من إعداد Cloudinary:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### بطء في تحميل الصفحات
1. **تفعيل Redis** للتخزين المؤقت
2. **تحسين قاعدة البيانات** بإضافة فهارس
3. **تحسين الصور** بضغط تلقائي

### خطأ في تشغيل خدمات الذكاء الاصطناعي
```bash
# تحقق من Python والتبعيات
python --version
pip install -r ml-services/requirements.txt

# تحقق من Docker
docker --version
docker-compose --version
```

---

## 💳 الدفع والتسعير

### هل النظام مجاني بالكامل؟
نعم، النظام مفتوح المصدر ومجاني بالكامل. التكاليف الوحيدة هي:
- **الاستضافة** (خادم، قاعدة بيانات)
- **خدمات خارجية** (Stripe, OpenAI, إلخ)

### كيف يمكنني إعداد مدفوعات Stripe؟
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### هل يدعم النظام الدفع المحلي في السعودية؟
نعم، يدعم النظام Tap Payment لطرق الدفع السعودية:
- **KNET** (الكويت)
- **Benefit** (البحرين)
- **SADAD** (السعودية)

### كيف يمكنني إعداد اشتراكات شهرية؟
```typescript
// إنشاء خطة اشتراك
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly' }],
  metadata: { userId: user.id }
});
```

---

## 📚 التطوير والمساهمة

### كيف يمكنني المساهمة في المشروع؟
1. **Fork المستودع** على GitHub
2. **إنشاء فرع جديد** للميزة أو الإصلاح
3. **إجراء التغييرات** مع اتباع معايير الكود
4. **إنشاء Pull Request** مع وصف مفصل

### ما هي معايير الكود المطلوبة؟
- **TypeScript** لجميع الملفات
- **ESLint** للتحقق من الجودة
- **Prettier** للتنسيق
- **Jest** للاختبارات
- **تعليقات باللغة العربية**

### كيف يمكنني كتابة اختبارات؟
```typescript
// اختبار وحدة
describe('User Service', () => {
  it('should create user successfully', async () => {
    const user = await createUser(userData);
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});

// اختبار API
describe('POST /api/users', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(userData);
    expect(response.status).toBe(201);
  });
});
```

### كيف يمكنني إضافة ميزة جديدة؟
1. **إنشاء Issue** لوصف الميزة
2. **تصميم API** المطلوب
3. **تنفيذ الكود** مع الاختبارات
4. **تحديث التوثيق**
5. **إرسال Pull Request**

---

## 📞 الدعم الفني

### كيف يمكنني الحصول على دعم؟
- **GitHub Issues**: للمشاكل التقنية
- **Discord**: للمناقشة السريعة
- **البريد الإلكتروني**: support@sabq.ai
- **الوثائق**: [docs.sabq.ai](https://docs.sabq.ai)

### ما هي ساعات الدعم؟
- **الدعم العادي**: الأحد - الخميس، 9:00 - 18:00 AST
- **الدعم الطارئ**: 24/7 للحالات الحرجة
- **Discord**: متاح 24/7 للمجتمع

### كيف يمكنني الإبلاغ عن خطأ؟
```markdown
**وصف الخطأ**
وصف واضح ومختصر للمشكلة

**خطوات إعادة الإنتاج**
1. اذهب إلى '...'
2. انقر على '...'
3. اكتب '...'
4. ظهر الخطأ

**السلوك المتوقع**
ما الذي كان من المفترض أن يحدث

**السلوك الفعلي**
ما الذي حدث بالفعل

**بيئة التشغيل**
- OS: [مثال: Windows 10]
- Browser: [مثال: Chrome 91]
- Version: [مثال: v2.1.0]
```

### هل يوجد دعم بالعربية؟
نعم، فريق الدعم يتحدث العربية والإنجليزية. يمكنك التواصل بأي لغة تفضلها.

---

## 🔄 التحديثات والصيانة

### كيف يمكنني تحديث النظام؟
```bash
# سحب آخر التحديثات
git pull origin main

# تحديث التبعيات
npm update

# تحديث قاعدة البيانات
npx prisma db push

# إعادة تشغيل النظام
npm run dev
```

### كيف يمكنني عمل نسخة احتياطية؟
```bash
# نسخة احتياطية لقاعدة البيانات
pg_dump sabq_ai > backup.sql

# نسخة احتياطية للملفات
tar -czf backup.tar.gz public/uploads/
```

### هل التحديثات تؤثر على البيانات؟
نحن نتبع معايير صارمة للتحديثات:
- **اختبار شامل** قبل الإصدار
- **Migration scripts** آمنة
- **إرشادات ترقية** مفصلة
- **نسخ احتياطية** موصى بها

---

## 🌍 الدعم الدولي

### هل يدعم النظام لغات أخرى؟
حالياً يدعم النظام العربية والإنجليزية. يمكنك إضافة لغات أخرى عبر:
1. إضافة ملفات الترجمة في `locales/`
2. تحديث إعدادات i18n
3. اختبار الترجمة

### كيف يمكنني تغيير اتجاه النص؟
```css
/* للعربية */
.rtl {
  direction: rtl;
  text-align: right;
}

/* للإنجليزية */
.ltr {
  direction: ltr;
  text-align: left;
}
```

### هل يدعم النظام عملات متعددة؟
نعم، يدعم النظام عملات متعددة عبر تكامل Stripe والمزودين الآخرين.

---

## 💡 نصائح وحيل

### كيف يمكنني تحسين الأداء؟
1. **تفعيل Redis** للتخزين المؤقت
2. **ضغط الصور** تلقائياً
3. **تحسين قاعدة البيانات** بفهارس
4. **استخدام CDN** للملفات الثابتة

### أفضل الممارسات للأمان
- **تحديث كلمات المرور** بانتظام
- **مراجعة الصلاحيات** شهرياً
- **تفعيل المصادقة الثنائية**
- **مراقبة سجلات الأمان**

### كيف يمكنني تحسين تجربة المستخدم؟
- **تصميم متجاوب** لجميع الأجهزة
- **تحميل سريع** للصفحات
- **واجهة بديهية** بالعربية
- **إشعارات مفيدة** للمستخدمين

---

## 🎯 حالات الاستخدام الشائعة

### مدونة شخصية
```typescript
// إعداد أساسي لمدونة شخصية
const blogConfig = {
  theme: 'personal',
  language: 'ar',
  features: ['comments', 'sharing', 'seo']
};
```

### موقع إخباري
```typescript
// إعداد للمواقع الإخبارية
const newsConfig = {
  theme: 'news',
  categories: ['محليات', 'عالمي', 'رياضة', 'تقنية'],
  features: ['breaking-news', 'push-notifications', 'analytics']
};
```

### متجر إلكتروني
```typescript
// إعداد للتجارة الإلكترونية
const ecommerceConfig = {
  payments: ['stripe', 'tap'],
  shipping: ['local', 'international'],
  languages: ['ar', 'en']
};
```

---

## 🆘 إذا كنت تواجه مشاكل

### تحقق من هذه النقاط أولاً:
1. ✅ **Node.js** مثبت بإصدار 18+
2. ✅ **PostgreSQL** يعمل
3. ✅ **متغيرات البيئة** محدثة
4. ✅ **المنافذ** متاحة (3000, 5432)
5. ✅ **التبعيات** مثبتة (`npm install`)

### إذا استمرت المشكلة:
1. 🔍 **تحقق من سجلات الأخطاء**
2. 🧪 **شغل الاختبارات** `npm test`
3. 📚 **راجع الوثائق**
4. 💬 **اسأل في Discord**
5. 📧 **راسلنا** support@sabq.ai

---

**لم تجد إجابة لسؤالك؟** 

📧 راسلنا على: support@sabq.ai  
💬 انضم لمجتمعنا: [Discord](https://discord.gg/sabq-ai)  
📱 تابعنا على: [@SabqAI](https://twitter.com/SabqAI)

---

**آخر تحديث:** ديسمبر 2024  
**الإصدار:** v2.1.0  
**المطور:** فريق Sabq AI 