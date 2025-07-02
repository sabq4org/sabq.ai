# 🔒 سياسة الأمان - Security Policy

<div align="center">

[العربية](#العربية) | [English](#english)

</div>

---

<div dir="rtl">

## العربية

### 🛡️ الإصدارات المدعومة

نحن ندعم الإصدارات التالية بتحديثات الأمان:

| الإصدار | مدعوم | ملاحظات |
| ------- | ----- | ------- |
| 1.0.x   | ✅    | الإصدار الحالي |
| < 1.0   | ❌    | إصدارات تجريبية |

### 🚨 الإبلاغ عن ثغرة أمنية

إذا اكتشفت ثغرة أمنية، **من فضلك لا تنشرها علناً**. بدلاً من ذلك:

1. **أرسل بريد إلكتروني إلى**: security@sabq.ai
2. **اكتب في الموضوع**: [SECURITY] وصف مختصر للثغرة
3. **قدم المعلومات التالية**:
   - وصف تفصيلي للثغرة
   - خطوات إعادة الإنتاج
   - التأثير المحتمل
   - اقتراحات للإصلاح (إن وجدت)

### ⏱️ وقت الاستجابة المتوقع

- **الإقرار الأولي**: خلال 48 ساعة
- **التقييم الأولي**: خلال 5 أيام عمل
- **الإصلاح**: حسب شدة الثغرة (عادة 7-30 يوم)

### 🏆 برنامج المكافآت

نقدر جهود الباحثين الأمنيين. المكافآت تشمل:
- ذكر في قائمة الشكر
- شهادة تقدير رقمية
- مكافآت مالية للثغرات الحرجة

### 📋 أفضل الممارسات الأمنية في المشروع

#### 1. **حماية البيانات الحساسة**
```typescript
// ❌ لا تخزن كلمات المرور أو المفاتيح في الكود
const API_KEY = "sk-1234567890";

// ✅ استخدم متغيرات البيئة
const API_KEY = process.env.API_KEY;
```

#### 2. **التحقق من المدخلات**
```typescript
// ✅ تحقق دائماً من مدخلات المستخدم
const validateInput = (input: string) => {
  if (!input || input.length > 1000) {
    throw new Error('Invalid input');
  }
  return sanitize(input);
};
```

#### 3. **حماية APIs**
```typescript
// ✅ استخدم المصادقة والترخيص
export async function POST(req: Request) {
  const token = req.headers.get('authorization');
  if (!isValidToken(token)) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... باقي الكود
}
```

#### 4. **تشفير البيانات الحساسة**
- استخدم HTTPS دائماً
- شفر البيانات الحساسة في قاعدة البيانات
- استخدم JWT للمصادقة

### 🔐 قائمة فحص الأمان

- [ ] لا توجد مفاتيح API في الكود
- [ ] جميع المدخلات محققة ومعقمة
- [ ] استخدام HTTPS في الإنتاج
- [ ] تحديث المكتبات بانتظام
- [ ] استخدام Content Security Policy (CSP)
- [ ] حماية ضد CSRF
- [ ] حماية ضد XSS
- [ ] حماية ضد SQL Injection

</div>

---

## English

### 🛡️ Supported Versions

We support the following versions with security updates:

| Version | Supported | Notes |
| ------- | --------- | ----- |
| 1.0.x   | ✅        | Current release |
| < 1.0   | ❌        | Beta versions |

### 🚨 Reporting a Vulnerability

If you discover a security vulnerability, **please do not disclose it publicly**. Instead:

1. **Email**: security@sabq.ai
2. **Subject**: [SECURITY] Brief description
3. **Include**:
   - Detailed description
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (if any)

### ⏱️ Expected Response Time

- **Initial acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix**: Depending on severity (typically 7-30 days)

### 🏆 Bug Bounty Program

We appreciate security researchers' efforts. Rewards include:
- Mention in acknowledgments
- Digital certificate
- Monetary rewards for critical vulnerabilities

### 📋 Security Best Practices

Follow the security guidelines shown in the Arabic section above.

### 🔐 Security Checklist

- [ ] No API keys in code
- [ ] All inputs validated and sanitized
- [ ] HTTPS in production
- [ ] Regular dependency updates
- [ ] Content Security Policy (CSP) implemented
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL Injection protection

---

<div align="center">

**🙏 شكراً لمساعدتك في جعل سبق أكثر أماناً | Thank you for helping make Sabq more secure**

</div> 