# 📚 توثيق API - Sabq AI CMS

## نظرة عامة

API نظام إدارة المحتوى الذكي لسبق يوفر نقاط نهاية شاملة لإدارة المحتوى والمستخدمين والتحليلات.

- **الإصدار:** 2.1.0
- **الرابط الأساسي:** `https://api.sabq.org/v2`
- **التوثيق:** REST API مع JSON
- **المصادقة:** JWT Tokens

## 🔐 المصادقة - Authentication

### تسجيل الدخول
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "اسم المستخدم",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### تسجيل حساب جديد
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "password": "password123"
}
```

### تسجيل الخروج
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### معلومات المستخدم الحالي
```http
GET /api/auth/me
Authorization: Bearer <token>
```

## 📝 المقالات - Articles

### جلب المقالات
```http
GET /api/articles
```

**المعاملات:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد النتائج (افتراضي: 10)
- `category`: فلترة بالتصنيف
- `status`: فلترة بالحالة (published, draft, archived)
- `search`: البحث في العنوان والمحتوى

**الاستجابة:**
```json
{
  "articles": [
    {
      "id": "article-id",
      "title": "عنوان المقال",
      "slug": "article-slug",
      "summary": "ملخص المقال",
      "content": "محتوى المقال",
      "category": {
        "id": "category-id",
        "name": "التصنيف"
      },
      "author": {
        "id": "author-id",
        "name": "اسم الكاتب"
      },
      "status": "published",
      "featured": false,
      "published_at": "2024-01-15T12:00:00Z",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 100,
    "per_page": 10
  }
}
```

### جلب مقال محدد
```http
GET /api/articles/{id}
```

### إنشاء مقال جديد
```http
POST /api/articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "عنوان المقال",
  "slug": "article-slug",
  "summary": "ملخص المقال",
  "content": "محتوى المقال",
  "category_id": "category-id",
  "status": "draft",
  "featured": false,
  "tags": ["تقنية", "أخبار"],
  "seo_data": {
    "title": "عنوان SEO",
    "description": "وصف SEO",
    "keywords": ["كلمة1", "كلمة2"]
  }
}
```

### تحديث مقال
```http
PUT /api/articles/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "عنوان محدث",
  "content": "محتوى محدث",
  "status": "published"
}
```

### حذف مقال
```http
DELETE /api/articles/{id}
Authorization: Bearer <token>
```

## 📊 التحليلات - Analytics

### لوحة التحكم
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**الاستجابة:**
```json
{
  "summary": {
    "total_views": 50000,
    "total_articles": 150,
    "total_users": 1200,
    "avg_read_time": 180
  },
  "trends": {
    "daily_views": [100, 150, 200, 180, 220],
    "popular_categories": [
      {"name": "تقنية", "views": 15000},
      {"name": "أخبار", "views": 12000}
    ]
  }
}
```

### تسجيل حدث
```http
POST /api/analytics/events
Content-Type: application/json

{
  "event_type": "article_view",
  "article_id": "article-id",
  "user_id": "user-id",
  "event_data": {
    "source": "web",
    "device": "desktop",
    "duration": 120
  }
}
```

### تقرير مفصل
```http
GET /api/analytics/report
Authorization: Bearer <token>
```

المعاملات:
- `start_date`: تاريخ البداية (YYYY-MM-DD)
- `end_date`: تاريخ النهاية (YYYY-MM-DD)
- `type`: نوع التقرير (views, engagement, users)

## 🔍 البحث - Search

### البحث العام
```http
GET /api/search?q=كلمة البحث
```

**المعاملات:**
- `q`: استعلام البحث (مطلوب)
- `type`: نوع البحث (articles, users, categories)
- `limit`: عدد النتائج (افتراضي: 10)

**الاستجابة:**
```json
{
  "results": [
    {
      "type": "article",
      "id": "article-id",
      "title": "عنوان المقال",
      "summary": "ملخص المقال",
      "relevance": 0.95
    }
  ],
  "total": 25,
  "query": "كلمة البحث"
}
```

## 🤖 خدمات الذكاء الاصطناعي

### التوصيات
```http
POST /api/ml/recommendations
Content-Type: application/json

{
  "user_id": "user-id",
  "limit": 5,
  "context": "article_read"
}
```

### تحليل النص
```http
POST /api/ml/text-analysis
Content-Type: application/json

{
  "text": "النص المراد تحليله",
  "analysis_type": "sentiment"
}
```

## 🔗 التكاملات - Integrations

### قائمة التكاملات
```http
GET /api/integrations
Authorization: Bearer <token>
```

### تفعيل تكامل
```http
POST /api/integrations/{integration_id}/activate
Authorization: Bearer <token>
Content-Type: application/json

{
  "config": {
    "api_key": "integration-api-key",
    "webhook_url": "https://example.com/webhook"
  }
}
```

### اختبار تكامل
```http
GET /api/integrations/{integration_id}/test
Authorization: Bearer <token>
```

## 👥 إدارة المستخدمين

### قائمة المستخدمين (مدراء فقط)
```http
GET /api/users
Authorization: Bearer <admin_token>
```

### تحديث ملف المستخدم
```http
PUT /api/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "الاسم الجديد",
  "bio": "نبذة عن المستخدم",
  "preferences": {
    "language": "ar",
    "timezone": "Asia/Riyadh"
  }
}
```

## 📂 التصنيفات - Categories

### جلب التصنيفات
```http
GET /api/categories
```

### إنشاء تصنيف جديد
```http
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "تصنيف جديد",
  "slug": "new-category",
  "description": "وصف التصنيف"
}
```

## 🏥 فحص الصحة - Health Check

### فحص صحة النظام
```http
GET /api/health
```

**الاستجابة:**
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "storage": "healthy"
  }
}
```

## 📋 أكواد الاستجابة

### النجاح
- `200 OK`: الطلب نجح
- `201 Created`: تم إنشاء المورد بنجاح
- `204 No Content`: نجح الطلب بدون محتوى

### أخطاء العميل
- `400 Bad Request`: طلب غير صحيح
- `401 Unauthorized`: غير مصرح
- `403 Forbidden`: محظور
- `404 Not Found`: غير موجود
- `422 Unprocessable Entity`: بيانات غير صحيحة

### أخطاء الخادم
- `500 Internal Server Error`: خطأ في الخادم
- `502 Bad Gateway`: خطأ في البوابة
- `503 Service Unavailable`: الخدمة غير متاحة

## 🔐 الأمان

### رؤوس الأمان
جميع الطلبات تتضمن:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### تحديد معدل الطلبات
- API عام: 100 طلب/دقيقة
- API المصادقة: 1000 طلب/دقيقة
- API الإدارة: 50 طلب/دقيقة

### تشفير البيانات
- جميع البيانات الحساسة مشفرة
- كلمات المرور محمية بـ bcrypt
- التوكينات محمية بـ JWT

## 📝 أمثلة التطبيق

### JavaScript/Node.js
```javascript
const axios = require('axios');

// تسجيل الدخول
const login = async (email, password) => {
  const response = await axios.post('/api/auth/login', {
    email,
    password
  });
  return response.data.token;
};

// جلب المقالات
const getArticles = async (token) => {
  const response = await axios.get('/api/articles', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.articles;
};
```

### Python
```python
import requests

# تسجيل الدخول
def login(email, password):
    response = requests.post('/api/auth/login', json={
        'email': email,
        'password': password
    })
    return response.json()['token']

# جلب المقالات
def get_articles(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get('/api/articles', headers=headers)
    return response.json()['articles']
```

### cURL
```bash
# تسجيل الدخول
curl -X POST "https://api.sabq.org/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# جلب المقالات
curl -X GET "https://api.sabq.org/v2/articles" \
  -H "Authorization: Bearer <token>"
```

## 🆘 الدعم والمساعدة

### الاتصال
- البريد الإلكتروني: api-support@sabq.org
- الوثائق: https://docs.sabq.org
- GitHub Issues: https://github.com/sabq4org/sabq-ai-cms/issues

### الإصدارات
- الإصدار الحالي: 2.1.0
- الإصدارات المدعومة: 2.x.x
- دورة الإصدار: شهرية

---

**آخر تحديث:** 2024-01-15
**إصدار الوثائق:** 2.1.0 