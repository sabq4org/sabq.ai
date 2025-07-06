# تصحيح عنوان قاعدة البيانات

## المشكلة
اسم المضيف الحالي خاطئ:
```
db-sabq-do-user-18651948-0.h.db.ondigitalocean.com
```

لاحظ الحرف `.h` الإضافي قبل `.db.ondigitalocean.com`

## الحل
اسم المضيف الصحيح يجب أن يكون:
```
db-sabq-do-user-18651948-0.db.ondigitalocean.com
```

## DATABASE_URL الصحيح
```
DATABASE_URL="postgresql://doadmin:YOUR_PASSWORD_HERE@db-sabq-do-user-18651948-0.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

## خطوات الإصلاح
1. افتح ملف `.env`
2. ابحث عن `DATABASE_URL`
3. احذف `.h` من اسم المضيف
4. احفظ الملف
5. أعد تشغيل التطبيق 