# تقرير تطوير نظام الجرعات اليومية

## نظرة عامة
تم تطوير نظام شامل للجرعات اليومية في صحيفة سبق، يقدم محتوى مختار بعناية للقراء حسب فترات اليوم المختلفة.

## المكونات المطورة

### 1. نموذج قاعدة البيانات (Prisma Schema)
تم إضافة نموذجين جديدين:

#### DailyDose Model
```prisma
model DailyDose {
  id             String         @id @default(uuid())
  period         DosePeriod     // morning, afternoon, evening, night
  title          String         @db.VarChar(500)
  subtitle       String         @db.VarChar(500)
  date           DateTime       @db.Date
  status         DoseStatus     @default(draft)
  publishedAt    DateTime?      @map("published_at")
  views          Int            @default(0)
  metadata       Json?
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  contents       DoseContent[]
}
```

#### DoseContent Model
```prisma
model DoseContent {
  id            String          @id @default(uuid())
  doseId        String          @map("dose_id")
  articleId     String?         @map("article_id")
  contentType   DoseContentType // article, weather, quote, tip, audio, analysis
  title         String          @db.VarChar(500)
  summary       String          @db.Text
  audioUrl      String?         @map("audio_url")
  imageUrl      String?         @map("image_url")
  displayOrder  Int             @default(0)
  metadata      Json?
}
```

### 2. API Endpoints

#### GET /api/daily-doses
- جلب الجرعة الحالية حسب الوقت
- دعم تحديد التاريخ والفترة
- توليد تلقائي للجرعة إذا لم تكن موجودة
- تحليل المحتوى بالذكاء الاصطناعي

#### POST /api/daily-doses
- إنشاء جرعة جديدة يدوياً
- دعم إضافة محتويات متعددة

### 3. المكونات الأمامية

#### SmartDigestBlock Component
- عرض 3 بطاقات من محتوى الجرعة الحالية
- تصميم ديناميكي يتغير حسب الفترة
- دعم الوضع الليلي
- أيقونات وألوان مخصصة لكل فترة

#### صفحة تفاصيل الجرعة (/daily-dose)
- عرض جميع محتويات الجرعة
- تفاعلات المستخدم (إعجاب، حفظ، مشاركة)
- التنقل بين الفترات المختلفة
- مشغل صوتي للمحتوى الصوتي

#### لوحة تحكم الجرعات (/dashboard/daily-doses)
- إدارة شاملة للجرعات
- توليد بالذكاء الاصطناعي
- محرر محتوى متقدم
- إعادة ترتيب المحتويات

## الميزات الرئيسية

### 1. تقسيم الفترات الزمنية
- **الصباح**: 6:00 ص - 11:00 ص
- **الظهيرة**: 11:00 ص - 4:00 م
- **المساء**: 4:00 م - 7:00 م
- **الليل**: 7:00 م - 2:00 ص

### 2. أنواع المحتوى المدعومة
- **مقالات**: من المحتوى المنشور
- **طقس**: معلومات الطقس اليومية
- **اقتباسات**: اقتباسات ملهمة
- **نصائح**: نصائح يومية مفيدة
- **صوتيات**: محتوى صوتي
- **تحليلات**: تحليلات معمقة

### 3. العبارات الديناميكية
كل فترة لها 3 عبارات مختلفة يتم اختيارها عشوائياً:

#### الصباح
- "ابدأ صباحك بالمفيد والمُلهم"
- "أخبارك قبل القهوة"
- "موجز الصباح الذكي"

#### الظهيرة
- "وقتك مهم… هذه خلاصة الظهيرة"
- "منتصف اليوم… جرعة مركزة"
- "نظرة وسط اليوم"

#### المساء
- "مساؤك يبدأ بالوعي"
- "موجز المساء الأهم"
- "جرعة ما قبل الزحام"

#### الليل
- "ختام يومك… باختصار تستحقه"
- "قبل أن تنام… اطلع على الأهم"
- "تلخيص اليوم كما يجب أن يكون"

## التكامل مع الذكاء الاصطناعي

### تحليل المحتوى
- اختيار أهم 3 مقالات مناسبة للفترة
- كتابة ملخصات جذابة
- تحديد نوع المحتوى المناسب

### معايير الاختيار
- **الصباح**: مقالات مهمة وتحليلية
- **الظهيرة**: مقالات سريعة ومتنوعة
- **المساء**: مقالات خفيفة وترفيهية
- **الليل**: ملخصات وتحليلات اليوم

## التصميم والواجهات

### الألوان حسب الفترة
- **الصباح**: أزرق وسماوي
- **الظهيرة**: برتقالي وأصفر
- **المساء**: بنفسجي ووردي
- **الليل**: نيلي وأزرق داكن

### الأيقونات
- استخدام أيقونات Lucide React
- أيقونات مخصصة لكل فترة ونوع محتوى

## قاعدة البيانات

### SQL Migration
```sql
CREATE TABLE IF NOT EXISTS `daily_doses` (
  `id` VARCHAR(191) NOT NULL,
  `period` ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `subtitle` VARCHAR(500) NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('draft', 'published', 'scheduled', 'archived') NOT NULL DEFAULT 'draft',
  `published_at` DATETIME(3) NULL,
  `views` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_doses_date_period_key` (`date`, `period`)
);

CREATE TABLE IF NOT EXISTS `dose_contents` (
  `id` VARCHAR(191) NOT NULL,
  `dose_id` VARCHAR(191) NOT NULL,
  `article_id` VARCHAR(191) NULL,
  `content_type` ENUM('article', 'weather', 'quote', 'tip', 'audio', 'analysis') NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `summary` TEXT NOT NULL,
  `audio_url` TEXT NULL,
  `image_url` TEXT NULL,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
);
```

## التحسينات المستقبلية

### 1. إشعارات تلقائية
- إرسال إشعارات في بداية كل فترة
- تذكير المستخدمين بالجرعة الجديدة

### 2. تخصيص المحتوى
- تحليل تفضيلات المستخدم
- اقتراح محتوى مخصص

### 3. تحليلات متقدمة
- تتبع معدل القراءة لكل جرعة
- تحليل أنماط التفاعل

### 4. دعم المحتوى الصوتي
- تحويل النص إلى كلام (TTS)
- بودكاست يومي تلقائي

### 5. تكامل مع وسائل التواصل
- مشاركة الجرعة على تويتر
- قصص انستغرام تلقائية

## الخلاصة
تم تطوير نظام متكامل للجرعات اليومية يوفر تجربة مستخدم متميزة ومحتوى مخصص حسب وقت اليوم. النظام يستخدم أحدث التقنيات ويدعم التكامل مع الذكاء الاصطناعي لتوفير أفضل محتوى للقراء. 