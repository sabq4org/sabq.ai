# تقرير ربط المشروع بقاعدة بيانات PlanetScale

## 🎯 الهدف
ربط مشروع Next.js/Prisma بقاعدة بيانات PlanetScale لحفظ بيانات التفاعلات والسلوك.

## ✅ ما تم إنجازه

### 1. إنشاء دليل شامل
- **الملف**: `docs/PLANETSCALE_CONNECTION_GUIDE.md`
- **المحتوى**: دليل مفصل بالعربية يشرح كل خطوة

### 2. إنشاء سكريبت الإعداد
- **الملف**: `scripts/setup-planetscale.sh`
- **الوظيفة**: إعداد البيئة تلقائياً
- **المميزات**:
  - إنشاء ملف .env.local
  - تثبيت الحزم المطلوبة
  - توليد Prisma Client
  - مزامنة قاعدة البيانات

### 3. إنشاء سكريبت الاختبار
- **الملف**: `scripts/test-planetscale-connection.js`
- **الوظيفة**: اختبار الاتصال وعرض معلومات قاعدة البيانات
- **المميزات**:
  - اختبار الاتصال
  - عرض الجداول الموجودة
  - إحصائيات البيانات
  - رسائل خطأ مفصلة

## 📋 الخطوات المطلوبة

### 1. إعداد البيئة
```bash
# تشغيل سكريبت الإعداد
./scripts/setup-planetscale.sh

# أو يدوياً:
# 1. إنشاء .env.local
# 2. إضافة DATABASE_URL
# 3. npm install mysql2
# 4. npx prisma generate
# 5. npx prisma db push
```

### 2. اختبار الاتصال
```bash
# تثبيت mysql2 إذا لم يكن مثبتاً
npm install mysql2

# تشغيل اختبار الاتصال
node scripts/test-planetscale-connection.js
```

### 3. إضافة جداول التتبع الجديدة
أضف هذه النماذج إلى `prisma/schema.prisma`:

```prisma
model Impression {
  id            String   @id @default(uuid())
  userId        String?  @map("user_id")
  contentId     String   @map("content_id")
  contentType   String   @map("content_type")
  impressionType String  @map("impression_type")
  metadata      Json?
  createdAt     DateTime @default(now()) @map("created_at")
  
  @@index([userId])
  @@index([contentId])
  @@index([createdAt])
  @@map("impressions")
}

model UserBehavior {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  sessionId String?  @map("session_id")
  action    String
  page      String?
  element   String?
  value     String?
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")
  
  @@index([userId])
  @@index([sessionId])
  @@index([action])
  @@index([createdAt])
  @@map("user_behavior")
}
```

### 4. تطبيق التغييرات
```bash
# توليد Prisma Client الجديد
npx prisma generate

# دفع التغييرات لقاعدة البيانات
npx prisma db push
```

## 🔧 APIs المطلوبة

### 1. API تسجيل الانطباعات
- **المسار**: `/api/track/impression`
- **الطريقة**: POST
- **البيانات**: userId, contentId, contentType, impressionType

### 2. API تسجيل السلوك
- **المسار**: `/api/track/behavior`
- **الطريقة**: POST
- **البيانات**: userId, sessionId, action, page, element, value

## 📊 مثال الاستخدام

```typescript
// في أي مكون React
import { useTracking } from '@/hooks/useTracking';

function MyComponent() {
  const { trackImpression, trackBehavior } = useTracking();
  
  // تسجيل انطباع
  useEffect(() => {
    trackImpression('article-123', 'article', 'view');
  }, []);
  
  // تسجيل نقرة
  const handleClick = () => {
    trackBehavior('click', 'button', 'subscribe');
  };
  
  return <button onClick={handleClick}>اشترك</button>;
}
```

## ⚠️ ملاحظات مهمة

### الأمان
- **لا تشارك** ملف .env.local
- **لا ترفع** بيانات الاتصال على Git
- **استخدم** متغيرات بيئة مختلفة للإنتاج

### الأداء
- استخدم الفهارس (indexes) للاستعلامات المتكررة
- راقب استخدام قاعدة البيانات من PlanetScale Dashboard
- فعّل التخزين المؤقت عند الحاجة

### النسخ الاحتياطي
- احتفظ بنسخ احتياطية دورية
- استخدم ميزة branching في PlanetScale
- اختبر على فرع تطوير قبل الإنتاج

## 🚀 الخطوات التالية

1. **تشغيل المشروع**:
   ```bash
   npm run dev
   ```

2. **التحقق من الاتصال**:
   - افتح: http://localhost:3000/api/health
   - يجب أن ترى: "✅ اتصال قاعدة البيانات ناجح"

3. **استخدام Prisma Studio**:
   ```bash
   npx prisma studio
   ```

4. **البدء في التتبع**:
   - استخدم hooks التتبع في المكونات
   - راقب البيانات في قاعدة البيانات
   - حلل السلوك وحسّن التجربة

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع سجلات الأخطاء في Terminal
2. تحقق من PlanetScale Dashboard
3. تأكد من صحة DATABASE_URL
4. راجع الدليل الشامل في `docs/PLANETSCALE_CONNECTION_GUIDE.md`

---

✅ **المشروع جاهز الآن للاتصال بـ PlanetScale!** 