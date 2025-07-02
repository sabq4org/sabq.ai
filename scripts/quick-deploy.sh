#!/bin/bash

echo "🚀 نشر سريع لـ sabq-ai-cms"
echo "========================="

# 1. التحقق من الملفات المطلوبة
if [ ! -f ".env.production" ]; then
    echo "❌ ملف .env.production غير موجود!"
    echo "انسخ env.production.example وعدّل القيم"
    exit 1
fi

# 2. البناء للإنتاج
echo "🏗️  بناء التطبيق..."
NODE_ENV=production npm run build:production

if [ $? -ne 0 ]; then
    echo "❌ فشل البناء!"
    exit 1
fi

# 3. إنشاء ملف النشر
echo "📦 إنشاء حزمة النشر..."
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p $DEPLOY_DIR

# نسخ الملفات المطلوبة
cp -r .next $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r prisma $DEPLOY_DIR/
cp package*.json $DEPLOY_DIR/
cp .env.production $DEPLOY_DIR/.env
cp -r lib/generated $DEPLOY_DIR/lib/

# إضافة التصنيفات المُصدَّرة
mkdir -p $DEPLOY_DIR/data/imports
cp data/exports/categories-export-*.json $DEPLOY_DIR/data/imports/ 2>/dev/null

# إنشاء سكريبت البدء
cat > $DEPLOY_DIR/start.sh <<'EOF'
#!/bin/bash
echo "🚀 بدء تشغيل sabq-ai-cms"

# تثبيت التبعيات
npm ci --production

# توليد Prisma Client
npx prisma generate

# تطبيق تغييرات قاعدة البيانات
npx prisma db push

# بدء التطبيق
NODE_ENV=production npm start
EOF

chmod +x $DEPLOY_DIR/start.sh

# إنشاء README
cat > $DEPLOY_DIR/README.md <<'EOF'
# نشر sabq-ai-cms

## خطوات النشر:

1. ارفع هذا المجلد إلى الخادم
2. تأكد من وجود Node.js 20+ 
3. شغل: `./start.sh`

## استيراد التصنيفات:

بعد تشغيل التطبيق، يمكنك استيراد التصنيفات من:
- الذهاب إلى: /dashboard/categories
- النقر على "استيراد"
- اختيار الملف من data/imports/

## المتطلبات:

- Node.js 20+
- MySQL أو PostgreSQL
- PM2 (اختياري)
EOF

# ضغط الملفات
tar -czf $DEPLOY_DIR.tar.gz $DEPLOY_DIR
rm -rf $DEPLOY_DIR

echo "✅ تم إنشاء حزمة النشر: $DEPLOY_DIR.tar.gz"
echo ""
echo "📌 الخطوات التالية:"
echo "1. ارفع الملف إلى الخادم"
echo "2. فك الضغط: tar -xzf $DEPLOY_DIR.tar.gz"
echo "3. ادخل المجلد: cd $DEPLOY_DIR"
echo "4. شغل: ./start.sh" 