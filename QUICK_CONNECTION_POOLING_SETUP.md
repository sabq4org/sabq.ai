# إعداد Connection Pooling السريع

## الخطوات الأساسية

### 1. أنشئ ملف `.env` في المجلد الرئيسي:

```bash
touch .env
```

### 2. أضف المتغيرات التالية:

```env
# Connection Pool URL (استخدم هذا في التطبيق)
DATABASE_URL=postgres://postgres.apbkobhfnmcqqzqeeqss:[YOUR_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# Direct URL (للـ migrations فقط)
DIRECT_URL=postgres://postgres.apbkobhfnmcqqzqeeqss:[YOUR_PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres

# إعدادات أساسية أخرى
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. ولد Prisma Client:

```bash
npx prisma generate
```

### 4. اختبر الاتصال:

```bash
node scripts/test-db-connection.js
```

### 5. شغل التطبيق:

```bash
npm run dev
# أو
./start-sabq.sh
```

## ملاحظات مهمة:

- **المنفذ 6543**: Connection Pool (pgBouncer) - استخدم هذا في التطبيق
- **المنفذ 5432**: اتصال مباشر - للـ migrations فقط
- **SSL**: مفعّل تلقائياً (`sslmode=require`)
- **حجم Pool**: افتراضي 10 اتصالات

## مؤشرات النجاح:

✅ التطبيق يعمل بدون أخطاء  
✅ سرعة الاستجابة أفضل  
✅ القدرة على معالجة طلبات متزامنة  
✅ لا توجد أخطاء "too many connections"

## للمساعدة:

راجع الملف الكامل: `CONNECTION_POOLING_SETUP.md` 