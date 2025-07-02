# تقرير ربط جميع البيانات بقاعدة بيانات PlanetScale

## 🎯 الهدف
ربط المشروع بقاعدة بيانات PlanetScale لحفظ جميع البيانات الأساسية بشكل دائم.

## ✅ ما تم إنجازه

### 1. إضافة الجداول الجديدة في Prisma Schema

#### أ. جدول الإشارات المرجعية (Bookmarks)
```prisma
model Bookmark {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  itemId     String   @map("item_id")
  itemType   String   @map("item_type")
  createdAt  DateTime @default(now()) @map("created_at")
  metadata   Json?
  user       User     @relation(...)
  
  @@unique([userId, itemId, itemType])
  @@map("bookmarks")
}
```

#### ب. جدول سلوك المستخدم (UserBehavior)
```prisma
model UserBehavior {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  sessionId String?  @map("session_id")
  action    String
  page      String?
  element   String?
  value     String?
  metadata  Json?
  ipAddress String?  @db.VarChar(45)
  userAgent String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  user      User?    @relation(...)
  
  @@map("user_behavior")
}
```

#### ج. جدول الانطباعات (Impressions)
```prisma
model Impression {
  id             String   @id @default(uuid())
  userId         String?  @map("user_id")
  contentId      String   @map("content_id")
  contentType    String   @map("content_type")
  impressionType String   @map("impression_type")
  duration       Int?
  scrollDepth    Int?     @map("scroll_depth")
  metadata       Json?
  createdAt      DateTime @default(now()) @map("created_at")
  user           User?    @relation(...)
  
  @@map("impressions")
}
```

#### د. جدول اهتمامات المستخدم (UserInterest)
```prisma
model UserInterest {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  interest   String
  score      Float    @default(1.0)
  source     String?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  user       User     @relation(...)
  
  @@unique([userId, interest])
  @@map("user_interests")
}
```

#### هـ. جداول الوسوم (Tags)
```prisma
model Tag {
  id        String       @id @default(uuid())
  name      String       @unique
  slug      String       @unique
  createdAt DateTime     @default(now()) @map("created_at")
  articles  ArticleTag[]
  
  @@map("tags")
}

model ArticleTag {
  id        String   @id @default(uuid())
  articleId String   @map("article_id")
  tagId     String   @map("tag_id")
  createdAt DateTime @default(now()) @map("created_at")
  article   Article  @relation(...)
  tag       Tag      @relation(...)
  
  @@unique([articleId, tagId])
  @@map("article_tags")
}
```

### 2. إنشاء APIs للتتبع

#### أ. API تتبع الانطباعات
- **المسار**: `/api/track/impression`
- **الوظائف**:
  - تسجيل مشاهدات المحتوى
  - تتبع مدة المشاهدة
  - قياس عمق التمرير
  - تحديث عدد المشاهدات للمقالات

#### ب. API تتبع السلوك
- **المسار**: `/api/track/behavior`
- **الوظائف**:
  - تسجيل جميع تفاعلات المستخدم
  - تتبع النقرات والتمرير والبحث
  - حفظ معلومات الجلسة
  - تحديث اهتمامات المستخدم تلقائياً

#### ج. API الإشارات المرجعية
- **المسار**: `/api/bookmarks`
- **الوظائف**:
  - حفظ/إلغاء حفظ المحتوى
  - جلب المحتوى المحفوظ
  - دعم أنواع محتوى متعددة

#### د. API الاهتمامات
- **المسار**: `/api/user/interests`
- **الوظائف**:
  - إدارة اهتمامات المستخدم
  - تحديث الدرجات
  - ربط الاهتمامات بالفئات

### 3. إنشاء Hook للتتبع الشامل

#### `useTracking` Hook
يوفر وظائف شاملة للتتبع:

```typescript
const {
  trackImpression,    // تتبع المشاهدات
  trackBehavior,      // تتبع السلوك
  trackLike,          // تتبع الإعجابات
  trackBookmark,      // تتبع الحفظ
  trackShare,         // تتبع المشاركة
  trackSearch,        // تتبع البحث
  trackScroll,        // تتبع التمرير
  trackReadingTime,   // تتبع وقت القراءة
  sessionId           // معرف الجلسة
} = useTracking();
```

#### ميزات إضافية:
- `useImpressionTracking`: تتبع تلقائي عند ظهور العنصر
- `useReadingTimeTracking`: قياس وقت القراءة

### 4. البيانات المحفوظة في PlanetScale

#### أ. بيانات المستخدمين
- التسجيل والمصادقة
- الملفات الشخصية
- الأدوار والصلاحيات

#### ب. المحتوى
- المقالات والأخبار
- الفئات والوسوم
- الوسائط والصور

#### ج. التفاعلات
- الإعجابات (likes)
- الحفظ (bookmarks)
- التعليقات
- المشاركات

#### د. التتبع والتحليلات
- الانطباعات والمشاهدات
- سلوك المستخدم
- أوقات القراءة
- معدلات التمرير

#### هـ. التخصيص
- التفضيلات
- الاهتمامات
- نقاط الولاء
- سجل النشاطات

### 5. الأمان والأداء

#### أ. الأمان
- استخدام SSL للاتصال
- متغيرات البيئة للبيانات الحساسة
- التحقق من صحة البيانات
- تسجيل الأنشطة

#### ب. الأداء
- فهارس على الحقول المهمة
- علاقات محسّنة
- استعلامات مُحسّنة
- تخزين مؤقت للجلسات

## 📊 مثال الاستخدام

### في مكون React:
```typescript
import { useTracking } from '@/hooks/useTracking';

function ArticleCard({ article }) {
  const { trackImpression, trackBehavior, trackBookmark } = useTracking();
  
  // تتبع المشاهدة
  useEffect(() => {
    trackImpression(article.id, 'article', 'view');
  }, []);
  
  // تتبع النقر
  const handleClick = () => {
    trackBehavior('click', 'article-card', article.id);
  };
  
  // تتبع الحفظ
  const handleBookmark = async () => {
    const result = await trackBookmark(article.id);
    // تحديث UI بناءً على النتيجة
  };
  
  return (
    <div onClick={handleClick}>
      {/* محتوى البطاقة */}
      <button onClick={handleBookmark}>حفظ</button>
    </div>
  );
}
```

## 🔧 الصيانة والمراقبة

### 1. مراقبة قاعدة البيانات
- استخدم PlanetScale Dashboard
- راقب حجم البيانات
- تحقق من أداء الاستعلامات

### 2. تنظيف البيانات
- حذف البيانات القديمة دورياً
- أرشفة السجلات القديمة
- تحسين الفهارس حسب الحاجة

### 3. النسخ الاحتياطي
- استخدم ميزة branching في PlanetScale
- احتفظ بنسخ احتياطية دورية
- اختبر استعادة البيانات

## ✅ الخلاصة

تم بنجاح:
1. ✅ إضافة جميع الجداول المطلوبة
2. ✅ إنشاء APIs شاملة للتتبع
3. ✅ توفير أدوات سهلة للمطورين
4. ✅ ضمان حفظ جميع البيانات في PlanetScale
5. ✅ تطبيق أفضل ممارسات الأمان والأداء

**المشروع الآن يحفظ جميع البيانات بشكل دائم في قاعدة بيانات PlanetScale!** 🎉 