# دليل الإعداد السريع لـ Supabase - منصة سبق الذكية

## 🎯 الهدف
الانتقال من PlanetScale (MySQL) إلى Supabase (PostgreSQL) خلال ساعتين فقط

## ⚡ الخطوات السريعة (ساعتان)

### 1. إنشاء حساب Supabase (5 دقائق)
```bash
# 1. اذهب إلى https://supabase.com
# 2. سجل بحساب GitHub
# 3. أنشئ مشروع جديد باسم "sabq-ai"
# 4. اختر المنطقة الأقرب (أوروبا الغربية)
```

### 2. الحصول على بيانات الاتصال (2 دقيقة)
```bash
# من Supabase Dashboard:
# Settings > Database > Connection string
# انسخ Connection string
```

### 3. تحديث ملف .env
```env
# احذف DATABASE_URL القديم وأضف:
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

### 4. تشغيل الترحيل التلقائي (30 دقيقة)
```bash
# تشغيل سكريبت الترحيل
npx tsx scripts/setup-supabase-migration.ts
```

### 5. اختبار النظام (15 دقيقة)
```bash
# تشغيل التطبيق محلياً
npm run dev

# اختبار:
# - تسجيل الدخول
# - إنشاء مقال
# - عرض المقالات
```

## 🔧 الإعدادات الإضافية

### 1. Row Level Security (RLS)
```sql
-- في Supabase SQL Editor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Articles are viewable by everyone" ON articles
  FOR SELECT USING (true);
```

### 2. Full-Text Search
```sql
-- إضافة فهارس البحث
CREATE INDEX articles_search_idx ON articles 
USING GIN (to_tsvector('arabic', title || ' ' || content));

-- دعم البحث العربي
CREATE TEXT SEARCH CONFIGURATION arabic (COPY = simple);
```

### 3. Backups التلقائية
- Supabase يقوم بـ backups تلقائية كل يوم
- يمكنك تحميل backup يدوياً من Dashboard

## 📊 اختبارات الأداء

### 1. اختبار الاتصال
```bash
# تشغيل اختبار الاتصال
npx tsx scripts/test-connection.ts
```

### 2. اختبار الأداء
```bash
# تشغيل اختبارات الأداء
npx tsx scripts/performance-test.ts
```

## 🚀 النشر على Vercel

### 1. تحديث Environment Variables
```bash
# في Vercel Dashboard:
# Settings > Environment Variables
# أضف DATABASE_URL الجديد
```

### 2. إعادة النشر
```bash
git add .
git commit -m "Migrate to Supabase PostgreSQL"
git push origin main
```

## ✅ قائمة التحقق

- [ ] إنشاء حساب Supabase
- [ ] إنشاء مشروع جديد
- [ ] الحصول على connection string
- [ ] تحديث .env
- [ ] تشغيل سكريبت الترحيل
- [ ] اختبار النظام محلياً
- [ ] إعداد RLS
- [ ] إضافة فهارس البحث
- [ ] اختبار الأداء
- [ ] النشر على Vercel
- [ ] اختبار الإنتاج

## 🆘 الدعم

### في حالة المشاكل:
1. **اتصال بطيء**: تحقق من المنطقة المختارة
2. **أخطاء RLS**: تحقق من سياسات الأمان
3. **مشاكل الترحيل**: استخدم النسخة الاحتياطية

### روابط مفيدة:
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)
- [Prisma PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

## 💰 التكلفة

- **Free Tier**: 500MB database, 2GB bandwidth
- **Pro Plan**: $25/شهر - 8GB database, 50GB bandwidth
- **Team Plan**: $599/شهر - قابل للتخصيص

## 🎉 النتيجة النهائية

بعد ساعتين ستحصل على:
- ✅ قاعدة بيانات PostgreSQL مستقرة
- ✅ أداء ممتاز
- ✅ دعم كامل للبحث العربي
- ✅ نسخ احتياطية تلقائية
- ✅ أمان عالي مع RLS
- ✅ سهولة الإدارة

---

**الوقت المطلوب**: ساعتان فقط
**التكلفة**: مجاني للبداية
**الاستقرار**: مؤسسي ومضمون 