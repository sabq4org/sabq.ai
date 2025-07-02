-- 🧹 سكريبت حذف البيانات التجريبية من قاعدة بيانات PlanetScale
-- ⚠️ تحذير: هذا السكريبت سيحذف البيانات نهائياً
-- 📅 تاريخ: 2025-01-15

-- 1️⃣ عرض البيانات التجريبية قبل الحذف
SELECT '📊 تحليل البيانات التجريبية...' AS status;

-- عد المقالات التجريبية
SELECT 
    '📰 المقالات التجريبية' AS category,
    COUNT(*) AS count
FROM articles
WHERE 
    title LIKE '%تجربة%'
    OR title LIKE '%test%'
    OR title LIKE '%السلام عليكم%'
    OR title LIKE '%dummy%'
    OR content LIKE '%test%'
    OR LENGTH(content) < 200;

-- عرض المقالات التجريبية
SELECT 
    id,
    title,
    LEFT(content, 100) AS content_preview,
    LENGTH(content) AS content_length,
    created_at
FROM articles
WHERE 
    title LIKE '%تجربة%'
    OR title LIKE '%test%'
    OR title LIKE '%السلام عليكم%'
    OR title LIKE '%dummy%'
    OR content LIKE '%test%'
    OR LENGTH(content) < 200
ORDER BY created_at DESC;

-- عد المستخدمين التجريبيين
SELECT 
    '👥 المستخدمين التجريبيين' AS category,
    COUNT(*) AS count
FROM users
WHERE 
    name LIKE '%test%'
    OR name LIKE '%تجربة%'
    OR email LIKE '%test%'
    OR email LIKE '%dummy%'
    OR email LIKE '%@example.com';

-- 2️⃣ حذف البيانات التجريبية (معلق - قم بإزالة التعليق لتنفيذ الحذف)

-- حذف التفاعلات المرتبطة بالمقالات التجريبية
/*
DELETE FROM interactions
WHERE article_id IN (
    SELECT id FROM articles
    WHERE 
        title LIKE '%تجربة%'
        OR title LIKE '%test%'
        OR title LIKE '%السلام عليكم%'
        OR title LIKE '%dummy%'
        OR content LIKE '%test%'
        OR LENGTH(content) < 200
);
*/

-- حذف التعليقات المرتبطة بالمقالات التجريبية
/*
DELETE FROM comments
WHERE article_id IN (
    SELECT id FROM articles
    WHERE 
        title LIKE '%تجربة%'
        OR title LIKE '%test%'
        OR title LIKE '%السلام عليكم%'
        OR title LIKE '%dummy%'
        OR content LIKE '%test%'
        OR LENGTH(content) < 200
);
*/

-- حذف المقالات التجريبية
/*
DELETE FROM articles
WHERE 
    title LIKE '%تجربة%'
    OR title LIKE '%test%'
    OR title LIKE '%السلام عليكم%'
    OR title LIKE '%dummy%'
    OR content LIKE '%test%'
    OR LENGTH(content) < 200;
*/

-- حذف المستخدمين التجريبيين (بحذر - فقط إذا لم يكن لديهم مقالات حقيقية)
/*
DELETE FROM users
WHERE 
    id IN (
        SELECT u.id 
        FROM users u
        WHERE 
            (u.name LIKE '%test%'
            OR u.name LIKE '%تجربة%'
            OR u.email LIKE '%test%'
            OR u.email LIKE '%dummy%'
            OR u.email LIKE '%@example.com')
            AND u.id NOT IN (
                SELECT DISTINCT author_id 
                FROM articles 
                WHERE author_id IS NOT NULL
            )
    );
*/

-- 3️⃣ التحقق من النتائج بعد الحذف
SELECT 
    '✅ ملخص البيانات بعد التنظيف' AS status,
    (SELECT COUNT(*) FROM articles) AS total_articles,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM comments) AS total_comments,
    (SELECT COUNT(*) FROM interactions) AS total_interactions;

-- 4️⃣ عرض المقالات الحقيقية المتبقية
SELECT 
    id,
    title,
    author_id,
    category_id,
    views,
    created_at
FROM articles
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 10; 