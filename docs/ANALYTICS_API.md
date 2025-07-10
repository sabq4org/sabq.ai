# 📊 نظام تتبع السلوك والتوصيات الذكية

## نظرة عامة

نظام شامل لتتبع سلوك المستخدمين وتوليد توصيات مخصصة باستخدام الذكاء الاصطناعي.

## 🎯 أنواع الأحداث المتتبعة

### أحداث الصفحات
- `page_view`: عرض الصفحة
- `page_enter`: دخول الصفحة  
- `page_exit`: مغادرة الصفحة

### أحداث المقالات
- `article_view`: عرض المقال
- `article_like`: إعجاب بالمقال
- `article_share`: مشاركة المقال
- `article_bookmark`: حفظ المقال
- `article_comment`: التعليق على المقال

### أحداث القراءة
- `reading_start`: بداية القراءة
- `reading_time`: وقت القراءة
- `scroll_depth`: عمق التمرير
- `section_view`: عرض قسم معين

### أحداث البحث
- `search_query`: استعلام البحث
- `search_click`: النقر على نتيجة بحث
- `search_no_results`: بحث بدون نتائج

## 📡 نقاط النهاية - API Endpoints

### تسجيل الأحداث
```http
POST /api/analytics/events
Content-Type: application/json

{
  "events": [
    {
      "eventType": "article_view",
      "eventData": {
        "articleId": "123",
        "category": "تقنية",
        "tags": ["AI", "برمجة"]
      },
      "timestamp": "2024-01-15T12:00:00Z",
      "sessionId": "session_123",
      "userId": "user_456"
    }
  ]
}
```

### التوصيات الذكية
```http
POST /api/ml/recommendations
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_events": [...],
  "articles": [...],
  "top_n": 5,
  "context": "homepage"
}
```

### تحليل اهتمامات المستخدم
```http
POST /api/ml/interest-analysis
Content-Type: application/json

{
  "user_events": [...]
}
```

## 🤖 خوارزمية التوصيات

### المكونات الأساسية

1. **التوصية بناءً على المحتوى** (40%)
   - تحليل التصنيفات المفضلة
   - مطابقة الكلمات المفتاحية
   - تفضيلات الكتّاب

2. **التصفية التعاونية** (30%)
   - سلوك المستخدمين المشابهين
   - أنماط القراءة المتشابهة

3. **الشعبية** (20%)
   - عدد المشاهدات
   - معدل التفاعل
   - الترند الحالي

4. **التنوع** (10%)
   - تنويع التصنيفات
   - اكتشاف محتوى جديد

### حساب درجة الاهتمام

```python
def compute_interest_score(user_events):
    scores = {}
    for event in user_events:
        weight = get_event_weight(event['event_type'])
        time_decay = calculate_time_decay(event['timestamp'])
        final_score = weight * time_decay
        
        category = event['event_data'].get('category')
        scores[category] = scores.get(category, 0) + final_score
    
    return normalize_scores(scores)
```

### أوزان الأحداث

| نوع الحدث | الوزن |
|----------|-------|
| article_view | 1.0 |
| article_like | 3.0 |
| article_share | 2.5 |
| article_comment | 2.0 |
| reading_time | 1.5 |
| scroll_depth | 0.5 |

## 📈 مقاييس الأداء

### مقاييس التوصيات
- **التنوع**: تنوع التصنيفات في التوصيات
- **التغطية**: نسبة التصنيفات المشمولة
- **الحداثة**: متوسط حداثة المقالات الموصى بها
- **دقة التوصية**: نسبة النقر على التوصيات

### مقاييس التفاعل
- **معدل التفاعل**: نسبة الأحداث التفاعلية
- **وقت القراءة المتوسط**: متوسط وقت قراءة المقالات
- **عمق التمرير**: متوسط عمق التمرير في المقالات

## 🔧 الاستخدام في الواجهة الأمامية

### تتبع عرض المقال
```typescript
import { trackArticleView } from '@/lib/analytics-core';

trackArticleView(articleId, {
  title: article.title,
  category: article.category.name,
  author: article.author.name,
  tags: article.tags,
  readingTime: article.reading_time
});
```

### تتبع التفاعل
```typescript
import { trackEvent, EventType } from '@/lib/analytics-core';

// إعجاب بالمقال
trackEvent(EventType.ARTICLE_LIKE, {
  articleId: '123',
  action: 'like'
});

// مشاركة المقال
trackEvent(EventType.ARTICLE_SHARE, {
  articleId: '123',
  platform: 'twitter',
  method: 'share_button'
});
```

### جلب التوصيات
```typescript
const fetchRecommendations = async () => {
  const response = await fetch('/api/ml/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      user_events: userEvents,
      articles: availableArticles,
      top_n: 5,
      context: 'homepage'
    })
  });
  
  const data = await response.json();
  return data.recommendations;
};
```

## 🛡️ الخصوصية والأمان

### حماية البيانات
- تشفير البيانات الحساسة
- عدم تخزين معلومات شخصية غير ضرورية
- احترام إعدادات "عدم التتبع"

### إعدادات الخصوصية
```typescript
const analytics = new AdvancedAnalytics({
  respectDNT: true,      // احترام Do Not Track
  enableErrorTracking: true,
  enablePerformanceTracking: true,
  debug: false
});
```

## 📊 لوحة التحكم التحليلية

### عرض الإحصائيات
```http
GET /api/analytics/dashboard
Authorization: Bearer <admin_token>
```

الاستجابة:
```json
{
  "summary": {
    "total_views": 50000,
    "total_articles": 150,
    "total_users": 1200,
    "avg_read_time": 180
  },
  "trends": {
    "daily_views": [100, 150, 200],
    "popular_categories": [
      {"name": "تقنية", "views": 15000}
    ]
  }
}
```

## 🔄 التطوير المستقبلي

### ميزات مخططة
- تحليل المشاعر للمحتوى
- توصيات بناءً على الوقت
- تخصيص أعمق للمحتوى
- تكامل مع وسائل التواصل الاجتماعي

### تحسينات الخوارزمية
- نماذج تعلم آلي متقدمة
- معالجة طبيعية للغة العربية
- تحليل السياق الزمني
- توصيات مجموعات متقدمة

---

**آخر تحديث**: 2024-01-15  
**إصدار النظام**: 3.0.0 