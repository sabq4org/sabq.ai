# 📊 لوحة التقارير والتحليلات الذكية

> **Smart Analytics & Reporting Dashboard**

تاريخ الإنشاء: 11 يوليو 2025  
المطور: فريق سبق الذكي  
الإصدار: 1.0.0

---

## 📋 نظرة عامة

لوحة التحليلات الذكية هي نظام شامل لمراقبة وتحليل أداء المحتوى وسلوك المستخدمين في منصة سبق الذكي. توفر رؤى عميقة وتقارير تفاعلية مع إمكانية التصدير والتخصيص.

### 🎯 الأهداف الرئيسية

- **📈 تحليل شامل**: مراقبة جميع جوانب أداء المنصة
- **🔍 رؤى عميقة**: فهم سلوك المستخدمين وتفضيلاتهم
- **📊 تقارير تفاعلية**: رسوم بيانية وإحصائيات مباشرة
- **🔒 حماية الخصوصية**: إخفاء الهوية وحماية البيانات الحساسة
- **📤 تصدير مرن**: دعم تصدير البيانات بصيغ متعددة

---

## 🏗️ الهيكل التقني

### قاعدة البيانات

```sql
-- جدول أحداث التحليلات
CREATE TABLE article_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- view, scroll, click, reading_time, like, share, comment, bookmark
    value FLOAT, -- للمدة الزمنية، نسبة التمرير، إلخ
    meta JSONB, -- بيانات إضافية
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    device_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للأداء
CREATE INDEX idx_analytics_article_event ON article_analytics_events(article_id, event_type);
CREATE INDEX idx_analytics_user_date ON article_analytics_events(user_id, created_at);
CREATE INDEX idx_analytics_session_date ON article_analytics_events(session_id, created_at);
CREATE INDEX idx_analytics_event_date ON article_analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_date ON article_analytics_events(created_at);
```

### APIs المتاحة

#### 1. ملخص التحليلات العامة
```typescript
GET /api/analytics/summary
```

**المعاملات:**
- `period`: الفترة الزمنية (24h, 7d, 30d, 90d, all)
- `category_id`: فلتر حسب التصنيف (اختياري)
- `from`: تاريخ البداية (اختياري)
- `to`: تاريخ النهاية (اختياري)

**الاستجابة:**
```json
{
  "summary": {
    "totalViews": 15000,
    "uniqueViews": 8500,
    "avgReadingTime": 180,
    "totalLikes": 450,
    "totalShares": 120,
    "totalComments": 300,
    "bounceRate": 35.5
  },
  "topArticles": [...],
  "deviceStats": [...],
  "eventTypeStats": [...],
  "categoryStats": [...],
  "viewTrend": [...],
  "period": {
    "from": "2025-06-11T00:00:00Z",
    "to": "2025-07-11T23:59:59Z",
    "period": "30d"
  }
}
```

#### 2. تحليلات مقال معين
```typescript
GET /api/analytics/article/[id]/details
```

**المعاملات:**
- `id`: معرف المقال
- `period`: الفترة الزمنية
- `from`, `to`: فترة مخصصة

**الاستجابة:**
```json
{
  "article": {
    "id": "123",
    "title": "عنوان المقال",
    "category": "تقنية",
    "author": "الكاتب"
  },
  "analytics": {
    "summary": {
      "views": 1200,
      "uniqueViews": 800,
      "sessions": 600,
      "avgReadingTime": 240,
      "engagementRate": 12.5,
      "bounceRate": 40.2
    },
    "trends": {
      "hourlyViews": [...],
      "dailyTrend": [...]
    },
    "demographics": {
      "devices": [...],
      "referrers": [...],
      "locations": [...]
    }
  }
}
```

#### 3. تصدير البيانات
```typescript
GET /api/analytics/export
```

**المعاملات:**
- `format`: نوع الملف (csv, json, excel)
- `type`: نوع البيانات (articles, users, events, summary)
- `period`: الفترة الزمنية
- `category_id`: فلتر التصنيف

**الاستجابة:**
ملف للتحميل بالصيغة المطلوبة

---

## 🎨 المكونات

### 1. لوحة التحليلات الرئيسية
```typescript
// components/analytics/AnalyticsDashboard.tsx
<AnalyticsDashboard 
  initialPeriod="30d"
  categoryId="category-id" // اختياري
  showExportOptions={true}
/>
```

**الميزات:**
- رسوم بيانية تفاعلية باستخدام Recharts
- تبديل بين فترات زمنية مختلفة
- تصدير البيانات بصيغ متعددة
- عرض الإحصائيات السريعة
- توزيع حسب الأجهزة والتصنيفات

### 2. صفحة التحليلات الإدارية
```typescript
// src/app/admin/analytics/page.tsx
```

**المسار:** `/admin/analytics`

**الوصول:** المديرون فقط

**الميزات:**
- واجهة شاملة للإدارة
- روابط سريعة للتقارير المتقدمة
- إحصائيات سريعة
- أزرار إجراءات مخصصة

---

## 📊 أنواع التحليلات

### 1. تحليلات المحتوى
- **المشاهدات**: إجمالي وفريدة
- **وقت القراءة**: متوسط ومدى
- **معدل الارتداد**: نسبة المغادرة السريعة
- **عمق التمرير**: مقدار قراءة المحتوى
- **التفاعل**: إعجابات، مشاركات، تعليقات

### 2. تحليلات المستخدمين
- **المستخدمون النشطون**: يومي وأسبوعي وشهري
- **الجلسات**: المدة ونوع الجهاز
- **المسارات**: رحلة المستخدم في الموقع
- **التحويل**: معدلات الاشتراك والتفاعل

### 3. تحليلات التقنية
- **الأجهزة**: موبايل، ديسكتوب، تابلت
- **المتصفحات**: أنواع وإصدارات
- **المواقع الجغرافية**: البلدان والمدن
- **مصادر الزيارات**: مباشر، بحث، مواقع أخرى

### 4. تحليلات الأداء
- **سرعة التحميل**: أوقات الاستجابة
- **الأخطاء**: معدلات ونوعية الأخطاء
- **الموثوقية**: نسبة الجهوزية
- **تحسين محركات البحث**: تقييم SEO

---

## 🔧 الإعداد والتثبيت

### 1. متطلبات النظام
```json
{
  "node": ">=18.0.0",
  "npm": ">=9.0.0",
  "postgresql": ">=13.0",
  "redis": ">=6.0" // للتخزين المؤقت
}
```

### 2. التبعيات المطلوبة
```bash
npm install recharts zod @prisma/client
```

### 3. إعداد قاعدة البيانات
```bash
# تطبيق المخطط
npx prisma db push

# إنشاء العميل
npx prisma generate
```

### 4. متغيرات البيئة
```env
# قاعدة البيانات
DATABASE_URL="postgresql://user:password@localhost:5432/sabq"

# التحليلات
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=365
ANALYTICS_BATCH_SIZE=1000

# التصدير
EXPORT_MAX_RECORDS=50000
EXPORT_RATE_LIMIT=10 # طلبات في الدقيقة
```

---

## 📈 الرسوم البيانية

### 1. الخط الزمني (Line Chart)
```typescript
<LineChart data={viewTrend}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="views" stroke="#3b82f6" />
</LineChart>
```

**الاستخدام:** اتجاهات المشاهدات، النمو عبر الزمن

### 2. الأعمدة (Bar Chart)
```typescript
<BarChart data={topArticles}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="title" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="views" fill="#3b82f6" />
</BarChart>
```

**الاستخدام:** مقارنة المقالات، الإحصائيات النسبية

### 3. الدائري (Pie Chart)
```typescript
<PieChart>
  <Pie
    data={deviceStats}
    dataKey="count"
    nameKey="device"
    cx="50%"
    cy="50%"
    outerRadius={80}
    fill="#8884d8"
    label
  />
  <Tooltip />
</PieChart>
```

**الاستخدام:** توزيع الأجهزة، التصنيفات

### 4. المساحة (Area Chart)
```typescript
<AreaChart data={engagementTrend}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="engagement" stroke="#10b981" fill="#10b981" />
</AreaChart>
```

**الاستخدام:** معدلات التفاعل، الاتجاهات التراكمية

---

## 📤 تصدير البيانات

### 1. CSV
```javascript
// تحويل البيانات إلى CSV
function convertToCSV(data, headers) {
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"` 
        : value || '';
    });
    csvRows.push(values.join(','));
  }
  
  return '\uFEFF' + csvRows.join('\n'); // BOM للدعم العربي
}
```

### 2. JSON
```javascript
// تصدير JSON مع metadata
const exportData = {
  metadata: {
    exportType: 'articles',
    period: { from: '2025-06-11', to: '2025-07-11' },
    totalRecords: data.length,
    exportedAt: new Date().toISOString()
  },
  data: data
};
```

### 3. Excel (مستقبلي)
```javascript
// باستخدام مكتبة xlsx
import * as XLSX from 'xlsx';

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Analytics');
```

---

## 🔒 الأمان والخصوصية

### 1. إخفاء الهوية
```typescript
// تشفير معرفات المستخدمين في التصدير
const anonymizeUser = (userId: string) => {
  return crypto.createHash('sha256')
    .update(userId + SALT)
    .digest('hex')
    .substring(0, 8);
};
```

### 2. تسجيل العمليات
```typescript
// Audit Log لعمليات التصدير
await prisma.auditLog.create({
  data: {
    user_id: currentUser.id,
    action: 'data_export',
    resource: 'analytics',
    details: {
      exportType: 'articles',
      format: 'csv',
      recordCount: data.length
    }
  }
});
```

### 3. التحكم في الوصول
```typescript
// فحص الصلاحيات
const checkPermission = (user: User, action: string) => {
  const permissions = {
    'view_analytics': ['admin', 'editor'],
    'export_data': ['admin'],
    'view_user_data': ['admin']
  };
  
  return permissions[action]?.includes(user.role);
};
```

### 4. حماية البيانات الحساسة
- عدم تصدير عناوين IP مباشرة
- تشفير معرفات المستخدمين
- إزالة البيانات الشخصية من التقارير العامة
- تطبيق فترات انتهاء للبيانات

---

## ⚡ تحسين الأداء

### 1. التخزين المؤقت
```typescript
// Redis للتخزين المؤقت
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const getCachedAnalytics = async (key: string) => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

const setCachedAnalytics = async (key: string, data: any, ttl = 300) => {
  await redis.setex(key, ttl, JSON.stringify(data));
};
```

### 2. تجميع البيانات
```sql
-- إنشاء جداول مجمعة يومية
CREATE TABLE daily_analytics_summary AS
SELECT 
  DATE(created_at) as date,
  article_id,
  COUNT(*) FILTER (WHERE event_type = 'view') as daily_views,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(value) FILTER (WHERE event_type = 'reading_time') as avg_reading_time
FROM article_analytics_events
GROUP BY DATE(created_at), article_id;
```

### 3. الفهرسة الذكية
```sql
-- فهارس مركبة للاستعلامات الشائعة
CREATE INDEX idx_analytics_summary ON article_analytics_events 
(event_type, created_at, article_id) 
WHERE event_type IN ('view', 'like', 'share');

-- فهرس جزئي للتواريخ الحديثة
CREATE INDEX idx_analytics_recent ON article_analytics_events (created_at) 
WHERE created_at > NOW() - INTERVAL '90 days';
```

### 4. تحسين الاستعلامات
```typescript
// استخدام المعاملات المحضرة
const getArticleStats = await prisma.$queryRaw`
  SELECT 
    article_id,
    COUNT(*) as views,
    COUNT(DISTINCT user_id) as unique_views
  FROM article_analytics_events 
  WHERE event_type = 'view' 
    AND created_at >= ${fromDate} 
    AND created_at <= ${toDate}
  GROUP BY article_id
  ORDER BY views DESC
  LIMIT 50
`;
```

---

## 📊 أمثلة الاستخدام

### 1. عرض إحصائيات مقال
```typescript
const ArticleStats = ({ articleId }: { articleId: string }) => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch(`/api/analytics/article/${articleId}/details?period=7d`)
      .then(res => res.json())
      .then(setStats);
  }, [articleId]);
  
  if (!stats) return <div>جاري التحميل...</div>;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="المشاهدات" value={stats.analytics.summary.views} />
      <StatCard title="المشاهدات الفريدة" value={stats.analytics.summary.uniqueViews} />
      <StatCard title="متوسط وقت القراءة" value={`${stats.analytics.summary.avgReadingTime}ث`} />
      <StatCard title="معدل التفاعل" value={`${stats.analytics.summary.engagementRate}%`} />
    </div>
  );
};
```

### 2. تصدير تقرير مخصص
```typescript
const exportCustomReport = async () => {
  const params = new URLSearchParams({
    type: 'articles',
    format: 'csv',
    period: '30d',
    category_id: selectedCategory
  });
  
  const response = await fetch(`/api/analytics/export?${params}`);
  const blob = await response.blob();
  
  // تحميل الملف
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

### 3. مراقبة الأداء المباشر
```typescript
const RealtimeMonitor = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  
  useEffect(() => {
    const fetchRealtime = async () => {
      const response = await fetch('/api/analytics/realtime');
      const data = await response.json();
      setActiveUsers(data.activeUsers);
    };
    
    // تحديث كل 30 ثانية
    const interval = setInterval(fetchRealtime, 30000);
    fetchRealtime();
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-green-100 p-4 rounded-lg">
      <h3 className="font-semibold">المستخدمون النشطون</h3>
      <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
      <p className="text-sm text-gray-600">آخر 15 دقيقة</p>
    </div>
  );
};
```

---

## 🔍 التشخيص واستكشاف الأخطاء

### 1. مراقبة الأداء
```typescript
// إضافة مراقبة أوقات الاستجابة
const performanceLog = async (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  
  if (duration > 5000) { // أكثر من 5 ثوان
    console.warn(`Slow analytics query: ${operation} took ${duration}ms`);
    
    // إرسال تنبيه
    await notifySlowQuery(operation, duration);
  }
};
```

### 2. فحص صحة البيانات
```sql
-- التحقق من اكتمال البيانات
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT article_id) as unique_articles,
  COUNT(DISTINCT user_id) as unique_users
FROM article_analytics_events 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 3. تسجيل الأخطاء
```typescript
// تسجيل مفصل للأخطاء
const logAnalyticsError = async (error: Error, context: any) => {
  await prisma.auditLog.create({
    data: {
      action: 'analytics_error',
      success: false,
      error_message: error.message,
      details: {
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      }
    }
  });
};
```

---

## 📋 قائمة التحقق

### ✅ الميزات المنجزة
- [x] قاعدة بيانات التحليلات
- [x] APIs للإحصائيات العامة
- [x] APIs لتفاصيل المقالات
- [x] نظام تصدير البيانات (CSV, JSON)
- [x] مكونات الواجهة التفاعلية
- [x] رسوم بيانية متقدمة
- [x] صفحة لوحة التحليلات الإدارية
- [x] حماية الخصوصية وإخفاء الهوية
- [x] تسجيل عمليات التصدير
- [x] فلترة حسب الفترة والتصنيف

### 🔄 التطوير المستقبلي
- [ ] تحليلات مباشرة (Real-time)
- [ ] تقارير مجدولة
- [ ] تكامل مع Google Analytics
- [ ] تصدير Excel المتقدم
- [ ] إشعارات الاتجاهات
- [ ] API للتكاملات الخارجية
- [ ] لوحة تحكم للمحررين
- [ ] تحليلات الذكاء الاصطناعي

---

## 🚀 النشر والإنتاج

### 1. متطلبات الخادم
```yaml
# docker-compose.analytics.yml
version: '3.8'
services:
  analytics-db:
    image: postgres:15
    environment:
      POSTGRES_DB: sabq_analytics
      POSTGRES_USER: analytics_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - analytics_data:/var/lib/postgresql/data
  
  redis-cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 2. مراقبة الإنتاج
```typescript
// تسجيل مقاييس الأداء
const trackMetrics = {
  queryTime: (duration: number) => {
    // إرسال إلى نظام المراقبة
    metrics.histogram('analytics.query.duration', duration);
  },
  
  exportCount: (type: string) => {
    metrics.counter('analytics.export.count', { type });
  },
  
  errorRate: (error: string) => {
    metrics.counter('analytics.errors', { error });
  }
};
```

### 3. نسخ احتياطية
```bash
#!/bin/bash
# backup-analytics.sh

# نسخ احتياطي يومي للتحليلات
pg_dump $DATABASE_URL \
  --table=article_analytics_events \
  --table=content_analytics \
  --table=user_behaviors > "analytics_backup_$(date +%Y%m%d).sql"

# ضغط وتحميل للتخزين السحابي
gzip analytics_backup_*.sql
aws s3 cp analytics_backup_*.sql.gz s3://sabq-backups/analytics/
```

---

## 📞 الدعم والمساعدة

### 🐛 الإبلاغ عن مشاكل
- **GitHub Issues**: [رابط المستودع](https://github.com/sabq4org/sabq-ai-cms)
- **البريد الإلكتروني**: support@sabq.ai
- **التوثيق**: [docs.sabq.ai](https://docs.sabq.ai)

### 💡 طلب ميزات جديدة
- افتح طلب feature في GitHub
- اشرح حالة الاستخدام بالتفصيل
- قدم أمثلة أو نماذج أولية

### 🔧 المساهمة
```bash
# استنساخ المشروع
git clone https://github.com/sabq4org/sabq-ai-cms.git

# إنشاء فرع جديد
git checkout -b feature/analytics-enhancement

# تطبيق التغييرات والاختبار
npm test

# إرسال طلب دمج
git push origin feature/analytics-enhancement
```

---

**📝 ملاحظة:** هذا التوثيق محدث باستمرار. تأكد من مراجعة أحدث إصدار في مستودع المشروع.

**🏷️ العلامات:** `analytics` `dashboard` `reporting` `data-export` `charts` `privacy` `performance` 