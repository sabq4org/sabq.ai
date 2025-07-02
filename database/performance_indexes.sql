-- فهارس لتحسين أداء استعلامات المقالات
-- تاريخ الإنشاء: 2025-01-29

-- فهرس على تاريخ الإنشاء (الأكثر استخداماً للترتيب)
CREATE INDEX idx_articles_created_at ON Article(createdAt DESC);

-- فهرس على حالة المقال (للفلترة)
CREATE INDEX idx_articles_status ON Article(status);

-- فهرس على التصنيف (للفلترة)
CREATE INDEX idx_articles_category_id ON Article(categoryId);

-- فهرس على المؤلف (للفلترة)
CREATE INDEX idx_articles_author_id ON Article(authorId);

-- فهرس مركب على الحالة والتاريخ (للصفحة الرئيسية)
CREATE INDEX idx_articles_status_created_at ON Article(status, createdAt DESC);

-- فهرس مركب على التصنيف والتاريخ (لصفحات التصنيفات)
CREATE INDEX idx_articles_category_created_at ON Article(categoryId, createdAt DESC);

-- فهرس على المقالات المميزة
CREATE INDEX idx_articles_featured ON Article(featured) WHERE featured = true;

-- فهرس على الأخبار العاجلة
CREATE INDEX idx_articles_breaking ON Article(breaking) WHERE breaking = true;

-- فهرس على عدد المشاهدات (للترتيب حسب الشعبية)
CREATE INDEX idx_articles_views ON Article(views DESC);

-- فهرس على تاريخ النشر (للترتيب حسب تاريخ النشر)
CREATE INDEX idx_articles_published_at ON Article(publishedAt DESC);

-- فهرس على العنوان (للبحث)
CREATE INDEX idx_articles_title ON Article(title);

-- فهرس على المحتوى (للبحث - إذا كان مطلوباً)
-- CREATE INDEX idx_articles_content ON Article(content);

-- فهارس للمستخدمين
CREATE INDEX idx_users_email ON User(email);
CREATE INDEX idx_users_name ON User(name);

-- فهارس للتصنيفات
CREATE INDEX idx_categories_name ON Category(name);
CREATE INDEX idx_categories_slug ON Category(slug);

-- فهارس للتعليقات (إذا كانت موجودة)
-- CREATE INDEX idx_comments_article_id ON Comment(articleId);
-- CREATE INDEX idx_comments_created_at ON Comment(createdAt DESC);

-- فهارس للتفاعلات (إذا كانت موجودة)
-- CREATE INDEX idx_interactions_article_id ON Interaction(articleId);
-- CREATE INDEX idx_interactions_user_id ON Interaction(userId);
-- CREATE INDEX idx_interactions_type ON Interaction(type);

-- ملاحظات مهمة:
-- 1. هذه الفهارس ستساعد في تسريع الاستعلامات الأكثر شيوعاً
-- 2. الفهارس المركبة مفيدة للاستعلامات التي تستخدم عدة شروط معاً
-- 3. فهارس WHERE مفيدة للحقول التي لها قيم محدودة (مثل featured, breaking)
-- 4. تأكد من عدم إنشاء فهارس كثيرة جداً لأنها تبطئ عمليات الكتابة 