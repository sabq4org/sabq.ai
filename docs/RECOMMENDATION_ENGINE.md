# نظام التوصيات الذكية - Sabq AI CMS

## نظرة عامة

نظام التوصيات الذكية في Sabq AI CMS هو نظام متقدم يستخدم خوارزميات متعددة لتقديم توصيات شخصية ودقيقة للمستخدمين. يدعم النظام المستخدمين المسجلين والزوار مع احترام كامل لسياسة الخصوصية.

## الميزات الأساسية

### 🎯 خوارزميات متعددة
- **شخصية (Personal)**: بناءً على اهتمامات وسلوك المستخدم
- **تعاونية (Collaborative)**: مستخدمون مشابهون أعجبهم المحتوى
- **شبكية (Graph-based)**: تحليل شبكة التفاعلات المعقدة
- **شائعة (Trending)**: المحتوى الأكثر شعبية حالياً
- **ذكية (AI)**: ذكاء اصطناعي متقدم
- **مختلطة (Mixed)**: مزيج من جميع الخوارزميات

### 🔍 توصيات قابلة للشرح
- سبب واضح لكل توصية
- شفافية في عملية اتخاذ القرار
- معلومات سياقية إضافية

### 🎛️ تخصيص متقدم
- فلترة حسب الفئات
- تحكم في عوامل التنوع والحداثة
- إعدادات مسبقة (متوازن، متنوع، حديث)
- فلترة حسب وقت القراءة

### 📊 تتبع الأداء
- إحصائيات مفصلة لكل خوارزمية
- معدل النقر والرضا
- تحليل تقييمات المستخدمين

## البنية التقنية

### قاعدة البيانات

```prisma
// سجل التوصيات
model RecommendationLog {
  id                  String   @id @default(uuid())
  user_id             String?
  session_id          String?
  article_id          String
  algorithm_type      String
  reason_type         String
  reason_explanation  String
  score               Float?
  shown               Boolean  @default(false)
  clicked             Boolean  @default(false)
  feedback            String?
  context_data        Json?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
}

// ملف اهتمامات المستخدم
model UserInterestProfile {
  id                  String   @id @default(uuid())
  user_id             String   @unique
  interests           Json
  categories          Json
  reading_patterns    Json
  behavioral_signals  Json
  last_updated        DateTime @default(now())
}

// إحصائيات الأداء
model RecommendationMetrics {
  id                  String   @id @default(uuid())
  algorithm_type      String
  total_shown         Int      @default(0)
  total_clicked       Int      @default(0)
  total_liked         Int      @default(0)
  total_disliked      Int      @default(0)
  click_through_rate  Float    @default(0.0)
  satisfaction_rate   Float    @default(0.0)
  date                DateTime @default(now())
}
```

### APIs الرئيسية

#### 1. جلب التوصيات
```typescript
GET /api/recommendations?userId=&type=&limit=&category=

// مثال
GET /api/recommendations?userId=123&type=personal&limit=10&category=tech
```

**المعاملات:**
- `userId` (اختياري): معرف المستخدم
- `sessionId` (اختياري): معرف الجلسة للزوار
- `type`: نوع الخوارزمية (personal, collaborative, graph, trending, ai, mixed)
- `limit`: عدد النتائج (1-50)
- `category` (اختياري): فلتر الفئة
- `exclude` (اختياري): مقالات مستبعدة

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "article": {
          "id": "article-id",
          "title": "عنوان المقال",
          "slug": "article-slug",
          "summary": "ملخص المقال",
          "featured_image": "رابط الصورة",
          "category_id": "فئة المقال",
          "published_at": "2024-01-01T00:00:00Z",
          "view_count": 1500,
          "like_count": 50,
          "reading_time": 5,
          "tags": ["تقنية", "ذكاء اصطناعي"]
        },
        "score": 0.85,
        "reason_type": "interest",
        "reason_explanation": "بناءً على اهتمامك بالتقنية",
        "algorithm_type": "personal",
        "context_data": {
          "categoryInterest": 0.8,
          "keywordScore": 0.7
        }
      }
    ],
    "metadata": {
      "algorithm": "personal",
      "count": 10,
      "userId": "123",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### 2. توصيات مخصصة متقدمة
```typescript
POST /api/recommendations
Content-Type: application/json

{
  "userId": "123",
  "algorithms": ["personal", "collaborative"],
  "limit": 20,
  "filters": {
    "category": "tech",
    "excludeIds": ["article1", "article2"]
  },
  "diversityFactor": 0.5,
  "freshnessFactor": 0.3
}
```

#### 3. تسجيل التقييم
```typescript
POST /api/recommendations/feedback
Content-Type: application/json

{
  "userId": "123",
  "articleId": "article-id",
  "feedback": "like", // like, dislike, not_interested, already_read, clicked, shared
  "context": {
    "algorithm": "personal",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### 4. إحصائيات التقييمات
```typescript
GET /api/recommendations/feedback?userId=123&days=30&algorithm=personal
```

## استخدام المكونات

### 1. مكون التوصيات الأساسي
```tsx
import RecommendationFeed from '@/components/recommendation/RecommendationFeed';

<RecommendationFeed
  userId="user-id"
  sessionId="session-id"
  limit={10}
  categoryFilter="tech"
  showAlgorithmSelector={true}
  showFilters={true}
  autoRefresh={false}
/>
```

### 2. مكون الفلاتر المتقدمة
```tsx
import RecommendationFilters from '@/components/recommendation/RecommendationFilters';

<RecommendationFilters
  onFiltersChange={(filters) => console.log(filters)}
  initialFilters={{
    categories: ['tech', 'sports'],
    algorithms: ['personal', 'collaborative'],
    diversityFactor: 0.3
  }}
  showAdvanced={true}
/>
```

### 3. مكون التوصيات المتعددة
```tsx
import MultiRecommendationFeeds from '@/components/recommendation/MultiRecommendationFeeds';

<MultiRecommendationFeeds
  userId="user-id"
  sessionId="session-id"
  showTabs={true}
  defaultTab="personal"
/>
```

## الخوارزميات بالتفصيل

### 1. التوصيات الشخصية (Personal)

تعتمد على تحليل:
- **الاهتمامات**: من الكلمات المفتاحية والفئات
- **السلوك**: وقت القراءة، التفاعل، التكرار
- **التفضيلات**: الأوقات المفضلة، الأجهزة، طول المحتوى

```typescript
// مثال على حساب النقاط
const score = 
  categoryInterest * 0.4 +
  keywordScore * 0.3 +
  recencyScore * 0.2 +
  popularityScore * 0.1;
```

### 2. التوصيات التعاونية (Collaborative Filtering)

#### أ. مبنية على المستخدمين (User-based)
1. العثور على مستخدمين مشابهين
2. حساب التشابه باستخدام Jaccard و Cosine Similarity
3. اقتراح ما أعجب المستخدمين المشابهين

#### ب. مبنية على المقالات (Item-based)
1. تحليل المقالات التي تفاعل معها المستخدم
2. العثور على مقالات مشابهة
3. اقتراح المقالات بناءً على التشابه

```typescript
// حساب التشابه
const jaccardSimilarity = intersection.size / union.size;
const cosineSimilarity = intersection.size / 
  Math.sqrt(setA.size * setB.size);
const finalSimilarity = (jaccardSimilarity + cosineSimilarity) / 2;
```

### 3. التوصيات الشبكية (Graph-based)

تبني رسماً بيانياً من:
- **العقد**: المستخدمين والمقالات
- **الروابط**: التفاعلات (إعجاب، مشاركة، تعليق)
- **المسارات**: اكتشاف علاقات غير مباشرة

```typescript
// مثال على مسار
المستخدم أ → المقال 1 → المستخدم ب → المقال 2
// يقترح المقال 2 للمستخدم أ
```

### 4. التوصيات الشائعة (Trending)

تعتمد على:
- **المشاهدات**: عدد المشاهدات الحديثة
- **التفاعل**: الإعجابات والمشاركات
- **الحداثة**: المقالات المنشورة حديثاً
- **معدل النمو**: سرعة انتشار المحتوى

### 5. تكامل الذكاء الاصطناعي

يستخدم خدمة ML خارجية لـ:
- **تحليل المحتوى**: استخراج المواضيع والمشاعر
- **التنبؤ**: توقع اهتمام المستخدم
- **التحسين**: تعلم من التقييمات
- **التخصيص**: توصيات دقيقة جداً

## التكوين والإعدادات

### متغيرات البيئة
```env
# خدمة الذكاء الاصطناعي
AI_SERVICE_URL=http://localhost:8000
AI_API_KEY=your-api-key

# إعدادات التوصيات
RECOMMENDATION_CACHE_TTL=900000  # 15 دقيقة
RECOMMENDATION_MAX_LIMIT=50
RECOMMENDATION_DEFAULT_ALGORITHM=mixed

# إعدادات الأداء
RECOMMENDATION_BATCH_SIZE=100
RECOMMENDATION_TIMEOUT=15000
```

### إعدادات الخوارزميات
```typescript
const algorithmWeights = {
  personal: 0.4,      // 40% توصيات شخصية
  collaborative: 0.3, // 30% تعاونية
  trending: 0.2,      // 20% شائعة
  graph: 0.1          // 10% شبكية
};

const diversitySettings = {
  balanced: { diversity: 0.3, freshness: 0.2 },
  diverse: { diversity: 0.7, freshness: 0.1 },
  fresh: { diversity: 0.1, freshness: 0.8 }
};
```

## الأمان والخصوصية

### حماية البيانات
- **تشفير**: جميع البيانات الحساسة مشفرة
- **إخفاء الهوية**: دعم التوصيات للزوار دون تتبع
- **حذف البيانات**: امتثال GDPR مع إمكانية حذف جميع البيانات

### التحقق من الصحة
```typescript
// التحقق من المعاملات
if (limit < 1 || limit > 50) {
  throw new Error('Limit must be between 1 and 50');
}

// منع حقن SQL
const userId = sanitizeInput(request.userId);

// تحديد معدل الطلبات
await checkRateLimit(request, 'recommendations');
```

### الصلاحيات
- **القراءة**: جميع المستخدمين
- **التقييم**: المستخدمون المسجلون والزوار
- **الإدارة**: المديرون فقط
- **الإحصائيات**: المحررون والمديرون

## مراقبة الأداء

### المقاييس الأساسية
- **معدل النقر (CTR)**: نسبة النقر على التوصيات
- **معدل الرضا**: نسبة التقييمات الإيجابية
- **وقت الاستجابة**: سرعة توليد التوصيات
- **دقة التوصيات**: مدى ملاءمة المحتوى

### التحليلات
```typescript
// إحصائيات يومية
const dailyStats = await recommendationEngine.getPerformanceMetrics();

// تحليل الخوارزميات
const algorithmComparison = dailyStats.map(stat => ({
  algorithm: stat.algorithm,
  ctr: (stat.clicked / stat.shown) * 100,
  satisfaction: (stat.liked / (stat.liked + stat.disliked)) * 100
}));
```

### التنبيهات
- انخفاض معدل النقر عن 2%
- زيادة التقييمات السلبية عن 20%
- بطء في الاستجابة أكثر من 3 ثوان
- أخطاء في خدمة الذكاء الاصطناعي

## التطوير والاختبار

### تشغيل الاختبارات
```bash
# اختبارات الوحدة
npm test recommendation

# اختبارات التكامل
npm run test:integration

# اختبارات الأداء
npm run test:performance

# تغطية الكود
npm run test:coverage
```

### اختبار الخوارزميات
```typescript
// اختبار التوصيات الشخصية
const recommendations = await recommendationEngine.getRecommendations({
  userId: 'test-user',
  algorithmType: 'personal',
  limit: 10
});

expect(recommendations).toHaveLength(10);
expect(recommendations[0]).toHaveProperty('score');
```

### بيانات التطوير
```bash
# إنشاء بيانات تجريبية
npm run seed:recommendations

# مسح البيانات
npm run clean:recommendations

# إعادة بناء الفهارس
npm run rebuild:similarity-matrix
```

## استكشاف الأخطاء

### مشاكل شائعة

#### 1. لا توجد توصيات
```typescript
// الأسباب المحتملة:
- المستخدم جديد (لا توجد بيانات سلوك)
- جميع المقالات مستبعدة
- خطأ في الخوارزمية

// الحلول:
- العودة للتوصيات الشائعة
- تقليل معايير الفلترة
- فحص سجلات الأخطاء
```

#### 2. بطء في الأداء
```typescript
// الأسباب:
- عدم وجود فهرسة مناسبة
- حجم البيانات كبير
- عدم استخدام الذاكرة المؤقتة

// الحلول:
- تحديث الفهارس
- تحسين الاستعلامات
- زيادة فترة الذاكرة المؤقتة
```

#### 3. دقة منخفضة
```typescript
// الأسباب:
- بيانات تدريب غير كافية
- عدم تحديث ملفات الاهتمامات
- خلل في الخوارزمية

// الحلول:
- جمع المزيد من التقييمات
- تحديث الأوزان
- إعادة تدريب النموذج
```

### سجلات التطوير
```typescript
// تفعيل السجلات المفصلة
process.env.LOG_LEVEL = 'debug';

// سجلات مخصصة
console.log('Recommendation request:', {
  userId,
  algorithm,
  filters,
  timestamp: new Date()
});
```

## خارطة الطريق

### الإصدارات القادمة

#### v2.1 - التحسينات الأساسية
- [ ] تحسين خوارزمية الرسم البياني
- [ ] دعم التوصيات الصوتية والمرئية
- [ ] تحليل المشاعر المتقدم
- [ ] واجهة إدارة محسنة

#### v2.2 - الذكاء الاصطناعي المتقدم
- [ ] نماذج تعلم عميق
- [ ] توصيات في الوقت الحقيقي
- [ ] تخصيص ديناميكي
- [ ] تحليل سلوك متطور

#### v2.3 - التوسع والأداء
- [ ] دعم ملايين المستخدمين
- [ ] توزيع الحمولة الذكي
- [ ] ذاكرة مؤقتة موزعة
- [ ] تحليلات متقدمة

### المساهمة

نرحب بالمساهمات! يرجى مراجعة [دليل المساهمة](../CONTRIBUTING.md) للتفاصيل.

### الدعم

- **التوثيق**: [docs.sabq.ai](https://docs.sabq.ai)
- **المجتمع**: [community.sabq.ai](https://community.sabq.ai)
- **الدعم التقني**: [support@sabq.ai](mailto:support@sabq.ai)

---

تم تطوير نظام التوصيات الذكية بواسطة فريق Sabq AI مع التركيز على الدقة والأداء والخصوصية. 