# دليل واجهات برمجة التطبيقات الخلفية - Sabq AI CMS

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [المصادقة والترخيص](#المصادقة-والترخيص)
3. [معالجة الأخطاء](#معالجة-الأخطاء)
4. [تحديد المعدل](#تحديد-المعدل)
5. [APIs المصادقة](#apis-المصادقة)
6. [APIs المقالات](#apis-المقالات)
7. [APIs البحث](#apis-البحث)
8. [APIs التحليلات](#apis-التحليلات)
9. [APIs التكاملات](#apis-التكاملات)
10. [APIs الذكاء الاصطناعي](#apis-الذكاء-الاصطناعي)
11. [أمثلة الاستخدام](#أمثلة-الاستخدام)
12. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🔍 نظرة عامة

### معلومات أساسية
- **Base URL**: `https://api.sabq-ai.com`
- **إصدار API**: `v1`
- **تنسيق البيانات**: JSON
- **تشفير**: HTTPS فقط
- **أوقات الاستجابة**: < 500ms للاستعلامات البسيطة

### هيكل الاستجابة المعياري

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "errors": object | null,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrevious": boolean
  },
  "metadata": {
    "timestamp": string,
    "version": string,
    "requestId": string
  }
}
```

### رموز الحالة المدعومة

| رمز | الوصف | المعنى |
|-----|--------|--------|
| 200 | OK | نجح الطلب |
| 201 | Created | تم إنشاء المورد بنجاح |
| 400 | Bad Request | بيانات الطلب غير صحيحة |
| 401 | Unauthorized | مطلوب تسجيل الدخول |
| 403 | Forbidden | غير مصرح |
| 404 | Not Found | المورد غير موجود |
| 429 | Too Many Requests | تم تجاوز حد الطلبات |
| 500 | Internal Server Error | خطأ في الخادم |

---

## 🔐 المصادقة والترخيص

### أنواع المصادقة

#### 1. JWT Bearer Token
```http
Authorization: Bearer <jwt_token>
```

#### 2. API Key
```http
X-API-Key: <api_key>
```

#### 3. Session Cookie
```http
Cookie: sabq_access_token=<token>
```

### الحصول على رمز الوصول

```javascript
// طلب تسجيل الدخول
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'password123',
    rememberMe: true
  })
});

const data = await response.json();
const accessToken = data.data.tokens.accessToken;
```

### نظام الأذونات

#### الأدوار الأساسية
- **ADMIN**: مدير النظام - صلاحيات كاملة
- **EDITOR**: محرر - إدارة المحتوى والمقالات
- **AUTHOR**: كاتب - إنشاء وتعديل مقالاته فقط
- **READER**: قارئ - قراءة المحتوى المنشور فقط

#### الأذونات المفصلة
```javascript
// أمثلة على الأذونات
const permissions = [
  'ARTICLES_CREATE',
  'ARTICLES_EDIT_ALL',
  'ARTICLES_DELETE_ALL',
  'USERS_MANAGE',
  'ANALYTICS_READ',
  'INTEGRATIONS_MANAGE',
  'ML_TEXT_ANALYSIS'
];
```

---

## ⚠️ معالجة الأخطاء

### تنسيق رسائل الخطأ

```json
{
  "success": false,
  "message": "وصف عام للخطأ",
  "errors": {
    "field_name": "رسالة خطأ مفصلة",
    "general": "خطأ عام"
  },
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-20T12:00:00Z"
}
```

### أكواد الأخطاء الشائعة

| كود الخطأ | الوصف | الحل المقترح |
|-----------|--------|---------------|
| `INVALID_TOKEN` | رمز الوصول غير صالح | تسجيل دخول جديد |
| `RATE_LIMIT_EXCEEDED` | تجاوز حد الطلبات | انتظار وإعادة المحاولة |
| `VALIDATION_ERROR` | بيانات غير صحيحة | مراجعة البيانات المرسلة |
| `RESOURCE_NOT_FOUND` | المورد غير موجود | التحقق من المعرف |
| `PERMISSION_DENIED` | عدم وجود صلاحية | طلب الصلاحية المناسبة |

---

## 🚦 تحديد المعدل

### حدود الطلبات

| نوع المستخدم | طلبات/دقيقة | طلبات/ساعة | طلبات/يوم |
|--------------|-------------|------------|-----------|
| مجهول | 10 | 100 | 1000 |
| مسجل | 60 | 1000 | 10000 |
| مميز | 120 | 2000 | 20000 |
| API Enterprise | 1000 | 10000 | 100000 |

### headers الاستجابة

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642694400
X-RateLimit-Retry-After: 60
```

---

## 🔑 APIs المصادقة

### POST /api/auth/login
تسجيل دخول المستخدم

**المعاملات:**
```json
{
  "identifier": "email أو username",
  "password": "كلمة المرور",
  "rememberMe": false,
  "csrfToken": "optional",
  "deviceInfo": {
    "userAgent": "معلومات المتصفح",
    "ipAddress": "عنوان IP",
    "fingerprint": "بصمة الجهاز"
  }
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "fullName": "الاسم الكامل",
      "role": "AUTHOR",
      "permissions": ["ARTICLES_CREATE"],
      "preferences": {}
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresAt": 1642694400000
    },
    "session": {
      "id": "session_id",
      "deviceId": "device_id",
      "lastActivity": "2024-01-20T12:00:00Z"
    }
  }
}
```

### POST /api/auth/logout
تسجيل خروج المستخدم

### GET /api/auth/me
الحصول على معلومات المستخدم الحالي

### POST /api/auth/refresh
تجديد رمز الوصول

---

## 📄 APIs المقالات

### GET /api/articles
جلب قائمة المقالات

**معاملات الاستعلام:**
```
?page=1
&limit=20
&search=البحث
&section=القسم
&author=المؤلف
&tags=tag1,tag2
&published=true
&featured=false
&sort=date
&order=desc
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "عنوان المقال",
        "slug": "article-slug",
        "excerpt": "مقتطف من المقال",
        "featuredImage": "https://example.com/image.jpg",
        "publishedAt": "2024-01-20T12:00:00Z",
        "viewCount": 150,
        "author": {
          "id": "uuid",
          "fullName": "اسم المؤلف",
          "username": "author_username"
        },
        "section": {
          "id": "uuid",
          "name": "اسم القسم",
          "slug": "section-slug"
        },
        "tags": [
          {
            "id": "uuid",
            "name": "اسم الكلمة المفتاحية",
            "slug": "tag-slug"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### POST /api/articles
إنشاء مقال جديد

**المعاملات:**
```json
{
  "title": "عنوان المقال",
  "content": "محتوى المقال",
  "excerpt": "مقتطف اختياري",
  "featuredImage": "https://example.com/image.jpg",
  "sectionId": "uuid",
  "tags": ["tag1", "tag2"],
  "isPublished": false,
  "isFeatured": false,
  "allowComments": true,
  "publishedAt": "2024-01-20T12:00:00Z",
  "seoTitle": "عنوان SEO",
  "seoDescription": "وصف SEO",
  "seoKeywords": ["keyword1", "keyword2"]
}
```

### GET /api/articles/[id]
جلب مقال واحد

**معاملات الاستعلام:**
```
?include_related=true
&increment_view=true
```

### PUT /api/articles/[id]
تحديث مقال موجود

### DELETE /api/articles/[id]
حذف مقال (soft delete)

---

## 🔍 APIs البحث

### GET /api/search
البحث في المحتوى

**معاملات الاستعلام:**
```json
{
  "q": "استعلام البحث",
  "type": "all|articles|users|sections|tags",
  "category": "فئة اختيارية",
  "section": "قسم محدد",
  "author": "مؤلف محدد",
  "tags": ["tag1", "tag2"],
  "dateFrom": "2024-01-01T00:00:00Z",
  "dateTo": "2024-12-31T23:59:59Z",
  "sortBy": "relevance|date|popularity|title",
  "sortOrder": "asc|desc",
  "language": "ar|en|both",
  "includeContent": false,
  "includeDrafts": false,
  "highlightTerms": true,
  "fuzzySearch": true,
  "semanticSearch": false,
  "page": 1,
  "limit": 20
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "type": "article",
        "title": "عنوان المقال",
        "content": "محتوى اختياري",
        "excerpt": "مقتطف",
        "url": "/articles/article-slug",
        "score": 0.95,
        "highlights": {
          "title": ["نص <mark>مميز</mark>"],
          "content": ["محتوى <mark>مميز</mark>"]
        },
        "metadata": {
          "author": {},
          "section": {},
          "tags": [],
          "publishedAt": "2024-01-20T12:00:00Z",
          "viewCount": 100
        }
      }
    ],
    "searchInfo": {
      "query": "البحث الأصلي",
      "processedQuery": "البحث المعالج",
      "searchTime": 45,
      "totalResults": 150,
      "searchId": "uuid",
      "suggestions": ["اقتراح1", "اقتراح2"]
    },
    "facets": {
      "types": [{"type": "article", "count": 100}],
      "sections": [{"id": "uuid", "name": "قسم", "count": 50}]
    }
  }
}
```

### POST /api/search
البحث المتقدم مع إعدادات معقدة

---

## 📊 APIs التحليلات

### POST /api/analytics/events
تسجيل حدث تحليلي

**المعاملات:**
```json
{
  "eventType": "PAGE_VIEW|ARTICLE_VIEW|CLICK|SEARCH_QUERY",
  "resourceId": "معرف المورد",
  "resourceType": "article|page|user",
  "userId": "معرف المستخدم",
  "sessionId": "معرف الجلسة",
  "properties": {
    "customProperty": "قيمة مخصصة"
  },
  "utm": {
    "source": "google",
    "medium": "organic",
    "campaign": "spring_campaign"
  }
}
```

### GET /api/analytics/events
جلب تحليلات الأحداث

**معاملات الاستعلام:**
```
?start_date=2024-01-01T00:00:00Z
&end_date=2024-01-31T23:59:59Z
&event_type=PAGE_VIEW
&resource_id=uuid
&group_by=day
&limit=100
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEvents": 10000,
      "uniqueUsers": 1500,
      "pageViews": 8000,
      "sessions": 2000,
      "avgSessionDuration": 180,
      "bounceRate": 0.35
    },
    "timeSeries": [
      {
        "date": "2024-01-20",
        "count": 500,
        "uniqueUsers": 100
      }
    ],
    "topContent": [
      {
        "resourceId": "uuid",
        "title": "عنوان المقال",
        "views": 1000,
        "shares": 50
      }
    ]
  }
}
```

---

## 🔌 APIs التكاملات

### GET /api/integrations
جلب قائمة التكاملات

**معاملات الاستعلام:**
```
?type=CDN|EMAIL|PAYMENT
&provider=aws|google
&is_active=true
&search=البحث
&sort_by=name
&page=1
&limit=20
```

### POST /api/integrations
إنشاء تكامل جديد

**المعاملات:**
```json
{
  "name": "اسم التكامل",
  "type": "CDN|STORAGE|EMAIL|SMS|PAYMENT",
  "provider": "اسم المزود",
  "description": "وصف التكامل",
  "config": {
    "apiUrl": "https://api.provider.com",
    "timeout": 30000
  },
  "credentials": {
    "apiKey": "مفتاح API",
    "secretKey": "المفتاح السري"
  },
  "endpoints": [
    {
      "name": "upload",
      "url": "https://api.provider.com/upload",
      "method": "POST",
      "timeout": 60000
    }
  ],
  "rateLimits": {
    "requestsPerMinute": 100,
    "requestsPerHour": 1000
  },
  "isActive": true,
  "priority": 5
}
```

### GET /api/integrations/[id]
جلب تكامل واحد

**معاملات الاستعلام:**
```
?include_credentials=false
&include_health=true
&include_usage=true
```

### POST /api/integrations/[id]/test
اختبار التكامل

**المعاملات:**
```json
{
  "testType": "CONNECTION|AUTHENTICATION|ENDPOINTS|FULL_SUITE",
  "timeout": 30000,
  "retryCount": 1,
  "performanceMetrics": true
}
```

### GET /api/integrations/[id]/stats
إحصائيات التكامل

**معاملات الاستعلام:**
```
?timeRange=7d
&granularity=day
&metrics=requests,response_time,errors
&includeComparison=true
```

---

## 🤖 APIs الذكاء الاصطناعي

### GET /api/ml/recommendations
جلب التوصيات الذكية

**معاملات الاستعلام:**
```json
{
  "userId": "معرف المستخدم",
  "type": "articles|sections|tags|personalized",
  "context": {
    "currentArticleId": "uuid",
    "userInterests": ["تقنية", "علوم"],
    "timeOfDay": "morning|afternoon|evening|night"
  },
  "algorithm": "hybrid_ensemble|content_similarity|collaborative_filtering",
  "diversityFactor": 0.3,
  "limit": 10
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "uuid",
        "type": "article",
        "item": {
          "id": "uuid",
          "title": "عنوان المقال",
          "excerpt": "مقتطف",
          "readingTime": 5,
          "author": {},
          "section": {}
        },
        "score": 0.95,
        "confidence": 0.87,
        "reasoning": ["سبب التوصية"],
        "algorithm": "hybrid_ensemble"
      }
    ],
    "userProfile": {
      "interests": ["تقنية", "علوم"],
      "readingPatterns": {},
      "preferences": {}
    },
    "analytics": {
      "totalRecommendations": 10,
      "averageScore": 0.85,
      "diversityScore": 0.3
    }
  }
}
```

### POST /api/ml/recommendations
إرسال ملاحظات على التوصيات

**المعاملات:**
```json
{
  "recommendationId": "uuid",
  "userId": "uuid",
  "itemId": "uuid",
  "action": "click|like|share|ignore|dislike",
  "rating": 5,
  "feedback": "ملاحظات نصية"
}
```

### POST /api/ml/text-analysis
تحليل النصوص

**المعاملات:**
```json
{
  "text": "النص المراد تحليله",
  "analysisTypes": ["sentiment", "keywords", "entities", "readability"],
  "language": "ar|en|auto",
  "options": {
    "sentiment": {
      "model": "hybrid",
      "includeEmotions": true
    },
    "keywords": {
      "maxKeywords": 10,
      "method": "hybrid"
    }
  },
  "saveResults": false
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "text": {
      "original": "النص الأصلي",
      "processed": "النص المعالج",
      "wordCount": 100,
      "sentenceCount": 5
    },
    "language": {
      "detected": "ar",
      "confidence": 0.99
    },
    "sentiment": {
      "overall": {
        "polarity": "positive",
        "score": 0.75,
        "confidence": 0.85
      },
      "emotions": {
        "joy": 0.8,
        "anger": 0.1,
        "sadness": 0.1
      }
    },
    "keywords": [
      {
        "word": "تقنية",
        "score": 0.95,
        "frequency": 5,
        "type": "noun"
      }
    ],
    "entities": [
      {
        "text": "الرياض",
        "type": "LOCATION",
        "confidence": 0.9,
        "startPos": 10,
        "endPos": 16
      }
    ],
    "readability": {
      "scores": {
        "arabic_readability_index": 65
      },
      "level": "متوسط",
      "suggestions": ["استخدم جمل أقصر"]
    },
    "quality": {
      "overallScore": 85,
      "dimensions": {
        "clarity": 80,
        "coherence": 85,
        "engagement": 90
      }
    }
  }
}
```

---

## 💡 أمثلة الاستخدام

### مثال شامل: إنشاء مقال مع تحليل

```javascript
// 1. تسجيل الدخول
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'author@sabq.com',
    password: 'securePassword'
  })
});

const { data: { tokens } } = await loginResponse.json();
const authHeaders = {
  'Authorization': `Bearer ${tokens.accessToken}`,
  'Content-Type': 'application/json'
};

// 2. تحليل النص قبل النشر
const textAnalysis = await fetch('/api/ml/text-analysis', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    text: 'محتوى المقال الكامل...',
    analysisTypes: ['sentiment', 'keywords', 'readability', 'seo'],
    saveResults: true
  })
});

const analysisData = await textAnalysis.json();

// 3. إنشاء المقال
const createArticle = await fetch('/api/articles', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    title: 'عنوان المقال',
    content: 'محتوى المقال...',
    excerpt: 'مقتطف من المقال',
    sectionId: 'section-uuid',
    tags: analysisData.data.seo.suggestedTags,
    seoTitle: analysisData.data.seo.metaDescription,
    isPublished: false // مسودة أولاً
  })
});

const articleData = await createArticle.json();

// 4. الحصول على توصيات للمقالات المتعلقة
const recommendations = await fetch(`/api/ml/recommendations?type=related_content&context=${JSON.stringify({
  currentArticleId: articleData.data.article.id,
  userInterests: analysisData.data.keywords.slice(0, 5).map(k => k.word)
})}&limit=5`, {
  headers: authHeaders
});

// 5. نشر المقال إذا كان التحليل إيجابياً
if (analysisData.data.quality.overallScore > 70) {
  await fetch(`/api/articles/${articleData.data.article.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      isPublished: true,
      publishedAt: new Date().toISOString()
    })
  });
}
```

### مثال: لوحة تحكم التحليلات

```javascript
// جلب إحصائيات عامة
const analytics = await fetch('/api/analytics/events?start_date=2024-01-01&end_date=2024-01-31&group_by=day', {
  headers: authHeaders
});

// جلب أهم المقالات
const topArticles = await fetch('/api/search?type=articles&sort_by=popularity&limit=10', {
  headers: authHeaders
});

// جلب حالة التكاملات
const integrations = await fetch('/api/integrations?is_active=true', {
  headers: authHeaders
});

// عرض النتائج
const dashboardData = {
  analytics: await analytics.json(),
  topArticles: await topArticles.json(),
  integrations: await integrations.json()
};
```

---

## 🚨 استكشاف الأخطاء

### مشاكل المصادقة

**المشكلة**: `401 Unauthorized`
```json
{
  "success": false,
  "message": "رمز الوصول غير صالح",
  "error_code": "INVALID_TOKEN"
}
```

**الحلول**:
1. التحقق من صحة رمز الوصول
2. تجديد الرمز باستخدام `/api/auth/refresh`
3. تسجيل دخول جديد

### مشاكل حدود الطلبات

**المشكلة**: `429 Too Many Requests`
```json
{
  "success": false,
  "message": "تم تجاوز حد الطلبات",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

**الحلول**:
1. انتظار الوقت المحدد في `retry_after`
2. تنفيذ تأخير تلقائي في التطبيق
3. ترقية الخطة للحصول على حدود أعلى

### مشاكل التحقق من البيانات

**المشكلة**: `400 Bad Request`
```json
{
  "success": false,
  "message": "بيانات غير صحيحة",
  "errors": {
    "title": "العنوان مطلوب",
    "content": "المحتوى قصير جداً"
  }
}
```

**الحلول**:
1. مراجعة تنسيق البيانات المرسلة
2. التأكد من استيفاء جميع الحقول المطلوبة
3. فحص طول وتنسيق القيم

### مشاكل الأداء

**العلامات**:
- استجابة بطيئة (> 5 ثوان)
- timeout errors
- استهلاك عالي للذاكرة

**الحلول**:
1. تقليل حجم البيانات المطلوبة
2. استخدام التصفح (pagination)
3. إضافة فلاتر للاستعلامات
4. التحقق من حالة الشبكة

### نصائح للتطوير

1. **استخدم HTTPS دائماً** في الإنتاج
2. **تنفيذ retry logic** للطلبات المهمة
3. **تخزين مؤقت للبيانات** التي لا تتغير كثيراً
4. **مراقبة حدود الطلبات** وتنفيذ تحكم تلقائي
5. **تسجيل الأخطاء** لتسهيل استكشاف الأخطاء
6. **اختبار APIs** في بيئة تطوير أولاً

---

## 📞 الدعم والمساعدة

### معلومات الاتصال
- **البريد الإلكتروني**: api-support@sabq-ai.com
- **الدعم الفني**: https://docs.sabq-ai.com/support
- **المجتمع**: https://community.sabq-ai.com

### الموارد الإضافية
- [دليل البدء السريع](QUICK_START.md)
- [أمثلة الكود](CODE_EXAMPLES.md)
- [مواصفات OpenAPI](openapi.yaml)
- [SDKs الرسمية](https://github.com/sabq-ai/sdks)

---

**آخر تحديث**: 2024-01-20  
**إصدار الوثائق**: 1.0.0  
**إصدار API**: v1 