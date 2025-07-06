# 🔧 إعداد متغيرات البيئة لـ Supabase

## 📝 انسخ هذه البيانات إلى ملف .env

```env
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:pedqef-Bagpyd-5midgy@db.icltugehqnpwuylfmqzf.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:pedqef-Bagpyd-5midgy@db.icltugehqnpwuylfmqzf.supabase.co:5432/postgres"

# Supabase Client Configuration
NEXT_PUBLIC_SUPABASE_URL=https://icltugehqnpwuylfmqzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbHR1Z2VocW5wd3V5bGZtcXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDM5MTgsImV4cCI6MjA2NjI3OTkxOH0.wCMgQgvihRm4tcJd0FAzlNUa0m0EZQZPvSIMQvKPXEw

# Existing Configuration (keep these)
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here"
```

## ✅ تم إعداد Supabase بنجاح!

**معلومات المشروع:**
- **Project ID**: icltugehqnpwuylfmqzf
- **Region**: West US (North California)
- **Database**: PostgreSQL
- **Status**: Active

---

## 🚀 الخطوة التالية: تشغيل الترحيل

بعد تحديث ملف .env، شغل هذا الأمر:

```bash
npx tsx scripts/setup-supabase-migration.ts
```

هذا سيقوم بـ:
1. ✅ إنشاء الجداول في Supabase
2. ✅ ترحيل البيانات الحالية
3. ✅ اختبار الاتصال
4. ✅ التحقق من الأداء 