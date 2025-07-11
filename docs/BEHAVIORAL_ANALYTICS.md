# نظام تتبع السلوك والتحليلات - Sabq AI CMS

## نظرة عامة

نظام تتبع السلوك والتحليلات هو نظام شامل لمراقبة وتحليل سلوك المستخدمين في منصة سبق الذكي. يوفر النظام تتبعاً دقيقاً لجميع التفاعلات والأحداث مع الحفاظ على أعلى معايير الخصوصية والأمان.

## الميزات الأساسية

### 🔍 تتبع شامل للأحداث
- **مشاهدة الصفحات**: تتبع كل زيارة للصفحات مع معلومات المرجع والوقت
- **تقدم القراءة**: مراقبة تقدم المستخدم في قراءة المقالات (كل 25%)
- **عمق التمرير**: تتبع مدى عمق تمرير المستخدم في الصفحة (كل 50%)
- **التفاعلات**: تسجيل جميع النقرات والإعجابات والمشاركات والتعليقات
- **تحديد النص**: تتبع النصوص المحددة للفهم الأفضل للاهتمامات
- **البحث**: تسجيل استعلامات البحث ونتائجها
- **الجلسات**: إدارة شاملة للجلسات مع معلومات الجهاز والمتصفح

### 🛡️ حماية الخصوصية
- **احترام Do Not Track**: عدم تتبع المستخدمين الذين يفعلون DNT
- **إخفاء الهوية**: تتبع الزوار دون كشف الهوية الشخصية
- **تشفير البيانات**: جميع البيانات الحساسة مشفرة
- **امتثال GDPR**: إمكانية حذف جميع بيانات المستخدم
- **تنظيف البيانات**: إزالة تلقائية للبيانات الحساسة

### 🚀 الأداء والكفاءة
- **إرسال دفعي**: تجميع الأحداث لتقليل طلبات الشبكة
- **Rate Limiting**: حماية من السبام والتلاعب
- **تخزين محلي**: حفظ الجلسات محلياً لتحسين الأداء
- **معالجة غير متزامنة**: عدم تأثير التتبع على سرعة الموقع

## البنية التقنية

### مخطط قاعدة البيانات

```sql
-- جدول الأحداث الرئيسي
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    article_id UUID,
    user_id UUID,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- جدول الجلسات
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration INTEGER,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    referrer TEXT,
    landing_page TEXT,
    exit_page TEXT,
    is_bounce BOOLEAN DEFAULT FALSE,
    conversion_goal VARCHAR(100),
    converted BOOLEAN DEFAULT FALSE
);

-- جدول سلوك المستخدمين
CREATE TABLE user_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    avg_session_duration FLOAT DEFAULT 0,
    bounce_rate FLOAT DEFAULT 0,
    pages_per_session FLOAT DEFAULT 0,
    favorite_categories JSONB,
    reading_speed FLOAT DEFAULT 0,
    interaction_score FLOAT DEFAULT 0,
    last_activity_at TIMESTAMP
);

-- جدول تحليلات المحتوى
CREATE TABLE content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id VARCHAR(100) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    title TEXT,
    url TEXT,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    avg_time_on_page FLOAT DEFAULT 0,
    bounce_rate FLOAT DEFAULT 0,
    shares INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    scroll_depth FLOAT DEFAULT 0,
    conversion_rate FLOAT DEFAULT 0,
    traffic_sources JSONB,
    top_keywords JSONB,
    performance_score FLOAT DEFAULT 0
);

-- جدول المقاييس المباشرة
CREATE TABLE realtime_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    dimensions JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### مكونات النظام

#### 1. مكتبة التتبع (analytics-tracker.ts)
```typescript
// استخدام أساسي
import { analytics } from '@/lib/analytics-tracker';

// تتبع مشاهدة صفحة
analytics.trackPageView({
  title: 'عنوان الصفحة',
  category: 'أخبار'
});

// تتبع تفاعل مع مقال
analytics.trackArticleInteraction('article-id', 'like');

// تتبع البحث
analytics.trackSearch('الذكاء الاصطناعي', 15);
```

#### 2. مزود التحليلات (AnalyticsProvider.tsx)
```jsx
// في Layout الرئيسي
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';

export default function RootLayout({ children }) {
  return (
    <AnalyticsProvider userId={user?.id}>
      {children}
    </AnalyticsProvider>
  );
}
```

#### 3. متتبع المقالات (ArticleTracker.tsx)
```jsx
// في صفحة المقال
import ArticleTracker from '@/components/analytics/ArticleTracker';

export default function ArticlePage({ article }) {
  return (
    <ArticleTracker articleId={article.id} title={article.title}>
      <div className="article-content">
        {article.content}
      </div>
    </ArticleTracker>
  );
}
```

## واجهات برمجة التطبيقات (APIs)

### 1. استقبال الأحداث
```http
POST /api/analytics/events
Content-Type: application/json

{
  "events": [
    {
      "eventType": "page_view",
      "eventData": {
        "title": "عنوان الصفحة",
        "category": "أخبار"
      },
      "articleId": "article-id",
      "userId": "user-id",
      "sessionId": "session-id",
      "pageUrl": "https://example.com/article",
      "referrer": "https://google.com"
    }
  ],
  "session": {
    "sessionId": "session-id",
    "startTime": "2024-01-01T00:00:00Z",
    "userId": "user-id",
    "deviceInfo": {
      "userAgent": "Mozilla/5.0...",
      "language": "ar",
      "platform": "MacIntel"
    }
  }
}
```

### 2. جلب الأحداث
```http
GET /api/analytics/events?userId=user-id&eventType=page_view&limit=50&offset=0
```

### 3. حذف الأحداث (GDPR)
```http
DELETE /api/analytics/events?userId=user-id
```

### 4. لوحة التحكم
```http
GET /api/analytics/dashboard?period=7d&userId=user-id
```

### 5. البيانات المباشرة
```http
POST /api/analytics/dashboard
Content-Type: application/json

{
  "metrics": ["activeUsers", "pageViews", "events", "topPages"],
  "timeRange": "15min"
}
```

## أنواع الأحداث المدعومة

### الأحداث الأساسية
- `page_view`: مشاهدة صفحة
- `page_exit`: مغادرة صفحة
- `scroll`: تمرير في الصفحة
- `click`: نقرة على عنصر

### أحداث المقالات
- `article_start_reading`: بداية قراءة مقال
- `article_end_reading`: انتهاء قراءة مقال
- `reading_progress`: تقدم القراءة
- `reading_time`: وقت القراءة الإجمالي
- `reading_checkpoint`: نقطة تحقق كل 30 ثانية

### أحداث التفاعل
- `like`: إعجاب
- `share`: مشاركة
- `comment`: تعليق
- `bookmark`: حفظ
- `article_interaction`: تفاعل عام مع المقال

### أحداث البحث والتنقل
- `search`: استعلام بحث
- `navigation`: تنقل بين الصفحات
- `text_selection`: تحديد نص

### أحداث الأداء والأخطاء
- `performance`: مقاييس الأداء
- `error`: أخطاء JavaScript

## لوحة التحكم والتحليلات

### المقاييس الرئيسية
- **إجمالي الأحداث**: عدد جميع الأحداث المسجلة
- **المستخدمون الفريدون**: عدد المستخدمين الذين تفاعلوا
- **إجمالي الجلسات**: عدد جلسات التصفح
- **مشاهدات الصفحات**: عدد مرات مشاهدة الصفحات
- **متوسط وقت القراءة**: الوقت المتوسط المقضي في القراءة

### التحليلات المتقدمة
- **معدل الارتداد**: نسبة الجلسات التي تتضمن صفحة واحدة فقط
- **متوسط مدة الجلسة**: الوقت المتوسط لكل جلسة
- **الصفحات لكل جلسة**: متوسط عدد الصفحات في الجلسة
- **أهم المقالات**: المقالات الأكثر تفاعلاً
- **أهم الأجهزة**: توزيع المستخدمين حسب الجهاز

### البيانات المباشرة
- **المستخدمون النشطون**: عدد المستخدمين النشطين حالياً
- **الأحداث الأخيرة**: الأحداث في آخر 15 دقيقة
- **أهم الصفحات**: الصفحات الأكثر زيارة حالياً

## الأمان والخصوصية

### تدابير الأمان
1. **تشفير البيانات**: جميع البيانات الحساسة مشفرة
2. **Rate Limiting**: حماية من السبام (100 طلب/دقيقة)
3. **تنظيف المدخلات**: إزالة البيانات الحساسة تلقائياً
4. **Headers أمنية**: CORS وCSRF protection

### حماية الخصوصية
1. **DNT Support**: احترام إعداد Do Not Track
2. **إخفاء الهوية**: عدم تخزين بيانات شخصية للزوار
3. **GDPR Compliance**: إمكانية حذف جميع البيانات
4. **تنظيف تلقائي**: إزالة البيانات القديمة

### إعدادات الخصوصية
```typescript
// إعدادات مكتبة التتبع
const analytics = new AnalyticsTracker({
  respectDNT: true,        // احترام Do Not Track
  enableLocalStorage: true, // تفعيل التخزين المحلي
  rateLimitPerMinute: 60,  // حد المعدل في الدقيقة
  batchSize: 10,           // حجم الدفعة
  batchTimeout: 5000       // مهلة الدفعة (مللي ثانية)
});
```

## التكامل والاستخدام

### 1. تثبيت النظام
```bash
# تحديث قاعدة البيانات
npx prisma generate
npx prisma db push

# تشغيل النظام
npm run dev
```

### 2. إعداد التتبع في التطبيق
```jsx
// في _app.tsx أو layout.tsx
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';

export default function App({ Component, pageProps }) {
  return (
    <AnalyticsProvider userId={user?.id}>
      <Component {...pageProps} />
    </AnalyticsProvider>
  );
}
```

### 3. تتبع مخصص
```typescript
import { analytics } from '@/lib/analytics-tracker';

// تتبع حدث مخصص
analytics.trackEvent('custom_event', {
  category: 'user_action',
  action: 'button_click',
  label: 'newsletter_signup'
});

// تتبع تحويل
analytics.trackEvent('conversion', {
  goal: 'newsletter_signup',
  value: 1
});
```

## الصيانة والمراقبة

### مراقبة الأداء
- **معدل الأحداث**: مراقبة عدد الأحداث في الثانية
- **استخدام الذاكرة**: مراقبة استهلاك الذاكرة
- **أخطاء API**: تتبع أخطاء واجهات برمجة التطبيقات
- **زمن الاستجابة**: مراقبة سرعة معالجة الطلبات

### تنظيف البيانات
```sql
-- حذف الأحداث الأقدم من 90 يوم
DELETE FROM analytics_events 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- حذف الجلسات المنتهية الصلاحية
DELETE FROM user_sessions 
WHERE end_time < NOW() - INTERVAL '30 days';

-- تحديث المقاييس المجمعة
UPDATE content_analytics 
SET performance_score = (views * 0.3 + likes * 0.2 + shares * 0.3 + comments * 0.2);
```

### النسخ الاحتياطي
```bash
# نسخ احتياطي يومي للبيانات
pg_dump -h localhost -U postgres sabq_db > backup_$(date +%Y%m%d).sql

# أرشفة البيانات القديمة
pg_dump -h localhost -U postgres sabq_db \
  --table=analytics_events \
  --where="timestamp < NOW() - INTERVAL '1 year'" \
  > archive_$(date +%Y%m%d).sql
```

## استكشاف الأخطاء

### مشاكل شائعة
1. **عدم تسجيل الأحداث**: فحص DNT وإعدادات الخصوصية
2. **بطء الأداء**: زيادة حجم الدفعة أو تقليل معدل الإرسال
3. **أخطاء CORS**: تحديث إعدادات CORS في API
4. **تجاوز Rate Limit**: تقليل معدل الأحداث أو زيادة الحد

### سجلات التطوير
```typescript
// تفعيل وضع التطوير
const analytics = new AnalyticsTracker({
  debugMode: true
});

// سيطبع في console:
// [Analytics] Event tracked: page_view
// [Analytics] Events sent successfully: 5
```

## الخلاصة

نظام تتبع السلوك والتحليلات في سبق الذكي يوفر:
- ✅ تتبع شامل لجميع التفاعلات
- ✅ حماية كاملة للخصوصية
- ✅ أداء عالي وكفاءة
- ✅ لوحة تحكم تفاعلية
- ✅ APIs مرنة وقابلة للتوسع
- ✅ امتثال كامل للمعايير الدولية

هذا النظام يمكن المنصة من فهم سلوك المستخدمين بعمق وتحسين التجربة بناءً على بيانات دقيقة وموثوقة.

---

**تم التطوير بواسطة**: فريق سبق الذكي  
**التاريخ**: 2024  
**الإصدار**: 1.0.0 