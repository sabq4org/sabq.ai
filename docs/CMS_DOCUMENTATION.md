# نظام إدارة المحتوى - Sabq AI CMS

## نظرة عامة

نظام إدارة المحتوى (CMS) في Sabq AI هو نظام شامل ومتقدم لإدارة المقالات والمحتوى الرقمي. يوفر النظام أدوات قوية للكتاب والمحررين والمديرين لإنشاء وتحرير ونشر المحتوى بكفاءة عالية.

## الميزات الأساسية

### 1. إدارة المقالات الشاملة
- **إنشاء وتحرير المقالات**: واجهة سهلة الاستخدام لإنشاء المقالات
- **محرر نصوص ذكي**: محرر متقدم يدعم الوسائط والتنسيق المتقدم
- **إدارة الحالات**: مسودة، منشور، مجدول، مؤرشف، قيد المراجعة
- **المقالات المميزة**: تمييز المقالات المهمة
- **جدولة النشر**: نشر المقالات في أوقات محددة
- **سجل المراجعات**: تتبع جميع التغييرات والنسخ السابقة

### 2. نظام الفئات والوسوم
- **إدارة الفئات**: تنظيم المحتوى في فئات هرمية
- **نظام الوسوم**: وسم المقالات بكلمات مفتاحية
- **البحث والفلترة**: بحث متقدم حسب الفئة والوسوم
- **إحصائيات الاستخدام**: تتبع استخدام الفئات والوسوم

### 3. إدارة الوسائط المتقدمة
- **رفع آمن للملفات**: دعم الصور والفيديو والصوت والمستندات
- **معالجة الصور**: تحسين وضغط الصور تلقائياً
- **مكتبة الوسائط**: تنظيم وإدارة جميع الملفات
- **التحقق من الأمان**: فحص الملفات ضد الفيروسات والمحتوى الضار

### 4. محرر النصوص الذكي
- **واجهة WYSIWYG**: تحرير مرئي متقدم
- **دعم الوسائط**: إدراج الصور والفيديو والصوت
- **التحرير الجماعي**: تحرير متعدد المستخدمين في الوقت الحقيقي
- **الحفظ التلقائي**: حفظ المحتوى تلقائياً لتجنب فقدان البيانات
- **إدراج الجداول**: إنشاء وتحرير الجداول
- **قوائم المهام**: إنشاء قوائم مهام تفاعلية

### 5. نظام الصلاحيات المرن
- **أدوار المستخدمين**: قارئ، محرر، مدير
- **صلاحيات مخصصة**: تخصيص الصلاحيات لكل مستخدم
- **التحرير الجماعي**: إضافة متعاونين للمقالات
- **سجل النشاط**: تتبع جميع الأنشطة والتغييرات

## البنية التقنية

### قاعدة البيانات

#### جدول المقالات (Article)
```sql
- id: معرف فريد
- title: العنوان
- slug: الرابط المختصر
- content: المحتوى
- summary: الملخص
- featured_image: الصورة المميزة
- category_id: معرف الفئة
- author_id: معرف المؤلف
- status: الحالة (draft, published, scheduled, archived, in_review)
- featured: مقال مميز
- view_count: عدد المشاهدات
- reading_time: وقت القراءة المقدر
- seo_data: بيانات SEO
- published_at: تاريخ النشر
- scheduled_at: تاريخ النشر المجدول
- created_at: تاريخ الإنشاء
- updated_at: تاريخ آخر تحديث
```

#### جدول مراجعات المقالات (ArticleRevision)
```sql
- id: معرف فريد
- article_id: معرف المقال
- title: العنوان
- content: المحتوى
- summary: الملخص
- author_id: معرف المؤلف
- revision_number: رقم المراجعة
- change_summary: ملخص التغييرات
- created_at: تاريخ الإنشاء
```

#### جدول الفئات (Category)
```sql
- id: معرف فريد
- name: الاسم
- slug: الرابط المختصر
- description: الوصف
- color: اللون
- icon: الأيقونة
- is_active: نشط
- sort_order: ترتيب العرض
- created_at: تاريخ الإنشاء
- updated_at: تاريخ آخر تحديث
```

#### جدول الوسوم (Tag)
```sql
- id: معرف فريد
- name: الاسم
- slug: الرابط المختصر
- description: الوصف
- color: اللون
- is_active: نشط
- usage_count: عدد الاستخدام
- created_at: تاريخ الإنشاء
- updated_at: تاريخ آخر تحديث
```

#### جدول الوسائط (MediaFile)
```sql
- id: معرف فريد
- filename: اسم الملف
- original_name: الاسم الأصلي
- file_path: مسار الملف
- file_url: رابط الملف
- file_type: نوع الملف
- mime_type: نوع MIME
- file_size: حجم الملف
- width: العرض (للصور)
- height: الارتفاع (للصور)
- duration: المدة (للفيديو/الصوت)
- alt_text: النص البديل
- caption: التعليق
- uploaded_by: رافع الملف
- is_public: عام
- usage_count: عدد الاستخدام
- created_at: تاريخ الرفع
- updated_at: تاريخ آخر تحديث
```

### واجهات برمجة التطبيقات (APIs)

#### إدارة المقالات

**GET /api/articles**
- جلب قائمة المقالات مع البحث والفلترة
- المعاملات: q, status, category, author, featured, tags, page, limit, sort, order
- الاستجابة: قائمة المقالات مع بيانات الترقيم

**POST /api/articles**
- إنشاء مقال جديد
- البيانات المطلوبة: title, slug, content, category_id
- البيانات الاختيارية: summary, featured_image, status, featured, tags, scheduled_at, seo_data

**GET /api/articles/{id}**
- جلب تفاصيل مقال محدد
- يتضمن: المعلومات الأساسية، المراجعات، المتعاونين، حالة سير العمل

**PUT /api/articles/{id}**
- تحديث مقال موجود
- يدعم التحديث الجزئي
- ينشئ مراجعة جديدة عند التحديث

**DELETE /api/articles/{id}**
- حذف مقال (حذف ناعم للمقالات المنشورة)
- المسودات يتم حذفها نهائياً

#### إدارة الفئات

**GET /api/categories**
- جلب قائمة الفئات
- المعاملات: include_stats, active

**POST /api/categories**
- إنشاء فئة جديدة
- البيانات المطلوبة: name, slug
- البيانات الاختيارية: description, color, icon, sort_order

#### إدارة الوسوم

**GET /api/tags**
- جلب قائمة الوسوم
- المعاملات: q, include_stats, limit, popular

**POST /api/tags**
- إنشاء وسم جديد
- البيانات المطلوبة: name
- البيانات الاختيارية: description, color

#### إدارة الوسائط

**POST /api/media/upload**
- رفع ملف وسائط
- يدعم: الصور، الفيديو، الصوت، المستندات
- التحقق من: نوع الملف، الحجم، الأمان

**GET /api/media/upload**
- جلب قائمة الملفات المرفوعة
- المعاملات: type, page, limit, search

### مكونات الواجهة الأمامية

#### SmartRichEditor
محرر النصوص الذكي مع الميزات التالية:
- تحرير WYSIWYG متقدم
- دعم الوسائط المتعددة
- التحرير الجماعي
- الحفظ التلقائي
- إحصائيات الكتابة

```tsx
<SmartRichEditor
  content={content}
  onChange={handleContentChange}
  articleId={articleId}
  userId={userId}
  userName={userName}
  enableCollaboration={true}
  maxLength={50000}
/>
```

#### ArticleList
قائمة المقالات مع الميزات التالية:
- البحث والفلترة المتقدمة
- الإجراءات الجماعية
- ترقيم الصفحات
- إحصائيات مفصلة

```tsx
<ArticleList
  initialArticles={articles}
  categories={categories}
  authors={authors}
/>
```

#### ArticleForm
نموذج تحرير المقال مع:
- محرر نصوص متقدم
- إدارة الوسوم والفئات
- إعدادات SEO
- معاينة المقال

```tsx
<ArticleForm
  article={article}
  categories={categories}
  tags={tags}
  isEdit={true}
  currentUser={user}
/>
```

#### MediaUploader
رافع الوسائط مع:
- السحب والإفلات
- معاينة الملفات
- التحقق من الأمان
- إدارة البيانات الوصفية

```tsx
<MediaUploader
  type="image"
  onUploaded={handleMediaUpload}
  onClose={handleClose}
  maxSize={5 * 1024 * 1024}
/>
```

## الأمان والخصوصية

### حماية البيانات
- **تشفير البيانات الحساسة**: جميع البيانات الحساسة مشفرة
- **تنظيف المدخلات**: تنظيف جميع المدخلات من الأكواد الضارة
- **التحقق من الملفات**: فحص الملفات المرفوعة ضد الفيروسات
- **حماية من حقن SQL**: استخدام prepared statements

### إدارة الصلاحيات
- **مصادقة قوية**: نظام مصادقة متعدد العوامل
- **تشفير كلمات المرور**: تشفير قوي لكلمات المرور
- **إدارة الجلسات**: إدارة آمنة للجلسات
- **تسجيل النشاط**: تسجيل جميع الأنشطة الأمنية

### حماية من الهجمات
- **حماية CSRF**: حماية من هجمات Cross-Site Request Forgery
- **حماية XSS**: تنظيف المحتوى من أكواد JavaScript الضارة
- **Rate Limiting**: تحديد معدل الطلبات لمنع الهجمات
- **تحديد الملفات**: فحص نوع وحجم الملفات المرفوعة

## إعدادات النظام

### متغيرات البيئة
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sabq_cms

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./public/uploads

# Media Processing
ENABLE_IMAGE_OPTIMIZATION=true
IMAGE_QUALITY=85

# Security
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000  # 1 minute

# Collaboration
ENABLE_COLLABORATION=true
WEBSOCKET_PORT=3001
```

### إعدادات المحرر
```typescript
const editorConfig = {
  maxLength: 50000,
  autoSave: true,
  autoSaveInterval: 2000, // 2 seconds
  enableCollaboration: true,
  allowedFileTypes: ['image', 'video', 'audio', 'document'],
  maxFileSize: {
    image: 5 * 1024 * 1024,    // 5MB
    video: 100 * 1024 * 1024,  // 100MB
    audio: 50 * 1024 * 1024,   // 50MB
    document: 10 * 1024 * 1024 // 10MB
  }
};
```

## الاستخدام والأمثلة

### إنشاء مقال جديد
```typescript
// إنشاء مقال جديد
const createArticle = async (articleData: ArticleData) => {
  const response = await fetch('/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(articleData)
  });
  
  if (!response.ok) {
    throw new Error('فشل في إنشاء المقال');
  }
  
  return response.json();
};
```

### البحث في المقالات
```typescript
// البحث المتقدم
const searchArticles = async (params: SearchParams) => {
  const queryString = new URLSearchParams({
    q: params.query,
    status: params.status,
    category: params.category,
    page: params.page.toString(),
    limit: params.limit.toString()
  });
  
  const response = await fetch(`/api/articles?${queryString}`);
  return response.json();
};
```

### رفع وسائط
```typescript
// رفع صورة
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('alt_text', 'وصف الصورة');
  
  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

## الاختبارات

### اختبارات الوحدة
```typescript
describe('Article API', () => {
  test('should create article successfully', async () => {
    const articleData = {
      title: 'مقال تجريبي',
      slug: 'test-article',
      content: 'محتوى المقال',
      category_id: 'category-id'
    };
    
    const response = await request(app)
      .post('/api/articles')
      .send(articleData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.article.title).toBe(articleData.title);
  });
});
```

### اختبارات التكامل
```typescript
describe('CMS Integration', () => {
  test('should handle complete article workflow', async () => {
    // إنشاء فئة
    const category = await createCategory('تقنية');
    
    // إنشاء مقال
    const article = await createArticle({
      title: 'مقال تقني',
      category_id: category.id
    });
    
    // نشر المقال
    await publishArticle(article.id);
    
    // التحقق من النشر
    const publishedArticle = await getArticle(article.id);
    expect(publishedArticle.status).toBe('published');
  });
});
```

## الأداء والتحسين

### ذاكرة التخزين المؤقت
- **Redis**: تخزين مؤقت للبيانات المتكررة
- **CDN**: توزيع الوسائط عبر شبكة التوزيع
- **Database Indexing**: فهرسة محسنة لقاعدة البيانات

### تحسين الاستعلامات
```sql
-- فهرسة محسنة للمقالات
CREATE INDEX idx_articles_status_published ON articles(status, published_at);
CREATE INDEX idx_articles_category_featured ON articles(category_id, featured);
CREATE INDEX idx_articles_search ON articles USING gin(to_tsvector('arabic', title || ' ' || content));
```

### ضغط الملفات
```typescript
// ضغط الصور
const optimizeImage = async (file: File) => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  });
  
  return compressed;
};
```

## استكشاف الأخطاء

### مشاكل شائعة

#### خطأ في رفع الملفات
```
Error: File too large
Solution: تحقق من حجم الملف وإعدادات MAX_FILE_SIZE
```

#### خطأ في التحرير الجماعي
```
Error: WebSocket connection failed
Solution: تأكد من تشغيل خادم WebSocket وإعدادات CORS
```

#### خطأ في الحفظ التلقائي
```
Error: Auto-save failed
Solution: تحقق من صلاحيات المستخدم وحالة الاتصال
```

### سجلات النظام
```typescript
// تسجيل الأخطاء
const logError = (error: Error, context: any) => {
  console.error('CMS Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};
```

## خارطة الطريق

### الإصدار 2.0
- [ ] دعم المحتوى متعدد اللغات
- [ ] نظام التعليقات المتقدم
- [ ] تحليلات المحتوى بالذكاء الاصطناعي
- [ ] تكامل مع منصات التواصل الاجتماعي

### الإصدار 2.1
- [ ] محرر مرئي متقدم
- [ ] نظام الموافقة على المحتوى
- [ ] تصدير المحتوى بصيغ متعددة
- [ ] واجهة برمجة تطبيقات GraphQL

### الإصدار 2.2
- [ ] دعم البودكاست والمحتوى الصوتي
- [ ] نظام النشر المجدول المتقدم
- [ ] تكامل مع أنظمة إدارة الأصول الرقمية
- [ ] تحسينات الأداء والسرعة

## المساهمة

### إرشادات التطوير
1. استخدم TypeScript لجميع الملفات الجديدة
2. اتبع معايير ESLint و Prettier
3. اكتب اختبارات للميزات الجديدة
4. وثق التغييرات في CHANGELOG.md
5. استخدم رسائل commit واضحة ومفصلة

### هيكل المشروع
```
src/
├── app/api/           # APIs الخلفية
├── components/        # مكونات React
├── lib/              # مكتبات مساعدة
├── types/            # تعريفات TypeScript
└── utils/            # دوال مساعدة

components/
├── admin/            # مكونات لوحة الإدارة
├── editor/           # مكونات المحرر
└── ui/               # مكونات واجهة المستخدم

docs/
├── api/              # توثيق APIs
├── components/       # توثيق المكونات
└── guides/           # أدلة الاستخدام
```

---

تم تطوير نظام إدارة المحتوى بواسطة فريق Sabq AI  
آخر تحديث: ديسمبر 2024  
الإصدار: 1.0.0 