#!/bin/bash

# سكريبت إصلاح صلاحيات البناء
# يحل جميع مشاكل الصلاحيات المتعلقة بـ Next.js

echo "🔧 بدء إصلاح صلاحيات المشروع..."

# الحصول على اسم المستخدم الحالي
CURRENT_USER=$(whoami)
echo "👤 المستخدم الحالي: $CURRENT_USER"

# التحقق من وجود المجلدات المشكلة
PROBLEMATIC_DIRS=(".next" "node_modules/.cache" ".turbo")

# حذف المجلدات المشكلة
echo "🗑️  حذف المجلدات القديمة..."
for dir in "${PROBLEMATIC_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   - حذف $dir"
        rm -rf "$dir" 2>/dev/null || sudo rm -rf "$dir"
    fi
done

# إنشاء مجلد .next بالصلاحيات الصحيحة
echo "📁 إنشاء مجلد .next جديد..."
mkdir -p .next
chmod 755 .next

# إصلاح صلاحيات المشروع كاملاً
echo "🔐 إصلاح صلاحيات المشروع..."
find . -type d -name "node_modules" -prune -o -type d -exec chmod 755 {} \; 2>/dev/null
find . -type d -name "node_modules" -prune -o -type f -exec chmod 644 {} \; 2>/dev/null

# جعل السكريبتات قابلة للتنفيذ
echo "⚡ جعل السكريبتات قابلة للتنفيذ..."
chmod +x scripts/*.sh 2>/dev/null
chmod +x scripts/*.js 2>/dev/null

# التأكد من صلاحيات مجلد uploads
if [ -d "public/uploads" ]; then
    echo "📷 إصلاح صلاحيات مجلد الرفع..."
    chmod -R 755 public/uploads
fi

# تنظيف npm cache
echo "🧹 تنظيف npm cache..."
npm cache clean --force

# إنشاء ملف .env إذا لم يكن موجوداً
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "📝 إنشاء ملف .env..."
    cp .env.example .env
fi

echo ""
echo "✅ تم إصلاح الصلاحيات بنجاح!"
echo ""
echo "📌 الخطوات التالية:"
echo "   1. npm install"
echo "   2. npm run build"
echo "   3. npm start"
echo ""

# سؤال المستخدم إذا كان يريد تشغيل البناء الآن
read -p "هل تريد تشغيل npm install && npm run build الآن؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 تثبيت الحزم..."
    npm install
    
    echo "🏗️  بناء المشروع..."
    npm run build
    
    echo "✅ اكتمل البناء!"
fi 