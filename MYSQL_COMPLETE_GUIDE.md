# دليل MySQL الشامل لموقع سبق

## 🚀 البدء السريع

### 1. إنشاء ملف `.env.local`
```bash
# انسخ المحتوى من ENV_TEMPLATE.md
cp ENV_TEMPLATE.md .env.local
# ثم عدّل القيم حسب بيئتك
```

### 2. تنفيذ SQL لإنشاء الجداول
```bash
# افتح phpMyAdmin أو MySQL Console
# انسخ والصق محتوى database/create_tables.sql
```

### 3. ترحيل البيانات الموجودة
```bash
node scripts/migrate-to-mysql.js
```

### 4. اختبار الاتصال
```bash
node -e "require('./lib/db').checkConnection()"
```

## 📊 استخدام قاعدة البيانات في APIs

### مثال 1: جلب المقالات
```typescript
// app/api/articles/route.ts
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const articles = await query(`
    SELECT 
      a.*,
      c.name as category_name,
      c.color as category_color,
      u.name as author_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 20
  `);
  
  return NextResponse.json(articles);
}
```

### مثال 2: إضافة مقال جديد
```typescript
// app/api/articles/route.ts
import { execute } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const articleId = uuidv4();
  
  const result = await execute(`
    INSERT INTO articles (
      id, title, slug, content, excerpt, 
      author_id, category_id, status, featured_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    articleId,
    data.title,
    data.slug,
    data.content,
    data.excerpt,
    data.author_id,
    data.category_id,
    data.status || 'draft',
    data.featured_image
  ]);
  
  return NextResponse.json({ 
    success: true,
    article_id: articleId 
  });
}
```

### مثال 3: التفاعلات (إعجاب/حفظ)
```typescript
// app/api/interactions/route.ts
import { execute, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { user_id, article_id, type } = await request.json();
  
  // التحقق من وجود تفاعل سابق
  const existing = await queryOne(
    'SELECT * FROM interactions WHERE user_id = ? AND article_id = ? AND type = ?',
    [user_id, article_id, type]
  );
  
  if (existing) {
    // حذف التفاعل (إلغاء الإعجاب)
    await execute(
      'DELETE FROM interactions WHERE id = ?',
      [existing.id]
    );
    return NextResponse.json({ action: 'removed' });
  } else {
    // إضافة تفاعل جديد
    await execute(
      'INSERT INTO interactions (user_id, article_id, type) VALUES (?, ?, ?)',
      [user_id, article_id, type]
    );
    
    // إضافة نقاط ولاء
    if (type === 'like') {
      await execute(
        'INSERT INTO loyalty_points (user_id, points, action) VALUES (?, ?, ?)',
        [user_id, 5, 'article_like']
      );
    }
    
    return NextResponse.json({ action: 'added' });
  }
}
```

### مثال 4: البحث المتقدم
```typescript
// app/api/articles/search/route.ts
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  let sql = `
    SELECT a.*, c.name as category_name
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.status = 'published'
  `;
  const params = [];
  
  if (q) {
    sql += ' AND (a.title LIKE ? OR a.content LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  
  if (category) {
    sql += ' AND c.slug = ?';
    params.push(category);
  }
  
  if (from) {
    sql += ' AND a.published_at >= ?';
    params.push(from);
  }
  
  if (to) {
    sql += ' AND a.published_at <= ?';
    params.push(to);
  }
  
  sql += ' ORDER BY a.published_at DESC LIMIT 50';
  
  const results = await query(sql, params);
  return NextResponse.json(results);
}
```

### مثال 5: المعاملات (Transactions)
```typescript
// app/api/articles/transfer/route.ts
import { withTransaction } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { article_id, from_category, to_category } = await request.json();
  
  try {
    const result = await withTransaction(async (connection) => {
      // تحديث الفئة
      await connection.execute(
        'UPDATE articles SET category_id = ? WHERE id = ?',
        [to_category, article_id]
      );
      
      // تسجيل النشاط
      await connection.execute(
        'INSERT INTO activity_logs (action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?)',
        ['category_changed', 'article', article_id, JSON.stringify({
          from: from_category,
          to: to_category
        })]
      );
      
      return { success: true };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 🔍 استعلامات مفيدة

### إحصائيات الموقع
```sql
-- عدد المقالات حسب الفئة
SELECT 
  c.name,
  COUNT(a.id) as article_count
FROM categories c
LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
GROUP BY c.id
ORDER BY article_count DESC;

-- المقالات الأكثر مشاهدة
SELECT 
  title,
  views,
  DATE(published_at) as publish_date
FROM articles
WHERE status = 'published'
ORDER BY views DESC
LIMIT 10;

-- نشاط المستخدمين
SELECT 
  u.name,
  COUNT(DISTINCT i.article_id) as articles_liked,
  SUM(lp.points) as total_points
FROM users u
LEFT JOIN interactions i ON u.id = i.user_id AND i.type = 'like'
LEFT JOIN loyalty_points lp ON u.id = lp.user_id
GROUP BY u.id
ORDER BY total_points DESC;
```

### صيانة قاعدة البيانات
```sql
-- تنظيف التفاعلات القديمة
DELETE FROM interactions 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- تحديث عدد المشاهدات
UPDATE articles a
SET views = (
  SELECT COUNT(*) 
  FROM interactions i 
  WHERE i.article_id = a.id AND i.type = 'view'
)
WHERE status = 'published';

-- أرشفة الرسائل القديمة
UPDATE messages 
SET status = 'archived'
WHERE status = 'read' AND created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);
```

## 🛡️ الأمان

### 1. استخدام Prepared Statements
```typescript
// ✅ صحيح - آمن من SQL Injection
const articles = await query(
  'SELECT * FROM articles WHERE category_id = ?',
  [categoryId]
);

// ❌ خطأ - عرضة لـ SQL Injection
const articles = await query(
  `SELECT * FROM articles WHERE category_id = ${categoryId}`
);
```

### 2. التحقق من المدخلات
```typescript
// التحقق من نوع البيانات
if (!isValidUUID(articleId)) {
  return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
}

// التحقق من الصلاحيات
const user = await getCurrentUser();
if (!user || user.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

## 🚨 حل المشاكل الشائعة

### 1. خطأ في الاتصال
```bash
# تحقق من إعدادات .env.local
cat .env.local | grep DB_

# اختبر الاتصال من Terminal
mysql -h localhost -u j3uar_sabq_user -p j3uar_sabq_db
```

### 2. خطأ في الترميز (Arabic text)
```sql
-- تأكد من استخدام utf8mb4
ALTER DATABASE j3uar_sabq_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE articles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. بطء الاستعلامات
```sql
-- إضافة فهارس للحقول المستخدمة في البحث
CREATE INDEX idx_articles_title ON articles(title);
CREATE INDEX idx_articles_created ON articles(created_at);

-- تحليل أداء الاستعلام
EXPLAIN SELECT * FROM articles WHERE title LIKE '%keyword%';
```

## 📈 التحسينات المستقبلية

1. **Redis Cache**: لتخزين النتائج المؤقت
2. **Full-text Search**: للبحث المتقدم
3. **Read Replicas**: لتوزيع الحمل
4. **Backup Automation**: نسخ احتياطي تلقائي

---

*آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}* 