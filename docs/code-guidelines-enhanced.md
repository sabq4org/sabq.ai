# 📋 دليل الهندسة البرمجية المتقدم - سبق الذكية CMS

## 📖 مقدمة

يهدف هذا الدليل إلى وضع معايير واضحة ومحددة لكتابة الكود في مشروع سبق الذكية CMS، مع التركيز على الجودة، الأداء، والأمان.

---

## 🎯 المبادئ الأساسية

### 1. **الوضوح والبساطة**
- اكتب كود واضح ومفهوم
- استخدم أسماء متغيرات ودوال واضحة
- تجنب التعقيد غير الضروري

### 2. **الأداء والكفاءة**
- قلل من الاستعلامات إلى قاعدة البيانات
- استخدم التخزين المؤقت بحكمة
- اعتمد على التحسينات الأصلية في Next.js

### 3. **الأمان أولاً**
- لا تثق في المدخلات من المستخدم
- استخدم التحقق والتنقيح دائماً
- قم بتشفير البيانات الحساسة

---

## 🏗️ هيكل المشروع

### 📂 تنظيم الملفات

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── globals.css        # Global CSS
│   └── layout.tsx         # Root Layout
├── components/            # React Components
│   ├── ui/               # UI Components
│   ├── forms/            # Form Components
│   └── layout/           # Layout Components
├── lib/                   # Utility Libraries
│   ├── utils.ts          # General Utilities
│   ├── auth.ts           # Authentication
│   └── database.ts       # Database Utils
├── hooks/                 # Custom React Hooks
├── types/                 # TypeScript Types
└── constants/            # Application Constants
```

### 📝 قواعد التسمية

#### المتغيرات والدوال
```typescript
// ✅ جيد
const userName = 'أحمد';
const fetchUserData = async () => {};

// ❌ سيء
const u = 'أحمد';
const fd = async () => {};
```

#### المكونات
```typescript
// ✅ جيد
const UserProfile = () => {};
const ArticleCard = () => {};

// ❌ سيء
const userprofile = () => {};
const aC = () => {};
```

#### الملفات
```bash
# ✅ جيد
UserProfile.tsx
ArticleCard.tsx
user-settings.ts

# ❌ سيء
userprofile.tsx
aC.tsx
userSettings.ts
```

---

## 🔧 معايير الكود

### TypeScript

#### 1. **استخدام Types بدلاً من any**
```typescript
// ✅ جيد
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'author';
}

// ❌ سيء
const user: any = {};
```

#### 2. **تعريف Interfaces واضحة**
```typescript
// ✅ جيد
interface ArticleProps {
  title: string;
  content: string;
  authorId: string;
  publishedAt?: Date;
}

// ❌ سيء
interface Props {
  data: any;
}
```

#### 3. **استخدام Enums للقيم الثابتة**
```typescript
// ✅ جيد
enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  SUBSCRIBER = 'subscriber'
}

// ❌ سيء
const roles = {
  admin: 'admin',
  editor: 'editor'
};
```

### React Components

#### 1. **مكونات وظيفية مع Hooks**
```typescript
// ✅ جيد
const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  return (
    <div className="user-profile">
      {loading ? <Skeleton /> : <UserCard user={user} />}
    </div>
  );
};

// ❌ سيء
function UserProfile(props: any) {
  const [data, setData] = useState(null);
  // ...
}
```

#### 2. **استخدام Custom Hooks**
```typescript
// ✅ جيد
const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await api.users.get(userId);
        setUser(userData);
      } catch (err) {
        setError('فشل في جلب بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};
```

### API Routes

#### 1. **معالجة الأخطاء**
```typescript
// ✅ جيد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return NextResponse.json(
      { error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}

// ❌ سيء
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json(user);
}
```

#### 2. **التحقق من الإدخال**
```typescript
// ✅ جيد
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون أكثر من حرفين'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    
    // إنشاء المستخدم
    const user = await createUser(validatedData);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'خطأ في إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
```

### قاعدة البيانات

#### 1. **تحسين الاستعلامات**
```typescript
// ✅ جيد
const articles = await prisma.article.findMany({
  where: {
    published: true,
    publishedAt: {
      lte: new Date()
    }
  },
  include: {
    author: {
      select: {
        name: true,
        avatar: true
      }
    },
    tags: true
  },
  orderBy: {
    publishedAt: 'desc'
  },
  take: 10
});

// ❌ سيء
const articles = await prisma.article.findMany({
  include: {
    author: true,
    tags: true,
    comments: {
      include: {
        author: true,
        replies: true
      }
    }
  }
});
```

#### 2. **استخدام Transactions**
```typescript
// ✅ جيد
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      name: 'أحمد',
      email: 'ahmed@example.com'
    }
  });

  await tx.userProfile.create({
    data: {
      userId: user.id,
      bio: 'كاتب محترف'
    }
  });

  return user;
});

// ❌ سيء
const user = await prisma.user.create({
  data: { name: 'أحمد', email: 'ahmed@example.com' }
});

await prisma.userProfile.create({
  data: { userId: user.id, bio: 'كاتب محترف' }
});
```

---

## 🔒 معايير الأمان

### 1. **التحقق من الهوية**
```typescript
// ✅ جيد
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول أولاً' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || !user.active) {
    return NextResponse.json(
      { error: 'حساب غير مفعل' },
      { status: 403 }
    );
  }

  // باقي الكود...
}
```

### 2. **تنقيح البيانات**
```typescript
// ✅ جيد
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

// ❌ سيء
const content = request.body.content; // بدون تنقيح
```

### 3. **تحديد المعدل (Rate Limiting)**
```typescript
// ✅ جيد
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  
  const { success } = await rateLimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'تم تجاوز الحد المسموح من الطلبات' },
      { status: 429 }
    );
  }

  // باقي الكود...
}
```

---

## 🎨 معايير التصميم

### 1. **Tailwind CSS**
```tsx
// ✅ جيد
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
  <h2 className="text-xl font-semibold text-gray-900">العنوان</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
    حفظ
  </button>
</div>

// ❌ سيء
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ color: '#333' }}>العنوان</h2>
</div>
```

### 2. **تصميم متجاوب**
```tsx
// ✅ جيد
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {articles.map(article => (
    <ArticleCard key={article.id} article={article} />
  ))}
</div>

// ❌ سيء
<div className="flex flex-wrap">
  {articles.map(article => (
    <div style={{ width: '300px' }}>
      <ArticleCard key={article.id} article={article} />
    </div>
  ))}
</div>
```

### 3. **دعم RTL**
```tsx
// ✅ جيد
<div className="text-right rtl:text-left">
  <p className="mr-4 rtl:ml-4 rtl:mr-0">النص العربي</p>
</div>

// ❌ سيء
<div className="text-right">
  <p className="mr-4">النص العربي</p>
</div>
```

---

## 📊 معايير الأداء

### 1. **تحسين الصور**
```tsx
// ✅ جيد
import Image from 'next/image';

<Image
  src="/article-image.jpg"
  alt="وصف الصورة"
  width={800}
  height={600}
  className="rounded-lg"
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// ❌ سيء
<img src="/article-image.jpg" alt="صورة" />
```

### 2. **تحميل متقدم**
```tsx
// ✅ جيد
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <div className="animate-pulse">جاري التحميل...</div>,
    ssr: false
  }
);
```

### 3. **تخزين مؤقت**
```typescript
// ✅ جيد
import { unstable_cache } from 'next/cache';

const getArticles = unstable_cache(
  async () => {
    return await prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' }
    });
  },
  ['articles'],
  {
    revalidate: 3600, // ساعة واحدة
    tags: ['articles']
  }
);
```

---

## 🧪 معايير الاختبار

### 1. **اختبارات الوحدة**
```typescript
// ✅ جيد
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('should display user name', () => {
    const user = { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com' };
    
    render(<UserCard user={user} />);
    
    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
  });

  it('should handle missing user data', () => {
    render(<UserCard user={null} />);
    
    expect(screen.getByText('مستخدم غير متاح')).toBeInTheDocument();
  });
});
```

### 2. **اختبارات API**
```typescript
// ✅ جيد
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/users/route';

describe('/api/users', () => {
  it('should return users list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        users: expect.any(Array),
        total: expect.any(Number)
      })
    );
  });
});
```

---

## 📚 المراجع والموارد

### أدوات التطوير
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### مكتبات مفيدة
- **zod**: للتحقق من البيانات
- **react-hook-form**: لإدارة النماذج
- **react-query**: لإدارة البيانات
- **framer-motion**: للرسوم المتحركة

### أدوات الجودة
- **ESLint**: لفحص الكود
- **Prettier**: لتنسيق الكود
- **TypeScript**: للتحقق من النوع
- **Jest**: للاختبارات

---

## 🔄 عملية المراجعة

### قبل إرسال Pull Request

1. **تشغيل الاختبارات**
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```

2. **مراجعة الكود**
   - تأكد من وضوح التسمية
   - تحقق من وجود التعليقات المناسبة
   - راجع الأداء والأمان

3. **تحديث الوثائق**
   - أضف وثائق للميزات الجديدة
   - حدث المراجع إذا لزم الأمر

### معايير الموافقة

- ✅ جميع الاختبارات تمر
- ✅ لا توجد أخطاء TypeScript
- ✅ لا توجد تحذيرات ESLint
- ✅ الكود متوافق مع المعايير
- ✅ الوثائق محدثة

---

*هذا الدليل مستند حي يتم تحديثه بانتظام لضمان أفضل ممارسات التطوير في مشروع سبق الذكية CMS.* 