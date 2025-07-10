# 🔒 سياسة الأمان - Sabq AI CMS

## نظرة عامة

نحن في **Sabq AI CMS** نأخذ الأمان بجدية تامة. هذا المستند يوضح سياساتنا الأمنية وكيفية تقرير المشاكل الأمنية.

---

## 🚨 تقرير الثغرات الأمنية

### التقرير السريع
إذا اكتشفت ثغرة أمنية، يرجى **عدم** إنشاء Issue عام. بدلاً من ذلك:

📧 **أرسل تقريراً إلى:** security@sabq.ai

### معلومات مطلوبة في التقرير
```
Subject: [SECURITY VULNERABILITY] وصف مختصر

1. وصف الثغرة:
   - نوع الثغرة (XSS, SQL Injection, إلخ)
   - الأجزاء المتأثرة من النظام

2. خطوات إعادة الإنتاج:
   - خطوات مفصلة لإعادة إنتاج المشكلة
   - بيانات الاختبار المستخدمة

3. التأثير المحتمل:
   - مستوى الخطورة (منخفض/متوسط/عالي/حرج)
   - البيانات أو الأنظمة المعرضة للخطر

4. الحل المقترح (اختياري):
   - اقتراحات لحل المشكلة

5. معلومات إضافية:
   - البيئة (Production/Staging/Development)
   - المتصفح/نظام التشغيل
   - أي ملفات أو screenshots مفيدة
```

---

## ⏱️ زمن الاستجابة

| مستوى الخطورة | زمن الاستجابة الأولي | زمن الحل المتوقع |
|----------------|---------------------|------------------|
| **حرج** | خلال 2 ساعة | خلال 24 ساعة |
| **عالي** | خلال 24 ساعة | خلال 7 أيام |
| **متوسط** | خلال 3 أيام | خلال 30 يوم |
| **منخفض** | خلال 7 أيام | خلال 90 يوم |

---

## 🛡️ تصنيف الثغرات

### حرج (Critical) 🔴
- الوصول غير المصرح به للبيانات الحساسة
- تنفيذ كود عن بُعد (RCE)
- حقن SQL يؤثر على قاعدة البيانات الرئيسية
- تجاوز المصادقة الكامل

### عالي (High) 🟠
- Cross-Site Scripting (XSS) مخزن
- حقن SQL محدود
- تصعيد الصلاحيات
- تسريب معلومات حساسة

### متوسط (Medium) 🟡
- Cross-Site Request Forgery (CSRF)
- XSS منعكس
- تسريب معلومات غير حساسة
- مشاكل في المصادقة الثانوية

### منخفض (Low) 🟢
- مشاكل في التكوين
- تسريب معلومات نظام
- مشاكل في تقوية النظام
- مشاكل في التوثيق الأمني

---

## 🔐 إجراءات الأمان المطبقة

### 1. حماية البيانات
```typescript
// تشفير البيانات الحساسة
const encryptedData = encrypt(sensitiveData, ENCRYPTION_KEY);

// تخزين كلمات المرور
const hashedPassword = await bcrypt.hash(password, 12);

// تنظيف المدخلات
const cleanInput = validator.escape(userInput);
```

### 2. التحقق من الهوية والصلاحيات
```typescript
// التحقق من JWT
const payload = jwt.verify(token, JWT_SECRET);

// التحقق من الصلاحيات
const hasPermission = await checkUserPermission(userId, 'read:articles');

// المصادقة الثنائية
const is2FAValid = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userToken
});
```

### 3. حماية API
```typescript
// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // حد أقصى 100 طلب
});

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
};

// إضافة رؤوس الأمان
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

---

## 🛠️ أدوات الأمان المستخدمة

### 1. مراقبة الأمان
- **Snyk**: فحص التبعيات للثغرات
- **ESLint Security Plugin**: فحص الكود للمشاكل الأمنية
- **Audit**: مراجعة دورية للتبعيات

### 2. اختبارات الأمان
```bash
# فحص التبعيات
npm audit
snyk test

# فحص الكود
eslint --ext .ts,.tsx . --config .eslintrc.security.js

# اختبارات الأمان
npm run test:security
```

### 3. مراقبة الإنتاج
- تسجيل جميع العمليات الحساسة
- مراقبة محاولات الوصول المشبوهة
- تنبيهات فورية للأنشطة غير العادية

---

## 🔧 التكوين الآمن

### 1. متغيرات البيئة
```env
# مفاتيح التشفير
ENCRYPTION_KEY=your-32-char-encryption-key
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=encrypted-database-url

# إعدادات الجلسة
SESSION_SECRET=your-session-secret
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=strict

# إعدادات HTTPS
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. إعدادات قاعدة البيانات
```typescript
// الاتصال الآمن بقاعدة البيانات
const databaseConfig = {
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20 // حد أقصى للاتصالات
};
```

---

## 🔍 سجلات الأمان

### 1. الأحداث المسجلة
- محاولات تسجيل الدخول (ناجحة وفاشلة)
- تغييرات كلمات المرور
- تغييرات الصلاحيات
- الوصول للبيانات الحساسة
- أخطاء API والتطبيق

### 2. تنسيق السجلات
```json
{
  "timestamp": "2024-12-20T10:30:00Z",
  "level": "SECURITY",
  "event": "FAILED_LOGIN_ATTEMPT",
  "user_id": "user_123",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "email": "user@example.com",
    "failure_reason": "invalid_password",
    "attempt_count": 3
  }
}
```

---

## 🚦 إجراءات الحوادث

### 1. اكتشاف الحادث
1. **تنبيه فوري** للفريق الأمني
2. **عزل النظام** المتأثر إذا لزم الأمر
3. **تحليل أولي** لنطاق التأثير
4. **إشعار المستخدمين** إذا تأثرت بياناتهم

### 2. الاستجابة للحادث
```typescript
// إجراءات الطوارئ
const emergencyProcedures = {
  // إيقاف النظام المتأثر
  shutdownSystem: async (systemId: string) => {
    await systemManager.shutdown(systemId);
    await notifySecurityTeam(`نظام ${systemId} تم إيقافه للطوارئ`);
  },
  
  // عزل المستخدم المشبوه
  isolateUser: async (userId: string) => {
    await userManager.suspendUser(userId);
    await auditLogger.log('USER_SUSPENDED', { userId, reason: 'security_incident' });
  },
  
  // تنظيف الجلسات
  clearAllSessions: async () => {
    await sessionManager.clearAll();
    await notifyAllUsers('تم إعادة تعيين جميع الجلسات لأسباب أمنية');
  }
};
```

### 3. ما بعد الحادث
1. **تحليل جذر السبب** (Root Cause Analysis)
2. **تحديث الإجراءات الأمنية**
3. **تقرير مفصل** للحادث
4. **تدريب الفريق** على منع حوادث مشابهة

---

## 📋 قائمة مراجعة الأمان

### للمطورين
- [ ] تحقق من جميع المدخلات قبل المعالجة
- [ ] استخدم التشفير للبيانات الحساسة
- [ ] تطبيق مبدأ الصلاحيات الأدنى
- [ ] اختبار الكود للثغرات الأمنية
- [ ] عدم تسجيل البيانات الحساسة
- [ ] استخدام HTTPS في جميع الاتصالات

### للإدارة
- [ ] مراجعة دورية للصلاحيات
- [ ] تحديث كلمات المرور بانتظام
- [ ] مراقبة السجلات الأمنية
- [ ] تدريب الفريق على الأمان
- [ ] نسخ احتياطية آمنة
- [ ] خطة للاستجابة للحوادث

---

## 📚 موارد إضافية

### الدلائل الأمنية
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### أدوات الاختبار
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)
- [Snyk](https://snyk.io/)

---

## 📞 جهات الاتصال الأمنية

### الفريق الأمني
- **رئيس الأمان**: security-lead@sabq.ai
- **فريق الاستجابة**: incident-response@sabq.ai
- **الطوارئ**: +966-11-XXX-XXXX

### التقارير
- **الثغرات الأمنية**: security@sabq.ai
- **الحوادث الأمنية**: incident@sabq.ai
- **الاستفسارات العامة**: info@sabq.ai

---

## 🏆 برنامج مكافآت الأمان

نحن نقدر عمل الباحثين الأمنيين ونقدم مكافآت للثغرات المؤكدة:

| مستوى الخطورة | المكافأة |
|----------------|----------|
| **حرج** | 1000 - 5000 ريال |
| **عالي** | 500 - 1000 ريال |
| **متوسط** | 200 - 500 ريال |
| **منخفض** | شهادة تقدير |

---

**تذكر:** الأمان مسؤولية الجميع! 🛡️

**آخر تحديث:** ديسمبر 2024  
**المطور:** فريق Sabq AI  
**البريد الإلكتروني:** security@sabq.ai 