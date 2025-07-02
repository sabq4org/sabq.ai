# 📖 مرجع واجهات برمجة التطبيقات (API Reference)

## 📅 آخر تحديث: 19 يونيو 2025

---

## 🚀 البداية السريعة

### نقطة الوصول الأساسية
```
http://localhost:3000/api
```

### المصادقة
معظم نقاط النهاية تتطلب مصادقة. يتم تخزين بيانات المستخدم في `localStorage`.

### تنسيق الطلبات
- **Content-Type**: `application/json`
- **Accept**: `application/json`

### تنسيق الاستجابات
جميع الاستجابات بتنسيق JSON:
```json
{
  "success": boolean,
  "data": object | array,
  "message": string,
  "error": string (optional)
}
```

---

## 🔐 المصادقة والأمان

### POST `/api/auth/login`
تسجيل دخول المستخدم

**الطلب:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**الاستجابة الناجحة (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-1750236579398-3h4rt6gu7",
    "name": "علي عبده",
    "email": "user@example.com",
    "role": "admin",
    "avatar": "https://example.com/avatar.jpg",
    "loyaltyPoints": 1500,
    "isVerified": true,
    "status": "active"
  },
  "message": "تم تسجيل الدخول بنجاح"
}
```

**الأخطاء:**
- `401`: بيانات الدخول غير صحيحة
- `403`: الحساب محظور أو معطل

---

### POST `/api/auth/register`
تسجيل مستخدم جديد

**الطلب:**
```json
{
  "name": "اسم المستخدم",
  "email": "new@example.com",
  "password": "password123",
  "interests": ["سياسة", "تقنية", "رياضة"]
}
```

**التحقق:**
- البريد الإلكتروني يجب أن يكون فريد
- كلمة المرور: 8 أحرف على الأقل
- الاهتمامات: اختيارية

---

### POST `/api/auth/verify-email`
التحقق من البريد الإلكتروني

**الطلب:**
```json
{
  "userId": "user-123",
  "code": "ABC123"
}
```

---

### POST `/api/auth/logout`
تسجيل خروج المستخدم

**لا يتطلب بيانات**

---

## 👥 إدارة المستخدمين

### GET `/api/users`
جلب قائمة المستخدمين

**معاملات الاستعلام:**
- `role`: تصفية حسب الدور
- `status`: تصفية حسب الحالة
- `search`: البحث في الأسماء والبريد
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد النتائج (افتراضي: 20)

**مثال:**
```
GET /api/users?role=editor&status=active&page=1&limit=10
```

---

### GET `/api/users/:userId`
جلب بيانات مستخدم واحد

**مثال:**
```
GET /api/users/user-1750236579398-3h4rt6gu7
```

---

### PUT `/api/users/:userId`
تحديث بيانات المستخدم

**الطلب:**
```json
{
  "name": "الاسم الجديد",
  "status": "active|suspended|banned",
  "role": "admin|editor|media|vip|regular",
  "isVerified": true,
  "phone": "+966501234567",
  "country": "السعودية",
  "city": "الرياض"
}
```

**الصلاحيات المطلوبة:**
- `admin`: يمكنه تحديث جميع الحقول
- `user`: يمكنه تحديث بياناته الشخصية فقط

---

### DELETE `/api/users/:userId`
حذف مستخدم (soft delete)

**الصلاحيات:** `admin` فقط

---

### POST `/api/users/:userId/suspend`
تعليق حساب مستخدم

**الطلب:**
```json
{
  "reason": "سبب التعليق",
  "duration": 7 // أيام
}
```

---

### POST `/api/users/:userId/activate`
تفعيل حساب معلق

---

## 📝 إدارة المقالات

### GET `/api/articles`
جلب قائمة المقالات

**معاملات الاستعلام:**
- `category`: معرف أو slug التصنيف
- `status`: `published|draft|scheduled`
- `author`: معرف الكاتب
- `tag`: الوسم
- `search`: البحث في العنوان والمحتوى
- `sort`: `newest|oldest|popular`
- `page`: رقم الصفحة
- `limit`: عدد النتائج

**مثال:**
```
GET /api/articles?category=tech&status=published&sort=popular&limit=10
```

---

### GET `/api/articles/:slug`
جلب مقال واحد بالـ slug

**مثال:**
```
GET /api/articles/how-to-use-ai-in-journalism
```

---

### POST `/api/articles`
إنشاء مقال جديد

**الطلب:**
```json
{
  "title": "عنوان المقال",
  "content": "<p>محتوى HTML</p>",
  "excerpt": "مقتطف قصير",
  "category": {
    "id": 1,
    "name": "تقنية"
  },
  "tags": ["ذكاء اصطناعي", "صحافة"],
  "featuredImage": "https://example.com/image.jpg",
  "status": "published",
  "scheduledFor": null,
  "isAIGenerated": false
}
```

**التحقق:**
- العنوان: مطلوب، 5-200 حرف
- المحتوى: مطلوب، 50 حرف على الأقل
- التصنيف: مطلوب
- الصورة البارزة: اختيارية

---

### PUT `/api/articles/:articleId`
تحديث مقال

**نفس حقول الإنشاء**

---

### DELETE `/api/articles/:articleId`
حذف مقال

**الصلاحيات:**
- `admin`: يمكنه حذف أي مقال
- `editor`: يمكنه حذف مقالاته فقط

---

### POST `/api/articles/:articleId/publish`
نشر مسودة

---

### POST `/api/articles/:articleId/unpublish`
إلغاء نشر مقال

---

## 🏷️ إدارة التصنيفات

### GET `/api/categories`
جلب جميع التصنيفات

**معاملات الاستعلام:**
- `active`: `true|false` - التصنيفات النشطة فقط
- `parent`: معرف التصنيف الأب

---

### GET `/api/categories/:id`
جلب تصنيف واحد

---

### POST `/api/categories`
إنشاء تصنيف جديد

**الطلب:**
```json
{
  "name": "اسم التصنيف",
  "slug": "category-slug",
  "description": "وصف التصنيف",
  "icon": "📱",
  "color": "#3B82F6",
  "parent_id": null,
  "order": 1
}
```

---

### PUT `/api/categories/:id`
تحديث تصنيف

---

### DELETE `/api/categories/:id`
حذف تصنيف

**ملاحظة:** لا يمكن حذف تصنيف يحتوي على مقالات

---

## 🏆 نظام الولاء

### GET `/api/loyalty/points`
جلب نقاط المستخدم

**معاملات الاستعلام:**
- `user_id`: معرف المستخدم (مطلوب)

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "user_id": "user-123",
    "total_points": 1500,
    "earned_points": 1600,
    "redeemed_points": 100,
    "level": "ذهبي",
    "progress_to_next": 75,
    "points_to_next": 500
  }
}
```

---

### POST `/api/loyalty/add-points`
إضافة نقاط للمستخدم

**الطلب:**
```json
{
  "user_id": "user-123",
  "points": 50,
  "reason": "قراءة مقال",
  "reference_id": "article-456"
}
```

---

### POST `/api/loyalty/redeem`
استبدال النقاط

**الطلب:**
```json
{
  "user_id": "user-123",
  "points": 100,
  "reward_type": "discount|feature|gift",
  "reward_id": "reward-789"
}
```

---

### GET `/api/loyalty/stats`
إحصائيات نظام الولاء العامة

**الاستجابة:**
```json
{
  "overview": {
    "totalUsers": 1000,
    "totalPoints": 500000,
    "averagePoints": 500,
    "activeUsers": 750
  },
  "topUsers": [...],
  "tierDistribution": {
    "bronze": 400,
    "silver": 300,
    "gold": 250,
    "ambassador": 50
  }
}
```

---

### GET `/api/loyalty/history/:userId`
سجل نقاط المستخدم

---

## 💬 التفاعلات

### POST `/api/interactions`
تسجيل تفاعل جديد

**الطلب:**
```json
{
  "user_id": "user-123",
  "article_id": "article-456",
  "interaction_type": "read|like|share|save|view",
  "duration": 180 // ثواني (للقراءة فقط)
}
```

**النقاط المكتسبة:**
- `read`: 10 نقاط (عند قراءة 80%)
- `share`: 15 نقاط
- `like`: 5 نقاط
- `save`: 5 نقاط
- `view`: 1 نقطة

---

### GET `/api/interactions/user/:userId`
جلب تفاعلات المستخدم

**معاملات الاستعلام:**
- `type`: نوع التفاعل
- `from`: تاريخ البداية
- `to`: تاريخ النهاية

---

### GET `/api/interactions/article/:articleId`
جلب تفاعلات مقال

---

## 🎨 إدارة القوالب

### GET `/api/templates/active-header`
جلب قالب الهيدر النشط

---

### GET `/api/templates`
جلب جميع القوالب

**معاملات الاستعلام:**
- `type`: `header|footer|sidebar`
- `active`: `true|false`

---

### POST `/api/templates`
إنشاء قالب جديد

**الطلب:**
```json
{
  "name": "قالب جديد",
  "type": "header",
  "content": {
    "links": [...],
    "settings": {...}
  },
  "logo_url": "https://example.com/logo.png",
  "primary_color": "#1A73E8",
  "secondary_color": "#34A853"
}
```

---

### PUT `/api/templates/:id`
تحديث قالب

---

### POST `/api/templates/:id/activate`
تفعيل قالب

---

## 📤 رفع الملفات

### POST `/api/upload`
رفع ملف

**نوع الطلب:** `multipart/form-data`

**الحقول:**
- `file`: الملف (مطلوب)
- `type`: `avatar|article|category`
- `userId`: معرف المستخدم (للصور الشخصية)

**القيود:**
- الحجم الأقصى: 5MB
- الأنواع المسموحة: `jpg`, `jpeg`, `png`, `gif`, `webp`

**الاستجابة:**
```json
{
  "success": true,
  "url": "https://example.com/uploads/image.jpg",
  "filename": "image.jpg",
  "size": 1024000
}
```

---

## 🤖 الذكاء الاصطناعي

### POST `/api/ai/generate-article`
توليد مقال بالذكاء الاصطناعي

**الطلب:**
```json
{
  "prompt": "اكتب مقالاً عن تأثير الذكاء الاصطناعي على الصحافة",
  "category": "تقنية",
  "tone": "professional|casual|academic",
  "length": "short|medium|long",
  "language": "ar|en"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "article": {
    "title": "العنوان المولد",
    "content": "المحتوى HTML",
    "excerpt": "المقتطف",
    "tags": ["وسم1", "وسم2"],
    "readTime": 5
  }
}
```

---

### POST `/api/ai/improve-text`
تحسين النص

**الطلب:**
```json
{
  "text": "النص المراد تحسينه",
  "type": "grammar|style|clarity|seo",
  "targetLength": 200 // اختياري
}
```

---

### POST `/api/ai/summarize`
تلخيص نص

**الطلب:**
```json
{
  "text": "النص الطويل",
  "maxLength": 150
}
```

---

### POST `/api/ai/translate`
ترجمة نص

**الطلب:**
```json
{
  "text": "النص المراد ترجمته",
  "from": "ar",
  "to": "en"
}
```

---

## 📊 الإحصائيات والتقارير

### GET `/api/stats/dashboard`
إحصائيات لوحة التحكم

**الاستجابة:**
```json
{
  "users": {
    "total": 1000,
    "active": 750,
    "new": 50,
    "growth": 5.2
  },
  "articles": {
    "total": 5000,
    "published": 4500,
    "views": 150000,
    "avgReadTime": 3.5
  },
  "interactions": {
    "today": 1000,
    "week": 7000,
    "month": 30000
  },
  "topCategories": [...],
  "topArticles": [...]
}
```

---

### GET `/api/stats/articles/:period`
إحصائيات المقالات

**المعاملات:**
- `period`: `day|week|month|year`

---

### GET `/api/stats/users/:period`
إحصائيات المستخدمين

---

## 🔍 البحث

### GET `/api/search`
البحث الشامل

**معاملات الاستعلام:**
- `q`: نص البحث (مطلوب)
- `type`: `all|articles|users|categories`
- `limit`: عدد النتائج

**مثال:**
```
GET /api/search?q=ذكاء+اصطناعي&type=articles&limit=10
```

---

## 🔔 الإشعارات

### GET `/api/notifications/:userId`
جلب إشعارات المستخدم

---

### POST `/api/notifications/mark-read`
تحديد الإشعارات كمقروءة

**الطلب:**
```json
{
  "notification_ids": ["notif-1", "notif-2"]
}
```

---

### PUT `/api/notifications/settings/:userId`
تحديث إعدادات الإشعارات

**الطلب:**
```json
{
  "email": true,
  "push": false,
  "sms": false,
  "types": {
    "new_article": true,
    "comments": false,
    "likes": true
  }
}
```

---

## 🛠️ أدوات المطورين

### GET `/api/health`
فحص صحة النظام

**الاستجابة:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "timestamp": "2025-06-19T12:00:00Z"
}
```

---

### GET `/api/logs`
سجلات النظام (للمسؤولين فقط)

---

## ⚠️ معالجة الأخطاء

### أكواد الحالة
- `200`: نجح الطلب
- `201`: تم إنشاء المورد
- `400`: خطأ في الطلب
- `401`: غير مصرح
- `403`: ممنوع
- `404`: غير موجود
- `422`: بيانات غير صالحة
- `429`: تجاوز حد الطلبات
- `500`: خطأ في الخادم

### تنسيق الأخطاء
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "وصف الخطأ",
    "details": {...}
  }
}
```

---

## 🔒 الأمان

### معدل الطلبات
- 100 طلب لكل دقيقة لكل IP
- 1000 طلب لكل ساعة لكل مستخدم

### CORS
مسموح من:
- `http://localhost:3000`
- `https://sabq.ai`

### Headers المطلوبة
```
X-Requested-With: XMLHttpRequest
Accept: application/json
```

---

## 📚 أمثلة متكاملة

### مثال: تسجيل دخول وجلب المقالات
```javascript
// 1. تسجيل الدخول
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { user } = await loginResponse.json();
localStorage.setItem('user', JSON.stringify(user));

// 2. جلب المقالات
const articlesResponse = await fetch('/api/articles?status=published&limit=10');
const { articles } = await articlesResponse.json();

// 3. تسجيل تفاعل
await fetch('/api/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user.id,
    article_id: articles[0].id,
    interaction_type: 'view'
  })
});
```

---

هذا المرجع يُحدث بشكل دوري. آخر تحديث: **19 يونيو 2025** 