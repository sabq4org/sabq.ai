# مكتبة الوسائط الذكية - صحيفة سبق

## نظرة عامة
مكتبة وسائط متقدمة ومتكاملة لإدارة الصور والفيديوهات والمستندات في نظام إدارة محتوى صحيفة سبق، مع ميزات الذكاء الاصطناعي للبحث والاقتراحات الذكية.

## المميزات الرئيسية

### 1. إدارة شاملة للوسائط
- **أنواع الملفات المدعومة**:
  - الصور (JPG, PNG, GIF, WebP, SVG)
  - الفيديو (MP4, WebM, MOV)
  - المستندات (PDF, DOC, DOCX)
  - الصوت (MP3, WAV, OGG)

- **معلومات تفصيلية**:
  - العنوان والوصف
  - الوسوم والتصنيفات
  - المصدر (داخلي/وكالة/رسمي)
  - الأبعاد والحجم
  - معلومات الاستخدام

### 2. البحث الذكي بالذكاء الاصطناعي

#### كشف الشخصيات التلقائي
```javascript
// يتعرف النظام تلقائياً على:
- الملك سلمان بن عبدالعزيز
- ولي العهد الأمير محمد بن سلمان
- الوزراء والمسؤولين
- الأمراء والشخصيات البارزة
```

#### كشف المواضيع والمناسبات
```javascript
// يحلل النظام المحتوى ويكتشف:
- المؤتمرات والقمم
- الاحتفالات الوطنية
- المناسبات الدينية (رمضان، الحج)
- الأحداث الرياضية
- المؤسسات والجهات
```

### 3. الاقتراحات الذكية
عند إنشاء مقال جديد، يقترح النظام الصور المناسبة بناءً على:
- عنوان المقال
- محتوى المقال
- الكلمات المفتاحية
- السياق والموضوع

### 4. التصنيف الهرمي

```
شخصيات/
├── ملوك/
├── وزراء/
├── أمراء/
└── مسؤولون/

جهات/
├── وزارات/
├── هيئات حكومية/
├── مؤسسات خاصة/
└── جامعات/

أماكن/
├── مباني حكومية/
├── معالم سياحية/
├── قاعات مناسبات/
└── مساجد/

مناسبات/
├── مؤتمرات/
├── احتفالات وطنية/
├── رمضان/
├── الحج والعمرة/
└── اليوم الوطني/
```

## البنية التقنية

### قاعدة البيانات

#### جدول media_files
```sql
CREATE TABLE media_files (
  id VARCHAR(191) PRIMARY KEY,
  url TEXT NOT NULL,
  type ENUM('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tags JSON,
  classification VARCHAR(100),
  source VARCHAR(100),
  file_name VARCHAR(255),
  file_size INT,
  mime_type VARCHAR(100),
  width INT,
  height INT,
  duration INT,
  thumbnail_url TEXT,
  ai_entities JSON,
  ai_analysis JSON,
  uploaded_by VARCHAR(191),
  usage_count INT DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### جدول article_media
```sql
CREATE TABLE article_media (
  id VARCHAR(191) PRIMARY KEY,
  article_id VARCHAR(191),
  media_id VARCHAR(191),
  position VARCHAR(50), -- 'featured', 'content', 'gallery'
  order_index INT,
  caption TEXT,
  created_at DATETIME
);
```

#### جدول media_categories
```sql
CREATE TABLE media_categories (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  slug VARCHAR(100) UNIQUE,
  type VARCHAR(50), -- 'person', 'place', 'event', 'organization'
  icon VARCHAR(50),
  parent_id VARCHAR(191),
  created_at DATETIME
);
```

### API Endpoints

#### 1. جلب الوسائط
```http
GET /api/media
Query Parameters:
- page: رقم الصفحة
- limit: عدد النتائج
- type: نوع الملف (IMAGE, VIDEO, etc.)
- classification: التصنيف
- search: نص البحث
- articleId: معرف المقال
- unused: الملفات غير المستخدمة
- sortBy: الترتيب حسب
- sortOrder: اتجاه الترتيب
```

#### 2. رفع وسائط جديدة
```http
POST /api/media
Body: {
  url: string,
  type: MediaType,
  title: string,
  description?: string,
  tags?: string[],
  classification?: string,
  source?: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  categoryIds?: string[]
}
```

#### 3. البحث الذكي
```http
POST /api/media/search
Body: {
  title: string,      // عنوان المقال
  content?: string,   // محتوى المقال
  limit?: number      // عدد النتائج
}

Response: {
  suggestions: MediaFile[],
  searchCriteria: {
    keywords: string[],
    persons: string[],
    topics: string[]
  }
}
```

#### 4. تفاصيل ملف محدد
```http
GET /api/media/:id
```

#### 5. تحديث معلومات الملف
```http
PATCH /api/media/:id
Body: {
  title?: string,
  description?: string,
  tags?: string[],
  classification?: string,
  categoryIds?: string[]
}
```

#### 6. حذف ملف
```http
DELETE /api/media/:id
```

## واجهة المستخدم

### صفحة مكتبة الوسائط الرئيسية
- **المسار**: `/dashboard/media`
- **المميزات**:
  - عرض شبكي وقائمة
  - فلترة متقدمة
  - بحث فوري
  - معاينة سريعة
  - معلومات الاستخدام

### مكون اختيار الوسائط (MediaPicker)
```typescript
<MediaPicker
  onSelect={(media) => handleMediaSelect(media)}
  articleTitle="عنوان المقال"
  articleContent="محتوى المقال"
  allowedTypes={["IMAGE", "VIDEO"]}
  multiple={true}
/>
```

## التكامل مع محرر المقالات

### 1. إضافة صورة بارزة
```javascript
// في محرر المقال
const handleFeaturedImage = (media) => {
  setArticle({
    ...article,
    featuredImage: media.url,
    featuredImageId: media.id
  });
};
```

### 2. إدراج وسائط في المحتوى
```javascript
// في محرر TipTap
const insertMedia = (media) => {
  if (media.type === 'IMAGE') {
    editor.chain().focus().setImage({ 
      src: media.url,
      alt: media.title,
      title: media.description 
    }).run();
  } else if (media.type === 'VIDEO') {
    editor.chain().focus().insertContent(`
      <video src="${media.url}" controls>
        ${media.title}
      </video>
    `).run();
  }
};
```

## التحليل بالذكاء الاصطناعي

### 1. تحليل الصور (Vision API)
```javascript
// عند رفع صورة جديدة
const analyzeImage = async (imageUrl) => {
  const analysis = await visionAPI.analyze(imageUrl);
  return {
    objects: analysis.objects,      // الكائنات المكتشفة
    faces: analysis.faces,          // الوجوه
    text: analysis.text,            // النصوص
    landmarks: analysis.landmarks,   // المعالم
    colors: analysis.colors         // الألوان السائدة
  };
};
```

### 2. استخراج الكيانات
```javascript
const entities = extractEntities(analysis);
// مثال النتيجة:
{
  persons: ["الملك سلمان"],
  places: ["الرياض", "قصر اليمامة"],
  organizations: ["وزارة الخارجية"],
  events: ["قمة العشرين"]
}
```

## أفضل الممارسات

### 1. تسمية الملفات
- استخدم أسماء وصفية واضحة
- تجنب المسافات واستخدم الشرطات
- أضف التاريخ للملفات الإخبارية

### 2. الوسوم والتصنيفات
- استخدم وسوماً متسقة
- صنف الملفات بدقة
- أضف وصفاً مفصلاً للصور المهمة

### 3. الأداء
- استخدم الصور المصغرة للمعاينة
- قم بضغط الصور قبل الرفع
- استخدم التحميل الكسول

### 4. الأمان
- تحقق من صلاحيات المستخدم
- سجل جميع عمليات الرفع والحذف
- احم من رفع الملفات الضارة

## الإحصائيات والتقارير

### إحصائيات الاستخدام
- أكثر الصور استخداماً
- الصور غير المستخدمة
- معدل استخدام كل تصنيف
- أنشط المحررين في الرفع

### تقارير الأداء
- حجم المكتبة الإجمالي
- معدل النمو الشهري
- أنواع الملفات الأكثر استخداماً
- متوسط حجم الملفات

## خارطة الطريق

### المرحلة القادمة
1. **تحرير الصور المدمج**
   - قص وتدوير
   - ضبط السطوع والتباين
   - إضافة علامات مائية

2. **تحسينات الذكاء الاصطناعي**
   - التعرف على الوجوه
   - توليد وصف تلقائي
   - اقتراحات أكثر دقة

3. **التكامل مع CDN**
   - رفع تلقائي إلى Cloudinary
   - تحسين تلقائي للصور
   - تحويل الصيغ حسب الحاجة

4. **ميزات تعاونية**
   - مجلدات مشتركة
   - تعليقات على الملفات
   - سجل التعديلات

## الخلاصة
مكتبة الوسائط الذكية في صحيفة سبق تمثل نقلة نوعية في إدارة المحتوى المرئي، حيث تجمع بين سهولة الاستخدام وقوة الذكاء الاصطناعي لتوفير تجربة متميزة للمحررين وتحسين جودة المحتوى المنشور. 