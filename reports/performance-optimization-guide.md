# دليل تحسين أداء موقع Sabq AI CMS

## 🚨 المشاكل المكتشفة والحلول

### 1. مشاكل الـ Build والـ Imports
- ✅ **تم إصلاح**: مشكلة `tailwind-merge.js` 
- ✅ **تم إصلاح**: experimental features في Next.js
- ✅ **تم حذف**: ملفات `.next` وإعادة البناء

### 2. تحسينات قاعدة البيانات (PlanetScale)

#### أضف Indexes للاستعلامات الشائعة:
```sql
-- إضافة indexes لتحسين الأداء
ALTER TABLE articles ADD INDEX idx_status_created (status, created_at);
ALTER TABLE articles ADD INDEX idx_category_status (category_id, status);
ALTER TABLE user_interests ADD INDEX idx_user_score (userId, score);
ALTER TABLE categories ADD INDEX idx_active_order (is_active, display_order);
```

### 3. تطبيق الكاش باستخدام React Query

```bash
npm install @tanstack/react-query
```

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      cacheTime: 10 * 60 * 1000, // 10 دقائق
      refetchOnWindowFocus: false,
    },
  },
});
```

### 4. تحسين استعلامات Prisma

```typescript
// بدلاً من:
const articles = await prisma.article.findMany({
  include: {
    author: true,
    category: true,
    // ... كل العلاقات
  }
});

// استخدم select للحقول المطلوبة فقط:
const articles = await prisma.article.findMany({
  select: {
    id: true,
    title: true,
    excerpt: true,
    featured_image: true,
    author: {
      select: { name: true, avatar: true }
    },
    category: {
      select: { name: true, color: true }
    }
  }
});
```

### 5. تحسين الصور

#### استخدام next/image مع placeholder:
```jsx
<Image
  src={article.featured_image}
  alt={article.title}
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL={article.blurDataURL}
  loading="lazy"
/>
```

#### إضافة image optimization في next.config.js:
```javascript
module.exports = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/avif', 'image/webp'],
  }
}
```

### 6. تفعيل API Route Caching

```typescript
// app/api/articles/route.ts
export const revalidate = 60; // كاش لمدة 60 ثانية

export async function GET(request: NextRequest) {
  // إضافة cache headers
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate');
  return response;
}
```

### 7. استخدام Lazy Loading للمكونات الثقيلة

```typescript
const Editor = dynamic(() => import('@/components/Editor/Editor'), {
  loading: () => <div>جاري تحميل المحرر...</div>,
  ssr: false
});

const Charts = dynamic(() => import('@/components/Charts'), {
  loading: () => <div>جاري تحميل الرسوم البيانية...</div>
});
```

### 8. تحسين Bundle Size

```bash
# تحليل حجم الـ bundle
npm install @next/bundle-analyzer

# في next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# تشغيل التحليل
ANALYZE=true npm run build
```

### 9. إضافة Service Worker للـ Offline Support

```javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});
```

### 10. مراقبة الأداء

```typescript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<any>) {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    console.log(`${name} took ${duration}ms`);
    
    // إرسال للـ analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
      });
    }
  });
}
```

## 🚀 خطة التنفيذ

### المرحلة 1: إصلاحات فورية (اليوم)
- [x] حذف `.next` وإعادة البناء
- [x] إصلاح imports المكسورة
- [ ] إضافة indexes لقاعدة البيانات

### المرحلة 2: تحسينات متوسطة (هذا الأسبوع)
- [ ] تطبيق React Query للكاش
- [ ] تحسين استعلامات Prisma
- [ ] Lazy loading للمكونات الثقيلة

### المرحلة 3: تحسينات متقدمة (الشهر القادم)
- [ ] Service Worker
- [ ] Edge Functions
- [ ] CDN للأصول الثابتة

## 📊 قياس النجاح

### قبل التحسينات:
- First Contentful Paint: ~3s
- Time to Interactive: ~5s
- Total Blocking Time: ~800ms

### الهدف بعد التحسينات:
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Total Blocking Time: <300ms

## 🛠️ أدوات المراقبة الموصى بها

1. **Vercel Analytics** - مدمج مع Next.js
2. **Google PageSpeed Insights** - لقياس Core Web Vitals
3. **React DevTools Profiler** - لتحليل أداء المكونات
4. **Chrome DevTools Performance** - لتحليل مفصل

## نصائح إضافية

1. **استخدم الـ Streaming** في Next.js 13+:
   ```tsx
   import { Suspense } from 'react';
   
   <Suspense fallback={<Loading />}>
     <SlowComponent />
   </Suspense>
   ```

2. **قلل عدد re-renders**:
   - استخدم `React.memo` للمكونات الثقيلة
   - استخدم `useMemo` و `useCallback` بحكمة

3. **حسّن الـ Middleware**:
   ```typescript
   export const config = {
     matcher: ['/((?!api|_next/static|favicon.ico).*)']
   };
   ```

تذكر: الأداء عملية مستمرة وليست مرة واحدة! 🎯 