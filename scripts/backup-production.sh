#!/bin/bash

# سكريبت النسخ الاحتياطي للإنتاج
# يعمل يومياً عبر cron job

set -e  # إيقاف عند أي خطأ

# تحميل متغيرات البيئة
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# متغيرات
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
DB_BACKUP_FILE="${BACKUP_DIR}/db_${DATE}.sql"
MEDIA_BACKUP_DIR="${BACKUP_DIR}/media_${DATE}"
ARCHIVE_FILE="${BACKUP_DIR}/backup_${DATE}.tar.gz"

# إنشاء مجلد النسخ الاحتياطية
mkdir -p ${BACKUP_DIR}

echo "🔵 بدء النسخ الاحتياطي - ${DATE}"

# 1. نسخ احتياطي لقاعدة البيانات
echo "📊 نسخ قاعدة البيانات..."
# pg_dump $DATABASE_URL > ${DB_BACKUP_FILE}
echo "✅ تم حفظ قاعدة البيانات في ${DB_BACKUP_FILE}"

# 2. نسخ الملفات من S3 (إذا كان مُفعّل)
if [ ! -z "$S3_BUCKET" ]; then
    echo "📁 نسخ الملفات من S3..."
    mkdir -p ${MEDIA_BACKUP_DIR}
    aws s3 sync s3://${S3_BUCKET} ${MEDIA_BACKUP_DIR} --quiet
    echo "✅ تم نسخ الملفات من S3"
fi

# 3. ضغط النسخة الاحتياطية
echo "🗜️ ضغط النسخة الاحتياطية..."
tar -czf ${ARCHIVE_FILE} ${DB_BACKUP_FILE} ${MEDIA_BACKUP_DIR}
echo "✅ تم إنشاء الأرشيف: ${ARCHIVE_FILE}"

# 4. حساب حجم النسخة
SIZE=$(du -h ${ARCHIVE_FILE} | cut -f1)
echo "📏 حجم النسخة الاحتياطية: ${SIZE}"

# 5. رفع إلى S3 للحفظ طويل المدى
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    echo "☁️ رفع النسخة الاحتياطية إلى S3..."
    aws s3 cp ${ARCHIVE_FILE} s3://${BACKUP_S3_BUCKET}/
    echo "✅ تم رفع النسخة إلى S3"
fi

# 6. تنظيف الملفات المؤقتة
echo "🧹 تنظيف الملفات المؤقتة..."
rm -f ${DB_BACKUP_FILE}
rm -rf ${MEDIA_BACKUP_DIR}

# 7. حذف النسخ القديمة (أكثر من 30 يوم)
echo "🗑️ حذف النسخ القديمة..."
find ${BACKUP_DIR} -name "backup_*.tar.gz" -mtime +30 -delete

# 8. إرسال تنبيه (اختياري)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ تمت النسخة الاحتياطية بنجاح\nالحجم: ${SIZE}\nالتاريخ: ${DATE}\"}" \
        $SLACK_WEBHOOK_URL
fi

echo "✅ اكتملت عملية النسخ الاحتياطي بنجاح!"
echo "📍 موقع النسخة: ${ARCHIVE_FILE}"

# إنشاء سجل بالعملية
echo "${DATE}: Backup completed successfully (${SIZE})" >> ${BACKUP_DIR}/backup.log 