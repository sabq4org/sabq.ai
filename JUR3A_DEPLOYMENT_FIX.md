# حل مشكلة Deployment على jur3a.ai

## 🔴 المشكلة
- خطأ 400 Bad Request عند تحميل ملفات JavaScript
- الخادم يرجع HTML بدلاً من JavaScript
- MIME type خاطئ ('text/html' بدلاً من 'application/javascript')

## 🛠️ الحلول

### 1. تنظيف وإعادة البناء
```bash
# على الخادم أو في بيئة الإنتاج
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### 2. التحقق من إعدادات Vercel/Netlify

#### إذا كنت تستخدم Vercel:
1. افتح [vercel.com](https://vercel.com)
2. اذهب لإعدادات المشروع
3. تأكد من:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "framework": "nextjs"
   }
   ```

#### إذا كنت تستخدم Netlify:
أنشئ `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    cache-control = "public, max-age=31536000, immutable"
```

### 3. إعدادات Next.js للإنتاج

تحديث `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إضافة domain للصور
  images: {
    domains: ['jur3a.ai', 'www.jur3a.ai'],
    unoptimized: true // مؤقتاً للتجربة
  },
  
  // تعطيل strict mode في الإنتاج
  reactStrictMode: false,
  
  // إعدادات البناء
  output: 'standalone',
  
  // تحسين الإنتاج
  productionBrowserSourceMaps: false,
  compress: true,
  
  // معالجة المسارات
  trailingSlash: true,
  
  // إضافة headers
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
```

### 4. إضافة middleware لمعالجة المسارات

إنشاء/تحديث `middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // تأكد من المسارات الصحيحة للملفات الثابتة
  if (pathname.startsWith('/_next/static/')) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // تحديد Content-Type الصحيح
    if (pathname.endsWith('.js')) {
      response.headers.set('Content-Type', 'application/javascript')
    } else if (pathname.endsWith('.css')) {
      response.headers.set('Content-Type', 'text/css')
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
```

### 5. التحقق من بيئة الإنتاج

أنشئ `.env.production`:
```env
NEXT_PUBLIC_BASE_URL=https://jur3a.ai
NODE_ENV=production
```

### 6. إعادة النشر

#### Vercel:
```bash
vercel --prod
```

#### Netlify:
```bash
netlify deploy --prod
```

#### خادم مخصص:
```bash
# بناء للإنتاج
npm run build

# تشغيل الخادم
npm start
```

### 7. استخدام CDN (حل مؤقت)

إذا استمرت المشكلة، يمكن استخدام CDN:
```html
<!-- في app/layout.tsx -->
<Script
  src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"
  strategy="beforeInteractive"
/>
```

### 8. فحص السجلات

تحقق من سجلات الخادم:
```bash
# Vercel
vercel logs

# PM2
pm2 logs

# Docker
docker logs container-name
```

## 🔍 التشخيص المتقدم

### فحص رؤوس الاستجابة
```bash
curl -I https://jur3a.ai/_next/static/chunks/webpack-1f7670895152bca9.js
```

### التحقق من البناء
```bash
# تأكد من وجود الملفات
ls -la .next/static/chunks/
```

### فحص الأذونات
```bash
# تأكد من صلاحيات القراءة
chmod -R 755 .next
```

## ⚡ الحل السريع

1. **حذف المجلدات المؤقتة**:
   ```bash
   rm -rf .next node_modules/.cache
   ```

2. **إعادة التثبيت والبناء**:
   ```bash
   npm ci
   npm run build
   ```

3. **إعادة النشر**:
   ```bash
   # أو استخدم واجهة Vercel/Netlify
   git push origin main
   ```

## 📞 إذا استمرت المشكلة

1. تحقق من لوحة تحكم الاستضافة
2. راجع سجلات الأخطاء
3. تواصل مع الدعم الفني للاستضافة
4. جرب نشر نسخة بسيطة للاختبار

---

*آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}* 