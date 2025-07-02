# تقرير حل مشكلة اختفاء الاهتمامات

## المشكلة
رغم أن المستخدم يختار الاهتمامات عبر واجهة التخصيص (onboarding أو التعديل)، إلا أن هذه الاهتمامات لا تظهر لاحقًا في الملف الشخصي، وتختفي بعد إعادة تحميل الصفحة أو تسجيل الخروج.

## الأسباب الجذرية

### 1. نموذج UserInterest موجود في Prisma لكن لم يتم توليد client
- نموذج `UserInterest` كان موجوداً في `prisma/schema.prisma` (السطور 257-270)
- لكن Prisma client لم يكن محدثاً

### 2. API `/api/profile/complete` كان يحفظ في الذاكرة فقط
- كان يستخدم arrays في الذاكرة بدلاً من قاعدة البيانات
- لم يكن يحفظ الاهتمامات في جدول `user_interests`

### 3. API `/api/auth/me` لم يكن يجلب الاهتمامات
- لم يكن يضم علاقة `interests` في استعلام Prisma
- لم يكن يرسل الاهتمامات في الاستجابة

### 4. صفحة الملف الشخصي كانت تعتمد على localStorage
- كانت تحاول جلب الاهتمامات من localStorage بدلاً من API
- كانت تستخدم `/api/users` بدلاً من `/api/auth/me`

## الحلول المطبقة

### 1. تحديث Prisma Client
```bash
rm -rf lib/generated/prisma && npx prisma generate
```

### 2. إعادة كتابة `/api/profile/complete`
```typescript
// حفظ الاهتمامات في قاعدة البيانات
await prisma.userInterest.deleteMany({
  where: { userId }
});

await prisma.userInterest.createMany({
  data: profileData.interests.map((interest: string) => ({
    userId,
    interest,
    score: 1.0,
    source: 'onboarding'
  }))
});
```

### 3. تحديث `/api/auth/me`
```typescript
const user = await prisma.user.findUnique({
  where: { id: decoded.id },
  include: {
    interests: {
      select: {
        interest: true,
        score: true
      },
      orderBy: {
        score: 'desc'
      }
    }
  }
});

// في الاستجابة
interests: user.interests.map(i => i.interest)
```

### 4. تحديث صفحة الملف الشخصي
```typescript
// في checkAuth
const response = await fetch('/api/auth/me', {
  credentials: 'include'
});

// في fetchUserData
if (user.interests && user.interests.length > 0) {
  // تحويل الاهتمامات إلى تصنيفات
  const userCategories = allCategories
    .filter((cat: any) => user.interests.includes(cat.slug) || user.interests.includes(cat.name))
    .map((cat: any) => ({
      category_id: cat.id,
      category_name: cat.name,
      category_icon: cat.icon,
      category_color: cat.color
    }));
  
  setPreferences(userCategories);
}
```

### 5. إنشاء جدول user_interests في قاعدة البيانات
```sql
CREATE TABLE IF NOT EXISTS user_interests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    interest VARCHAR(100) NOT NULL,
    score FLOAT DEFAULT 1.0,
    source VARCHAR(50) DEFAULT 'explicit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_interest (user_id, interest),
    INDEX idx_user_id (user_id),
    INDEX idx_interest (interest),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

## النتيجة النهائية

### ✅ الاهتمامات الآن:
1. تُحفظ في قاعدة البيانات عند اختيارها
2. تُجلب من API عند تسجيل الدخول
3. تظهر في الملف الشخصي بشكل دائم
4. لا تختفي عند إعادة التحميل
5. متزامنة بين جميع الأجهزة

### 🔄 تدفق البيانات:
1. **اختيار الاهتمامات** → POST `/api/profile/complete` → حفظ في `user_interests`
2. **تسجيل الدخول** → GET `/api/auth/me` → جلب الاهتمامات من قاعدة البيانات
3. **صفحة الملف الشخصي** → استخدام `user.interests` من localStorage المحدث
4. **تحديث الاهتمامات** → POST `/api/user/interests` → تحديث قاعدة البيانات

## التوصيات للمستقبل

1. **إضافة validation** للتأكد من أن الاهتمامات المختارة صحيحة
2. **إضافة caching** لتحسين الأداء
3. **إضافة analytics** لتتبع الاهتمامات الأكثر شيوعاً
4. **إضافة suggestions** لاقتراح اهتمامات بناءً على سلوك القراءة 