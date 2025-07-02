# دليل النشر الشامل - مشروع صحيفة سبق

## نظرة عامة

هذا الدليل يوضح كيفية نشر مشروع صحيفة سبق (Next.js 15.3.3) على منصة Vercel للحصول على نسخة تجريبية قابلة للوصول عبر الإنترنت.

## المتطلبات الأساسية

- [x] Node.js 18+ مثبت
- [x] Git مثبت ومُعد
- [x] حساب GitHub
- [x] حساب Vercel (مجاني)
- [x] المشروع يعمل محلياً بدون أخطاء

## طرق النشر

### الطريقة الأولى: GitHub + Vercel (موصى بها)

#### 1. إعداد Repository

```bash
# التأكد من وجود git repository
git status

# إذا لم يكن موجوداً
git init
git remote add origin https://github.com/username/sabq-ai-cms.git
```

#### 2. رفع المشروع

```bash
# إضافة جميع الملفات
git add .

# إنشاء commit
git commit -m "feat: إعداد المشروع للنشر على Vercel"

# رفع إلى GitHub
git push -u origin main
```

#### 3. ربط Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول باستخدام GitHub
3. اضغط "New Project"
4. اختر repository: `sabq-ai-cms`
5. اتبع الإعدادات التالية:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

#### 4. متغيرات البيئة

في صفحة Project Settings > Environment Variables:

```
NODE_ENV=production
OPENAI_API_KEY=your_openai_key_here (اختياري)
```

### الطريقة الثانية: Vercel CLI

#### 1. تثبيت CLI

```bash
npm install -g vercel
```

#### 2. تسجيل الدخول

```bash
vercel login
```

#### 3. النشر

```bash
# نشر للتطوير
vercel

# نشر للإنتاج
vercel --prod
```

## إعدادات المشروع

### ملف vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "public": false,
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### ملف .vercelignore

```
__dev__/
frontend/
backups/
*.backup
*.bak
.next/
node_modules/
.cache/
*.log
logs/
docs/
reports/
*.md
!README.md
scripts/
test/
tests/
*.test.*
*.spec.*
.env.local
.env.development
.env.test
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
tmp/
temp/
*.tmp
.git/
.gitignore
yarn.lock
package-lock.json
*.tsbuildinfo
```

## اختبار النشر

### صفحات للاختبار

```
الرئيسية: https://your-domain.vercel.app/
الأخبار: https://your-domain.vercel.app/news
مقال: https://your-domain.vercel.app/article/[article-id]
لوحة التحكم: https://your-domain.vercel.app/dashboard
البحث: https://your-domain.vercel.app/search
```

### أجهزة الاختبار

- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Mobile (iOS Safari, Android Chrome)
- [ ] Tablet
- [ ] شبكات مختلفة (WiFi, 4G, 3G)

## مراقبة الأداء

### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Core Web Vitals

مراقبة:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

## حل المشاكل

### مشاكل البناء

```bash
# تشغيل البناء محلياً للتحقق من الأخطاء
npm run build

# فحص أخطاء TypeScript
npx tsc --noEmit

# فحص أخطاء ESLint
npm run lint
```

### مشاكل الشبكة

```bash
# فحص الاتصال
curl -I https://your-domain.vercel.app

# فحص DNS
nslookup your-domain.vercel.app
```

### مشاكل الأداء

1. **ضغط الصور**:
   ```bash
   npm install next-optimized-images
   ```

2. **تحسين الخطوط**:
   ```typescript
   import { Inter } from 'next/font/google'
   
   const inter = Inter({ subsets: ['latin'] })
   ```

3. **Lazy Loading**:
   ```typescript
   import dynamic from 'next/dynamic'
   
   const DynamicComponent = dynamic(() => import('./Component'), {
     loading: () => <p>Loading...</p>,
   })
   ```

## الأمان

### Headers الأمنية

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### متغيرات البيئة الآمنة

```bash
# في Vercel Dashboard
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=random-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app
```

## التحديث والصيانة

### التحديث التلقائي

```bash
# أي push إلى main branch سيؤدي إلى نشر تلقائي
git push origin main
```

### النسخ الاحتياطية

```bash
# تصدير البيانات
npm run export-data

# حفظ في مجلد backups
cp -r data/ backups/$(date +%Y%m%d_%H%M%S)/
```

### مراقبة الأخطاء

استخدم Vercel Functions Logs:
```bash
vercel logs https://your-domain.vercel.app
```

## الخطوات النهائية

1. **اختبار شامل**:
   - [ ] جميع الصفحات تعمل
   - [ ] API endpoints تستجيب
   - [ ] الصور تظهر بشكل صحيح
   - [ ] التنقل يعمل بسلاسة

2. **تحسين الأداء**:
   - [ ] سرعة التحميل < 3 ثواني
   - [ ] Core Web Vitals في النطاق الأخضر
   - [ ] متوافق مع الأجهزة المحمولة

3. **الأمان**:
   - [ ] HTTPS مُفعل
   - [ ] Headers الأمنية موجودة
   - [ ] لا توجد معلومات حساسة مكشوفة

4. **المراقبة**:
   - [ ] Analytics مُفعل
   - [ ] Error tracking يعمل
   - [ ] Performance monitoring نشط

## الدعم والمساعدة

- [وثائق Vercel](https://vercel.com/docs)
- [وثائق Next.js](https://nextjs.org/docs)
- [مجتمع Vercel](https://github.com/vercel/vercel/discussions)
- [مجتمع Next.js](https://github.com/vercel/next.js/discussions)

---

**ملاحظة**: هذا المشروع مُعد للاختبار والتطوير. للاستخدام في الإنتاج، تأكد من مراجعة جميع إعدادات الأمان والأداء.
