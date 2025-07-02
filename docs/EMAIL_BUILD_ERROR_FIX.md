# 🔧 حل مشكلة خطأ البريد الإلكتروني أثناء البناء

## المشكلة
```
❌ خطأ في إعدادات البريد الإلكتروني: [Error: SSL routines:ssl3_get_record:wrong version number]
```

## السبب
استخدام `secure: true` مع المنفذ 587 الذي يتطلب STARTTLS وليس SSL/TLS مباشر.

## الحلول

### 1️⃣ تعيين متغيرات البيئة الصحيحة

#### لخادم mail.jur3a.ai (SSL/TLS مباشر - المنفذ 465):
```env
SMTP_HOST=mail.jur3a.ai
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreplay@jur3a.ai
SMTP_PASS=oFWD[H,A8~8;iw7(
```

#### لخادم Gmail (STARTTLS - المنفذ 587):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2️⃣ تعطيل التحقق من البريد أثناء البناء

أضف في ملف `.env.production`:
```env
SKIP_EMAIL_VERIFICATION=true
EMAIL_DEBUG=false
```

### 3️⃣ استخدام إعدادات مختلفة للبناء

إنشاء ملف `.env.build`:
```env
# تعطيل البريد أثناء البناء
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=noreply@localhost
SMTP_PASS=dummy
SKIP_EMAIL_VERIFICATION=true
```

ثم تشغيل البناء:
```bash
cp .env.build .env
npm run build
rm .env
```

### 4️⃣ تحديث كود التهيئة

في `lib/email.ts`، أضف شرط لتخطي التحقق أثناء البناء:
```typescript
export function initializeEmail() {
  // تخطي التهيئة أثناء البناء
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    console.log('⏭️  تخطي تهيئة البريد الإلكتروني');
    return;
  }
  
  // باقي الكود...
}
```

### 5️⃣ استخدام الإعدادات المصححة

تم إنشاء ملف `lib/email-config-fix.ts` الذي يحدد الإعدادات الصحيحة تلقائياً بناءً على المنفذ:
- المنفذ 465: `secure: true` (SSL/TLS مباشر)
- المنفذ 587: `secure: false` مع `requireTLS: true` (STARTTLS)
- المنفذ 25: `secure: false` مع `requireTLS: true` (STARTTLS)

## التحقق من الإعدادات

### اختبار الاتصال:
```bash
# لخادم mail.jur3a.ai
openssl s_client -connect mail.jur3a.ai:465 -crlf

# لخادم Gmail
openssl s_client -connect smtp.gmail.com:587 -starttls smtp -crlf
```

### اختبار البريد:
```bash
npm run test-email
```

## نصائح إضافية

1. **في بيئة الإنتاج**: استخدم متغيرات البيئة الصحيحة
2. **أثناء التطوير**: يمكن تعطيل البريد بـ `SKIP_EMAIL_VERIFICATION=true`
3. **للاختبار**: استخدم خدمة مثل Mailtrap أو MailHog
4. **للأمان**: لا تضع كلمات المرور في الكود مباشرة

## الخطوات التالية

1. حدد متغيرات البيئة الصحيحة في `.env.production`
2. أعد تشغيل البناء: `npm run build`
3. تحقق من السجلات للتأكد من عدم وجود أخطاء 