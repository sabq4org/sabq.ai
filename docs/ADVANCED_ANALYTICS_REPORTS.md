# التقارير المتقدمة لنظام التحليلات - Sabq AI CMS

## نظرة عامة

التقارير المتقدمة تقدم تحليلات عميقة لسلوك المستخدمين من خلال تحليل أعمار الجلسة ومسارات المستخدم. هذه التقارير تساعد في فهم كيفية تفاعل المستخدمين مع المحتوى واتخاذ قرارات مدروسة لتحسين تجربة المستخدم.

## الميزات الأساسية

### 🕐 تحليل أعمار الجلسة (Session Duration Analysis)
- **توزيع الأعمار**: تصنيف الجلسات حسب المدة الزمنية
- **إحصائيات متقدمة**: متوسط، وسيط، أقل وأطول جلسة
- **تحليل حسب الجهاز**: مقارنة أداء الأجهزة المختلفة
- **تحليل حسب المتصفح**: تحليل سلوك المستخدمين حسب المتصفح
- **معدل الارتداد**: نسبة الجلسات قصيرة المدى

### 🛤️ تحليل مسارات المستخدم (User Journey Analysis)
- **أكثر المسارات شيوعاً**: المسارات الأكثر تكراراً
- **نقاط الدخول**: أهم الصفحات التي يبدأ منها المستخدمون
- **نقاط الخروج**: الصفحات التي يغادر منها المستخدمون
- **توزيع أطوال المسارات**: تحليل عدد الخطوات في كل مسار
- **معدل التحويل**: نسبة المسارات التي تؤدي إلى تفاعل

## البنية التقنية

### واجهات برمجة التطبيقات (APIs)

#### 1. API تحليل أعمار الجلسة

```http
GET /api/analytics/session-duration?days=30&limit=10000
```

**المعاملات:**
- `days`: عدد الأيام للتحليل (افتراضي: 30)
- `limit`: عدد الجلسات المراد تحليلها (افتراضي: 10000)

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "label": "أقل من 30 ثانية",
        "count": 1250,
        "percentage": 25,
        "color": "#ef4444",
        "range": { "min": 0, "max": 30 }
      }
    ],
    "stats": {
      "totalSessions": 5000,
      "validDurations": 4800,
      "averageDuration": 180,
      "medianDuration": 120,
      "minDuration": 5,
      "maxDuration": 3600,
      "bounceRate": 35
    },
    "deviceStats": [
      {
        "device": "desktop",
        "count": 2500,
        "avgDuration": 220,
        "avgPageViews": 4.2,
        "percentage": 50
      }
    ],
    "browserStats": [
      {
        "browser": "chrome",
        "count": 3000,
        "percentage": 60
      }
    ]
  }
}
```

#### 2. API تحليل مسارات المستخدم

```http
GET /api/analytics/user-journeys?days=30&minSteps=2&maxSteps=10&limit=5000
```

**المعاملات:**
- `days`: عدد الأيام للتحليل
- `minSteps`: الحد الأدنى لعدد الخطوات في المسار
- `maxSteps`: الحد الأقصى لعدد الخطوات في المسار
- `limit`: عدد الجلسات المراد تحليلها

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "topJourneys": [
      {
        "path": "👁️ مشاهدة → 📄 مقال: الذكاء الاصطناعي → ❤️ إعجاب",
        "count": 450,
        "percentage": 15,
        "avgDuration": 240,
        "avgSteps": 3,
        "topDevice": "mobile"
      }
    ],
    "topEntryPoints": [
      {
        "entry": "الصفحة الرئيسية",
        "count": 1200,
        "percentage": 40
      }
    ],
    "topExitPoints": [
      {
        "exit": "صفحة المقال",
        "count": 800,
        "percentage": 27
      }
    ],
    "lengthDistribution": [
      {
        "length": 3,
        "count": 900,
        "percentage": 30
      }
    ],
    "stats": {
      "totalJourneys": 3000,
      "avgJourneyLength": 4.2,
      "avgJourneyDuration": 195,
      "uniquePaths": 250,
      "conversionEvents": 750
    }
  }
}
```

### تحليل مخصص

#### تحليل أعمار الجلسة المخصص

```http
POST /api/analytics/session-duration
Content-Type: application/json

{
  "customBuckets": [
    { "max": 60, "label": "أقل من دقيقة" },
    { "max": 300, "label": "1-5 دقائق" },
    { "max": 1800, "label": "5-30 دقيقة" }
  ],
  "filters": {
    "deviceType": "mobile",
    "browser": "chrome",
    "minDuration": 30
  },
  "groupBy": "device",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

#### تحليل مسارات المستخدم المخصص

```http
POST /api/analytics/user-journeys
Content-Type: application/json

{
  "filters": {
    "deviceType": "desktop",
    "userId": "user-123",
    "minDuration": 60
  },
  "pathLength": {
    "min": 3,
    "max": 8
  },
  "groupBy": "device",
  "includeArticleDetails": true
}
```

## المكونات الأمامية

### 1. مكون تحليل أعمار الجلسة

```tsx
import SessionDurationChart from '@/components/analytics/SessionDurationChart';

export default function AnalyticsPage() {
  return (
    <div>
      <SessionDurationChart />
    </div>
  );
}
```

**الميزات:**
- مخطط دائري تفاعلي
- تبويبات للتحليل حسب الجهاز والمتصفح
- فلترة حسب الفترة الزمنية
- إحصائيات مفصلة

### 2. مكون تحليل مسارات المستخدم

```tsx
import UserJourneysChart from '@/components/analytics/UserJourneysChart';

export default function JourneysPage() {
  return (
    <div>
      <UserJourneysChart />
    </div>
  );
}
```

**الميزات:**
- عرض أكثر المسارات شيوعاً
- تحليل نقاط الدخول والخروج
- توزيع أطوال المسارات
- فلترة متقدمة

## الاستخدام العملي

### 1. تحليل أعمار الجلسة

```typescript
// جلب بيانات أعمار الجلسة
const fetchSessionDuration = async (days: number = 30) => {
  const response = await fetch(`/api/analytics/session-duration?days=${days}`);
  const data = await response.json();
  return data;
};

// تحليل مخصص
const customAnalysis = async () => {
  const response = await fetch('/api/analytics/session-duration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customBuckets: [
        { max: 30, label: 'قصيرة جداً' },
        { max: 180, label: 'قصيرة' },
        { max: 600, label: 'متوسطة' },
        { max: 1800, label: 'طويلة' }
      ],
      filters: { deviceType: 'mobile' },
      groupBy: 'browser'
    })
  });
  return await response.json();
};
```

### 2. تحليل مسارات المستخدم

```typescript
// جلب أكثر المسارات شيوعاً
const fetchTopJourneys = async (days: number = 30) => {
  const response = await fetch(`/api/analytics/user-journeys?days=${days}&minSteps=2&maxSteps=10`);
  const data = await response.json();
  return data;
};

// تحليل مسارات مخصص
const customJourneyAnalysis = async () => {
  const response = await fetch('/api/analytics/user-journeys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        deviceType: 'desktop',
        minDuration: 120
      },
      pathLength: { min: 3, max: 7 },
      groupBy: 'device'
    })
  });
  return await response.json();
};
```

## التفسير والرؤى

### تحليل أعمار الجلسة

#### الفئات الزمنية:
- **أقل من 30 ثانية**: جلسات ارتداد محتملة
- **30 ثانية - 3 دقائق**: تصفح سريع
- **3 - 10 دقائق**: تفاعل متوسط
- **10 - 30 دقيقة**: تفاعل عميق
- **أكثر من 30 دقيقة**: جلسات مكثفة

#### المؤشرات الرئيسية:
- **متوسط المدة**: يجب أن يكون أكثر من دقيقتين
- **معدل الارتداد**: يفضل أن يكون أقل من 40%
- **الوسيط**: مؤشر أفضل من المتوسط للفهم الحقيقي

### تحليل مسارات المستخدم

#### أنماط المسارات الشائعة:
1. **المسار الاستكشافي**: الرئيسية → تصفح → مقال
2. **المسار المباشر**: بحث → مقال → تفاعل
3. **المسار الاجتماعي**: مشاركة → مقال → مقال آخر

#### نقاط التحسين:
- **نقاط الدخول**: تحسين الصفحات الأكثر زيارة
- **نقاط الخروج**: تقليل معدل الخروج من الصفحات المهمة
- **طول المسار**: تشجيع المسارات الأطول

## الأمان والخصوصية

### حماية البيانات
- عدم تخزين معلومات شخصية في المسارات
- تشفير معرفات الجلسة
- احترام إعدادات الخصوصية (DNT)

### امتثال GDPR
- إمكانية حذف جميع بيانات المستخدم
- عدم ربط المسارات بالهوية الشخصية
- شفافية في جمع البيانات

## التحسين والأداء

### تحسين الاستعلامات
```sql
-- فهرسة للتحليلات السريعة
CREATE INDEX idx_user_sessions_duration ON user_sessions(start_time, duration);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id, timestamp);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, timestamp);
```

### تخزين مؤقت
```typescript
// تخزين مؤقت للنتائج
const cache = new Map();

const getCachedAnalysis = (key: string, ttl: number = 3600000) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  return null;
};
```

## التصدير والتقارير

### تصدير CSV
```typescript
const exportSessionDuration = async (data: any) => {
  const csv = data.distribution.map(d => 
    `${d.label},${d.count},${d.percentage}%`
  ).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'session-duration-analysis.csv';
  a.click();
};
```

### تصدير JSON
```typescript
const exportUserJourneys = async (data: any) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'user-journeys-analysis.json';
  a.click();
};
```

## أمثلة عملية

### مثال 1: تحليل أداء المحتوى
```typescript
// تحليل أعمار الجلسة للمحتوى الجديد
const analyzeNewContent = async () => {
  const data = await fetch('/api/analytics/session-duration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      groupBy: 'day'
    })
  });
  
  // تحليل الاتجاهات اليومية
  const trends = data.groupedAnalysis.map(day => ({
    date: day.group,
    avgDuration: day.avgDuration,
    bounceRate: day.bounceRate
  }));
  
  return trends;
};
```

### مثال 2: تحسين تجربة المستخدم
```typescript
// تحليل المسارات للعثور على نقاط الاحتكاك
const findFrictionPoints = async () => {
  const journeys = await fetch('/api/analytics/user-journeys').then(r => r.json());
  
  // العثور على نقاط الخروج الأكثر شيوعاً
  const exitPoints = journeys.data.topExitPoints
    .filter(point => point.percentage > 10)
    .map(point => ({
      page: point.exit,
      exitRate: point.percentage,
      improvement: point.percentage > 20 ? 'عالي' : 'متوسط'
    }));
  
  return exitPoints;
};
```

## الصيانة والمراقبة

### مراقبة الأداء
```typescript
// مراقبة أداء التحليلات
const monitorAnalyticsPerformance = () => {
  const startTime = Date.now();
  
  return {
    trackQuery: (queryName: string) => {
      const duration = Date.now() - startTime;
      console.log(`Query ${queryName} took ${duration}ms`);
      
      // تسجيل الاستعلامات البطيئة
      if (duration > 5000) {
        console.warn(`Slow query detected: ${queryName}`);
      }
    }
  };
};
```

### تنظيف البيانات
```sql
-- حذف البيانات القديمة (أكثر من 365 يوم)
DELETE FROM analytics_events 
WHERE timestamp < NOW() - INTERVAL '365 days';

-- أرشفة الجلسات القديمة
INSERT INTO user_sessions_archive 
SELECT * FROM user_sessions 
WHERE start_time < NOW() - INTERVAL '90 days';
```

## الخلاصة

التقارير المتقدمة توفر رؤى عميقة حول:

### ✅ المزايا الرئيسية:
- **فهم عميق للسلوك**: تحليل مفصل لكيفية تفاعل المستخدمين
- **تحسين مدروس**: قرارات مبنية على بيانات حقيقية
- **مرونة في التحليل**: فلترة وتجميع متقدم
- **أداء محسن**: استعلامات سريعة ومحسنة
- **خصوصية محمية**: امتثال كامل لمعايير الخصوصية

### 🎯 حالات الاستخدام:
- تحسين تجربة المستخدم
- تطوير استراتيجية المحتوى
- تحسين الأداء التقني
- فهم سلوك الجمهور
- اتخاذ قرارات مدروسة

هذا النظام يمكن المنصة من فهم المستخدمين بعمق وتحسين الخدمة بناءً على سلوكهم الفعلي.

---

**تم التطوير بواسطة**: فريق سبق الذكي  
**التاريخ**: 2024  
**الإصدار**: 1.0.0 