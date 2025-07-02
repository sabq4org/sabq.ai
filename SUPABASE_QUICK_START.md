# دليل البدء السريع مع Supabase لموقع سبق

## 🚀 الإعداد في 10 دقائق

### 1. إنشاء حساب ومشروع
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب مجاني
3. أنشئ مشروع جديد:
   - **اسم المشروع**: sabq-news
   - **كلمة مرور قاعدة البيانات**: (احفظها جيداً)
   - **المنطقة**: اختر الأقرب لك

### 2. إعداد الجداول
انسخ والصق هذا الكود في SQL Editor في Supabase:

```sql
-- جدول المستخدمين
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول المقالات
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES users(id),
    category_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    featured_image TEXT,
    metadata JSONB DEFAULT '{}',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول التفاعلات
CREATE TABLE interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, article_id, type)
);

-- جدول نقاط الولاء
CREATE TABLE loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- جدول التحليلات العميقة
CREATE TABLE deep_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    ai_summary TEXT,
    key_points JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    sentiment VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_article ON interactions(article_id);
CREATE INDEX idx_loyalty_user ON loyalty_points(user_id);

-- تفعيل Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان الأساسية
CREATE POLICY "Public articles are viewable by everyone" 
ON articles FOR SELECT 
USING (status = 'published');

CREATE POLICY "Users can view their own interactions" 
ON interactions FOR ALL 
USING (user_id = current_user);
```

### 3. الحصول على بيانات الاتصال
1. اذهب إلى **Settings > API**
2. انسخ:
   - `URL`: رابط المشروع
   - `anon key`: المفتاح العام
   - `service_role key`: المفتاح الخاص (للخادم فقط)

### 4. إعداد المشروع
أنشئ ملف `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# قاعدة البيانات المباشرة (من Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 5. تثبيت المكتبات
```bash
npm install @supabase/supabase-js
```

### 6. إنشاء عميل Supabase
إنشاء `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// للعمليات من جانب الخادم
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## 📊 أمثلة الاستخدام

### حفظ تفاعل
```typescript
const { data, error } = await supabase
  .from('interactions')
  .upsert({
    user_id: userId,
    article_id: articleId,
    type: 'like'
  })
```

### جلب المقالات
```typescript
const { data: articles, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(20)
```

### إضافة نقاط ولاء
```typescript
const { data, error } = await supabase
  .from('loyalty_points')
  .insert({
    user_id: userId,
    points: 10,
    action: 'article_like'
  })
```

## 🔒 الأمان

### تفعيل المصادقة
```typescript
// تسجيل مستخدم جديد
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// تسجيل الدخول
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

## 🎯 المزايا

1. **مجاني**: 500MB + مصادقة غير محدودة
2. **سريع**: CDN عالمي
3. **Real-time**: تحديثات فورية
4. **مفتوح المصدر**: يمكن نقله لخادمك لاحقاً

## 📱 التطبيق المباشر

بعد الإعداد، حدّث ملفات API في مشروعك لاستخدام Supabase بدلاً من ملفات JSON.

---

*للمساعدة: [docs.supabase.com](https://docs.supabase.com)* 