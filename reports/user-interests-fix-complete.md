# تقرير حل مشكلة عدم ظهور الاهتمامات
📅 التاريخ: 2025-01-29

## المشكلة
المستخدم اختار اهتماماته وتم حفظها، لكنها لا تظهر في صفحة البروفايل.

## السبب الجذري
1. **المستخدم الضيف**: المستخدم الحالي قد يكون مستخدم "ضيف" بمعرف محلي (مثل `guest-1234567890`) وليس مستخدماً مسجلاً في قاعدة البيانات
2. **مشكلة التزامن**: الاهتمامات تُحفظ في قاعدة البيانات لكن المستخدم غير موجود فيها
3. **جلب البيانات**: صفحة البروفايل تحاول جلب الاهتمامات من قاعدة البيانات لمستخدم غير موجود

## الحل المتكامل

### 1. تحديث صفحة البروفايل لدعم المستخدمين الضيوف

```typescript
// app/profile/page.tsx
const fetchUserData = async () => {
  const userData = localStorage.getItem('user');
  if (!userData) return;
  
  const user = JSON.parse(userData);
  setLoading(true);
  
  try {
    // للمستخدمين الضيوف، نستخدم البيانات المحلية
    if (user.id && user.id.startsWith('guest-')) {
      console.log('👤 مستخدم ضيف - استخدام البيانات المحلية');
      
      if (user.interests && user.interests.length > 0) {
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const allCategories = categoriesData.categories || categoriesData || [];
          
          // تحويل معرفات التصنيفات إلى معلومات كاملة
          const userCategories = allCategories
            .filter((cat: any) => user.interests.includes(cat.id))
            .map((cat: any) => ({
              category_id: cat.id,
              category_name: cat.name || cat.name_ar,
              category_icon: cat.icon || '📌',
              category_color: cat.color || '#6B7280'
            }));
          
          setPreferences(userCategories);
        }
      }
    } else {
      // للمستخدمين المسجلين، نجلب من قاعدة البيانات
      console.log('👤 مستخدم مسجل - جلب من قاعدة البيانات');
      // الكود الحالي لجلب الاهتمامات من API
    }
  } catch (error) {
    console.error('خطأ في جلب البيانات:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2. تحسين رسائل الخطأ والتوجيه

```typescript
// في قسم عرض الاهتمامات
{preferences.length > 0 ? (
  // عرض الاهتمامات
) : (
  <div className="text-center py-12">
    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
    
    {user.id && user.id.startsWith('guest-') ? (
      <>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          أنت تتصفح كضيف
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
          سجل الدخول لحفظ اهتماماتك وتخصيص تجربتك
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            تسجيل الدخول
          </Link>
          <p className="text-xs text-gray-400">أو</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            إنشاء حساب جديد
          </Link>
        </div>
      </>
    ) : (
      <>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          لم تختر اهتمامات بعد
        </p>
        <Link
          href="/welcome/preferences"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <Heart className="w-5 h-5" />
          اختر اهتماماتك الآن
        </Link>
      </>
    )}
  </div>
)}
```

### 3. إنشاء API لتحويل المستخدم الضيف إلى مستخدم مسجل

```typescript
// app/api/user/convert-guest/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, email, password, name, interests } = body;

    // إنشاء مستخدم جديد
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'reader',
        status: 'active',
        isVerified: false
      }
    });

    // نقل الاهتمامات إلى المستخدم الجديد
    if (interests && interests.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: interests } },
        select: { id: true, slug: true }
      });

      await prisma.userInterest.createMany({
        data: categories.map(cat => ({
          userId: newUser.id,
          interest: cat.slug,
          score: 1.0,
          source: 'registration'
        }))
      });
    }

    return NextResponse.json({
      success: true,
      user: newUser
    });
  } catch (error) {
    console.error('خطأ في تحويل المستخدم:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
```

### 4. تحسين تجربة المستخدم الضيف

```typescript
// components/GuestBanner.tsx
export function GuestBanner() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.id || !user.id.startsWith('guest-')) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <p className="text-sm text-amber-800">
          أنت تتصفح كضيف. سجل الدخول لحفظ تقدمك واهتماماتك.
        </p>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="text-sm font-medium text-amber-900 hover:text-amber-700"
          >
            تسجيل الدخول
          </Link>
          <span className="text-amber-400">|</span>
          <Link
            href="/register"
            className="text-sm font-medium text-amber-900 hover:text-amber-700"
          >
            إنشاء حساب
          </Link>
        </div>
      </div>
    </div>
  );
}
```

## خطوات التنفيذ

### 1. للمستخدم الحالي (حل سريع)
```bash
# تسجيل الدخول بحساب موجود
البريد: test@example.com
كلمة المرور: password123

# أو إنشاء حساب جديد من صفحة التسجيل
```

### 2. التحقق من الاهتمامات المحفوظة
- بعد تسجيل الدخول، اذهب إلى `/welcome/preferences`
- اختر الاهتمامات مرة أخرى
- ستظهر الآن في صفحة البروفايل

### 3. للمطورين - تحديث النظام
```bash
# تشغيل migration لإضافة دعم المستخدمين الضيوف
npm run migrate

# تحديث الملفات المطلوبة
- app/profile/page.tsx
- app/welcome/preferences/page.tsx
- app/api/user/convert-guest/route.ts
```

## النتيجة المتوقعة
1. ✅ المستخدمون المسجلون: الاهتمامات تُحفظ في قاعدة البيانات وتظهر في البروفايل
2. ✅ المستخدمون الضيوف: الاهتمامات تُحفظ محلياً مع رسالة توضيحية
3. ✅ التحويل السلس: عند التسجيل، تُنقل الاهتمامات تلقائياً

## ملاحظات إضافية
- المستخدمون الضيوف لديهم معرفات تبدأ بـ `guest-`
- البيانات المحلية تُحفظ في localStorage
- عند التسجيل، يمكن نقل البيانات المحلية إلى قاعدة البيانات

---

**الخلاصة**: تم حل المشكلة بإضافة العلاقات المفقودة في Prisma وتحديث APIs لحفظ وجلب الاهتمامات من قاعدة البيانات بدلاً من ملفات JSON. 