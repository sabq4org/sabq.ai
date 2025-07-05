# إعداد حماية قاعدة البيانات - خطوات سريعة

## 1. إضافة متغيرات البيئة

أضف هذه المتغيرات إلى ملف `.env.local` أو `.env`:

```env
# تفعيل حماية قاعدة البيانات
ENABLE_DB_PROTECTION=true

# إعدادات النسخ الاحتياطي
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=7
BACKUP_STORAGE_PATH="./backups"

# تنبيهات الأمان (اختياري)
SECURITY_ALERT_EMAIL="your-email@example.com"
```

## 2. إضافة أوامر النسخ الاحتياطي

أضف هذه الأوامر إلى `package.json`:

```json
{
  "scripts": {
    "backup:full": "ts-node scripts/backup-database.ts",
    "backup:critical": "ts-node -e \"require('./scripts/backup-database').backupCriticalTables()\"",
    "backup:clean": "ts-node -e \"require('./scripts/backup-database').cleanOldBackups()\""
  }
}
```

## 3. إنشاء مجلد النسخ الاحتياطية

```bash
mkdir -p backups
echo "*.sql" >> backups/.gitignore
echo "*.sql.gz" >> backups/.gitignore
```

## 4. تشغيل أول نسخة احتياطية

```bash
npm run backup:full
```

## 5. جدولة النسخ الاحتياطي التلقائي (اختياري)

### على Linux/Mac (باستخدام cron):
```bash
# فتح crontab
crontab -e

# إضافة هذا السطر للنسخ اليومي في الساعة 2 صباحاً
0 2 * * * cd /path/to/your/project && npm run backup:full
```

### على Windows (باستخدام Task Scheduler):
1. افتح Task Scheduler
2. أنشئ مهمة جديدة
3. اضبطها لتشغيل `npm run backup:full` يومياً

## 6. اختبار الحماية

جرب حذف سجل من خلال API:
```bash
curl -X DELETE http://localhost:3001/api/articles/123
```

يجب أن تحصل على رد:
```json
{
  "error": "عمليات الحذف محظورة على جدول articles",
  "code": "DELETE_NOT_ALLOWED",
  "message": "هذا الجدول محمي من الحذف لأسباب أمنية"
}
```

## ✅ تم! قاعدة بياناتك محمية الآن من الحذف غير المقصود. 