#!/bin/bash

# سكريبت تطبيق تحسينات صفحة المقال
# يتم تشغيله من جذر المشروع

echo "🚀 بدء تطبيق تحسينات صفحة المقال..."

# التحقق من وجود الملفات المطلوبة
if [ ! -f "app/article/[id]/page_improved.tsx" ]; then
    echo "❌ خطأ: لم يتم العثور على الملف المحسن page_improved.tsx"
    exit 1
fi

if [ ! -f "app/article/[id]/article-styles-improved.css" ]; then
    echo "❌ خطأ: لم يتم العثور على ملف الأنماط المحسن"
    exit 1
fi

# إنشاء نسخ احتياطية
echo "📁 إنشاء نسخ احتياطية..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/article_page_${timestamp}"
mkdir -p "$backup_dir"

# نسخ الملفات الحالية
if [ -f "app/article/[id]/page.tsx" ]; then
    cp "app/article/[id]/page.tsx" "$backup_dir/page.tsx"
    echo "✅ تم حفظ نسخة احتياطية من page.tsx"
fi

if [ -f "app/article/[id]/article-styles.css" ]; then
    cp "app/article/[id]/article-styles.css" "$backup_dir/article-styles.css"
    echo "✅ تم حفظ نسخة احتياطية من article-styles.css"
fi

# تطبيق التحسينات
echo ""
echo "🔄 تطبيق التحسينات..."

# نسخ الملفات المحسنة
cp "app/article/[id]/page_improved.tsx" "app/article/[id]/page.tsx"
echo "✅ تم تحديث page.tsx"

cp "app/article/[id]/article-styles-improved.css" "app/article/[id]/article-styles.css"
echo "✅ تم تحديث article-styles.css"

# التحقق من النجاح
if [ $? -eq 0 ]; then
    echo ""
    echo "✨ تم تطبيق التحسينات بنجاح!"
    echo ""
    echo "📌 ملاحظات مهمة:"
    echo "1. تأكد من أن API المقالات يرجع بنية البيانات الصحيحة"
    echo "2. قد تحتاج إلى تحديث ملف /hooks/useInteractions.ts إذا لم يكن موجودًا"
    echo "3. النسخ الاحتياطية محفوظة في: $backup_dir"
    echo ""
    echo "🔄 أعد تشغيل الخادم لرؤية التغييرات:"
    echo "   npm run dev"
    echo ""
    echo "🔙 للتراجع عن التغييرات:"
    echo "   cp $backup_dir/* app/article/[id]/"
else
    echo "❌ حدث خطأ أثناء تطبيق التحسينات"
    exit 1
fi 