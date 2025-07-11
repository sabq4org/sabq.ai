# 🔐 توثيق APIs المصادقة وإدارة المستخدمين

## نظرة عامة

يوفر نظام المصادقة في Sabq AI CMS مجموعة شاملة من APIs الآمنة لإدارة المستخدمين والجلسات. يتضمن النظام حماية متقدمة من الهجمات الشائعة وإدارة آمنة للجلسات باستخدام JWT.

## 🛡️ الأمان والحماية

### الميزات الأمنية المطبقة:
- **تشفير كلمات المرور**: باستخدام bcrypt مع salt rounds = 12
- **JWT آمن**: مع issuer و audience verification
- **Rate Limiting**: حماية من هجمات Brute Force
- **تنظيف المدخلات**: حماية من XSS attacks
- **Headers أمنية**: X-XSS-Protection, X-Frame-Options, X-Content-Type-Options
- **CORS**: دعم Cross-Origin Resource Sharing

### قوانين كلمة المرور:
- الحد الأدنى: 8 أحرف
- يجب أن تحتوي على: حرف كبير، حرف صغير، رقم، رمز خاص

---

## 📋 نقاط النهاية (Endpoints)

### 1. تسجيل مستخدم جديد

**POST** `/api/auth/register`

#### الطلب (Request)
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "ahmed@example.com",
    "name": "أحمد محمد",
    "role": "reader",
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token-string",
  "sessionId": "session-uuid"
}
```

#### أخطاء محتملة
- **400**: بيانات غير صالحة
- **400**: البريد الإلكتروني مستخدم بالفعل
- **400**: كلمة المرور ضعيفة
- **429**: تجاوز حد المحاولات (3 محاولات/ساعة)

---

### 2. تسجيل الدخول

**POST** `/api/auth/login`

#### الطلب (Request)
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "ahmed@example.com",
    "name": "أحمد محمد",
    "role": "reader",
    "is_verified": false,
    "last_login": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt-token-string",
  "sessionId": "session-uuid",
  "message": "تم تسجيل الدخول بنجاح"
}
```

#### أخطاء محتملة
- **400**: بيانات غير صالحة
- **401**: البريد الإلكتروني أو كلمة المرور غير صحيحة
- **429**: تجاوز حد المحاولات (5 محاولات/15 دقيقة)

---

### 3. تسجيل الخروج

**POST** `/api/auth/logout`

#### الطلب (Request)
```
Headers:
Authorization: Bearer jwt-token-string
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### أخطاء محتملة
- **401**: رمز المصادقة مطلوب
- **401**: رمز المصادقة غير صالح
- **404**: الجلسة غير موجودة

---

### 4. تسجيل الخروج من جميع الأجهزة

**DELETE** `/api/auth/logout`

#### الطلب (Request)
```
Headers:
Authorization: Bearer jwt-token-string
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "message": "تم تسجيل الخروج من جميع الأجهزة بنجاح",
  "sessionsDeleted": 3,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. الحصول على بيانات المستخدم الحالي

**GET** `/api/auth/me`

#### الطلب (Request)
```
Headers:
Authorization: Bearer jwt-token-string
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "ahmed@example.com",
    "name": "أحمد محمد",
    "role": "reader",
    "is_verified": false,
    "avatar_url": null,
    "bio": null,
    "last_login": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "id": "session-uuid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "ip_address": "192.168.1.1"
  }
}
```

---

### 6. تحديث الملف الشخصي

**PATCH** `/api/auth/me`

#### الطلب (Request)
```json
{
  "name": "أحمد محمد الجديد",
  "bio": "مطور ويب متخصص في React و Node.js",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "message": "تم تحديث الملف الشخصي بنجاح",
  "user": {
    "id": "uuid-string",
    "email": "ahmed@example.com",
    "name": "أحمد محمد الجديد",
    "role": "reader",
    "is_verified": false,
    "avatar_url": "https://example.com/avatar.jpg",
    "bio": "مطور ويب متخصص في React و Node.js",
    "last_login": "2024-01-01T00:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### قيود التحديث
- **name**: 2-100 حرف
- **bio**: حد أقصى 500 حرف
- **avatar_url**: رابط صالح

---

## 🔑 استخدام JWT Token

### في الطلبات
```javascript
// في JavaScript
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// في cURL
curl -H "Authorization: Bearer jwt-token-string" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/auth/me
```

### معلومات الـ Token
- **انتهاء الصلاحية**: 7 أيام
- **Issuer**: sabq-ai-cms
- **Audience**: sabq-ai-users
- **Algorithm**: HS256

---

## 🚦 أكواد الحالة (Status Codes)

| الكود | الوصف |
|-------|--------|
| 200 | نجح الطلب |
| 400 | بيانات غير صالحة |
| 401 | غير مصرح |
| 403 | ممنوع |
| 404 | غير موجود |
| 423 | الحساب مقفل |
| 429 | تجاوز الحد المسموح |
| 500 | خطأ في الخادم |

---

## 🛠️ أمثلة عملية

### مثال كامل لتسجيل الدخول وإدارة الجلسة

```javascript
// تسجيل الدخول
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      // حفظ التوكن
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    throw error;
  }
}

// الحصول على بيانات المستخدم
async function getCurrentUser() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('لم يتم تسجيل الدخول');
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      return data.user;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('خطأ في الحصول على بيانات المستخدم:', error);
    throw error;
  }
}

// تسجيل الخروج
async function logout() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // إزالة البيانات المحلية
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // إعادة توجيه للصفحة الرئيسية
    window.location.href = '/';
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
  }
}
```

---

## 🔒 أفضل الممارسات الأمنية

### للمطورين
1. **لا تخزن كلمات المرور في النصوص العادية**
2. **استخدم HTTPS في الإنتاج**
3. **قم بتحديث التوكن بانتظام**
4. **احذف الجلسات المنتهية الصلاحية**
5. **راقب المحاولات المشبوهة**

### للمستخدمين
1. **استخدم كلمات مرور قوية**
2. **لا تشارك بيانات تسجيل الدخول**
3. **سجل الخروج من الأجهزة العامة**
4. **راقب نشاط حسابك**

---

## 🐛 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. "رمز المصادقة غير صالح"
- **السبب**: التوكن منتهي الصلاحية أو تالف
- **الحل**: تسجيل الدخول مرة أخرى

#### 2. "تجاوز حد المحاولات"
- **السبب**: محاولات تسجيل دخول كثيرة
- **الحل**: انتظار 15 دقيقة قبل المحاولة مرة أخرى

#### 3. "البريد الإلكتروني مستخدم بالفعل"
- **السبب**: يوجد حساب بنفس البريد الإلكتروني
- **الحل**: استخدام بريد إلكتروني آخر أو تسجيل الدخول

#### 4. "كلمة المرور ضعيفة"
- **السبب**: كلمة المرور لا تلبي المتطلبات
- **الحل**: استخدام كلمة مرور تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز

---

## 📊 مراقبة الأداء

### مؤشرات مهمة
- **وقت الاستجابة**: < 200ms للطلبات العادية
- **معدل النجاح**: > 99%
- **الجلسات النشطة**: مراقبة مستمرة
- **المحاولات الفاشلة**: تنبيهات تلقائية

### تسجيل الأحداث
- جميع محاولات تسجيل الدخول
- تسجيل الخروج
- تحديث البيانات الشخصية
- الأخطاء والمحاولات المشبوهة

---

## 🔄 التحديثات المستقبلية

### الميزات المخطط لها
- [ ] المصادقة الثنائية (2FA)
- [ ] تسجيل الدخول بالبصمة
- [ ] تكامل OAuth (Google, Apple)
- [ ] إدارة الجلسات المتقدمة
- [ ] تحليلات الأمان

---

**آخر تحديث**: يناير 2024  
**المطور**: علي الحازمي  
**الإصدار**: 2.1.0 