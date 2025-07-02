# دليل تكامل Prisma ORM في مشروع سبق

## 📋 ما تم إنجازه

1. ✅ تثبيت `prisma` و `@prisma/client`
2. ✅ إنشاء `prisma/schema.prisma` مع جميع النماذج
3. ✅ توليد Prisma Client في `lib/generated/prisma`
4. ✅ إنشاء `lib/prisma.ts` لإدارة الاتصال

## 🚀 كيفية استخدام Prisma في المشروع

### 1. استيراد Prisma Client

```typescript
import { prisma } from '@/lib/prisma'
```

### 2. أمثلة عملية

#### جلب المقالات
```typescript
// جلب جميع المقالات المنشورة
const articles = await prisma.article.findMany({
  where: {
    status: 'published'
  },
  include: {
    author: true,
    category: true,
    interactions: true,
    _count: {
      select: {
        interactions: true,
        comments: true
      }
    }
  },
  orderBy: {
    publishedAt: 'desc'
  },
  take: 20
})

// جلب مقال واحد بال slug
const article = await prisma.article.findUnique({
  where: { slug: 'article-slug' },
  include: {
    author: true,
    category: true,
    deepAnalysis: true,
    comments: {
      where: { status: 'approved' },
      include: { user: true }
    }
  }
})
```

#### إنشاء مقال جديد
```typescript
const newArticle = await prisma.article.create({
  data: {
    title: 'عنوان المقال',
    slug: 'article-slug',
    content: 'محتوى المقال',
    excerpt: 'مقتطف',
    status: 'draft',
    authorId: 'user-id',
    categoryId: 'category-id',
    metadata: {
      keywords: ['كلمة1', 'كلمة2'],
      description: 'وصف المقال'
    }
  }
})
```

#### تحديث المقال
```typescript
const updatedArticle = await prisma.article.update({
  where: { id: 'article-id' },
  data: {
    title: 'العنوان الجديد',
    status: 'published',
    publishedAt: new Date(),
    views: {
      increment: 1 // زيادة عدد المشاهدات
    }
  }
})
```

#### إضافة تفاعل (إعجاب/حفظ)
```typescript
// إضافة إعجاب
const interaction = await prisma.interaction.create({
  data: {
    userId: 'user-id-or-guest-id',
    articleId: 'article-id',
    type: 'like',
    metadata: {
      timestamp: new Date().toISOString()
    }
  }
})

// حذف إعجاب
await prisma.interaction.delete({
  where: {
    userId_articleId_type: {
      userId: 'user-id',
      articleId: 'article-id',
      type: 'like'
    }
  }
})
```

#### إدارة المستخدمين
```typescript
// إنشاء مستخدم جديد
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    name: 'اسم المستخدم',
    role: 'user',
    isVerified: false,
    verificationToken: 'token'
  }
})

// تحديث المستخدم
await prisma.user.update({
  where: { id: 'user-id' },
  data: {
    isVerified: true,
    verificationToken: null
  }
})
```

#### نقاط الولاء
```typescript
// إضافة نقاط
await prisma.loyaltyPoint.create({
  data: {
    userId: 'user-id',
    points: 10,
    action: 'article_like',
    referenceId: 'article-id',
    referenceType: 'article'
  }
})

// حساب مجموع النقاط
const totalPoints = await prisma.loyaltyPoint.aggregate({
  where: { userId: 'user-id' },
  _sum: { points: true }
})
```

### 3. تحديث APIs الموجودة

#### مثال: تحديث `/api/articles/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'published'
    const limit = parseInt(searchParams.get('limit') || '20')
    const featured = searchParams.get('featured') === 'true'
    const breaking = searchParams.get('breaking') === 'true'

    const articles = await prisma.article.findMany({
      where: {
        status,
        ...(featured && { featured: true }),
        ...(breaking && { breaking: true })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        category: true,
        _count: {
          select: {
            interactions: true,
            comments: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المقالات' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const article = await prisma.article.create({
      data: {
        ...data,
        slug: generateSlug(data.title),
        publishedAt: data.status === 'published' ? new Date() : null
      }
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء المقال' },
      { status: 500 }
    )
  }
}
```

## 🔧 إعداد قاعدة البيانات

### 1. إنشاء ملف `.env` بمعلومات الاتصال:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/sabq_db"
```

### 2. إنشاء قاعدة البيانات:

```bash
# دفع التغييرات لقاعدة البيانات (للتطوير)
npx prisma db push

# أو استخدام Migrations (للإنتاج)
npx prisma migrate dev --name init
```

### 3. ملء البيانات الأولية (Seed):

قم بإنشاء `prisma/seed.ts`:

```typescript
import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // إنشاء الأدوار الأساسية
  const roles = await prisma.role.createMany({
    data: [
      { name: 'super_admin', displayName: 'مدير عام', permissions: ["*"], isSystem: true },
      { name: 'admin', displayName: 'مدير', isSystem: true },
      { name: 'editor', displayName: 'محرر', isSystem: true },
      { name: 'author', displayName: 'كاتب', isSystem: true },
      { name: 'user', displayName: 'مستخدم', isSystem: true }
    ]
  })

  // إنشاء الفئات الأساسية
  const categories = await prisma.category.createMany({
    data: [
      { name: 'أخبار محلية', slug: 'local-news', color: '#2563eb', icon: 'newspaper' },
      { name: 'رياضة', slug: 'sports', color: '#10b981', icon: 'trophy' },
      { name: 'تقنية', slug: 'technology', color: '#8b5cf6', icon: 'cpu' },
      { name: 'اقتصاد', slug: 'economy', color: '#f59e0b', icon: 'chart-line' },
      { name: 'ثقافة', slug: 'culture', color: '#ec4899', icon: 'book' },
      { name: 'صحة', slug: 'health', color: '#ef4444', icon: 'heartbeat' },
      { name: 'سياحة', slug: 'tourism', color: '#06b6d4', icon: 'plane' },
      { name: 'تعليم', slug: 'education', color: '#6366f1', icon: 'graduation-cap' }
    ]
  })

  console.log('✅ تم ملء البيانات الأولية بنجاح')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

ثم أضف في `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

وشغّل:

```bash
npx prisma db seed
```

## 🔍 استعلامات متقدمة

### البحث النصي
```typescript
const searchResults = await prisma.article.findMany({
  where: {
    OR: [
      { title: { contains: 'كلمة البحث', mode: 'insensitive' } },
      { content: { contains: 'كلمة البحث', mode: 'insensitive' } }
    ]
  }
})
```

### تجميع البيانات
```typescript
// عدد المقالات حسب الفئة
const articlesByCategory = await prisma.article.groupBy({
  by: ['categoryId'],
  _count: true,
  where: {
    status: 'published'
  }
})

// إحصائيات التفاعلات
const interactionStats = await prisma.interaction.groupBy({
  by: ['type'],
  _count: true,
  where: {
    articleId: 'article-id'
  }
})
```

### العلاقات المعقدة
```typescript
// جلب المستخدمين مع مقالاتهم وتفاعلاتهم
const usersWithActivity = await prisma.user.findMany({
  include: {
    articles: {
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 5
    },
    _count: {
      select: {
        articles: true,
        comments: true
      }
    }
  }
})
```

## 📝 معالجة الأخطاء

```typescript
import { handlePrismaError } from '@/lib/prisma'

try {
  const result = await prisma.article.create({ data })
} catch (error) {
  const errorMessage = handlePrismaError(error)
  return NextResponse.json(
    { error: errorMessage },
    { status: 400 }
  )
}
```

## 🚨 ملاحظات مهمة

1. **بيئة الإنتاج**: تأكد من استخدام connection pooling في الإنتاج
2. **الأداء**: استخدم `select` لجلب الحقول المطلوبة فقط
3. **N+1 Problem**: استخدم `include` بحكمة لتجنب استعلامات إضافية
4. **Transactions**: استخدم `prisma.$transaction()` للعمليات المترابطة
5. **Indexes**: تأكد من وجود indexes على الحقول المستخدمة في البحث

## 🔄 نقل البيانات من JSON

لنقل البيانات الموجودة من ملفات JSON:

```typescript
import { readFileSync } from 'fs'
import { prisma } from '@/lib/prisma'

async function migrateData() {
  // نقل المقالات
  const articlesData = JSON.parse(
    readFileSync('./data/articles.json', 'utf-8')
  )
  
  for (const article of articlesData) {
    await prisma.article.create({
      data: {
        ...article,
        publishedAt: article.published_at ? new Date(article.published_at) : null,
        createdAt: new Date(article.created_at),
        updatedAt: new Date(article.updated_at)
      }
    })
  }
  
  console.log('✅ تم نقل البيانات بنجاح')
}
```

## 🔗 روابط مفيدة

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization) 