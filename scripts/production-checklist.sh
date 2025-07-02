#!/bin/bash

echo "🔍 فحص جاهزية الإنتاج لـ sabq-ai-cms"
echo "======================================="

# متغيرات للنتائج
ERRORS=0
WARNINGS=0

# دالة للتحقق
check() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        ((ERRORS++))
    fi
}

warn() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

# 1. التحقق من ملفات البيئة
echo ""
echo "📁 فحص ملفات البيئة..."
if [ -f ".env.production" ]; then
    check 0 "ملف .env.production موجود"
    
    # التحقق من المتغيرات المطلوبة
    source .env.production
    [ -n "$DATABASE_URL" ] && check 0 "DATABASE_URL محدد" || check 1 "DATABASE_URL مفقود"
    [ -n "$NEXTAUTH_SECRET" ] && check 0 "NEXTAUTH_SECRET محدد" || check 1 "NEXTAUTH_SECRET مفقود"
    [ -n "$JWT_SECRET" ] && check 0 "JWT_SECRET محدد" || check 1 "JWT_SECRET مفقود"
    [ -n "$API_SECRET_KEY" ] && check 0 "API_SECRET_KEY محدد" || check 1 "API_SECRET_KEY مفقود"
else
    check 1 "ملف .env.production غير موجود"
fi

# 2. التحقق من البناء
echo ""
echo "🏗️  فحص البناء..."
if [ -d ".next" ]; then
    check 0 "مجلد .next موجود"
else
    warn "مجلد .next غير موجود - يجب تشغيل npm run build"
fi

# 3. التحقق من قاعدة البيانات
echo ""
echo "🗄️  فحص قاعدة البيانات..."
if command -v pscale &> /dev/null; then
    check 0 "PlanetScale CLI مثبت"
else
    warn "PlanetScale CLI غير مثبت"
fi

# 4. التحقق من الأمان
echo ""
echo "🔒 فحص الأمان..."
# التحقق من عدم وجود بيانات حساسة
if grep -r "password\|secret\|key" --include="*.js" --include="*.ts" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | grep -v "process.env" | grep -v "// " > /dev/null; then
    warn "قد توجد بيانات حساسة في الكود"
else
    check 0 "لا توجد بيانات حساسة واضحة"
fi

# 5. التحقق من التبعيات
echo ""
echo "📦 فحص التبعيات..."
if [ -f "package-lock.json" ]; then
    check 0 "package-lock.json موجود"
else
    check 1 "package-lock.json مفقود"
fi

# 6. التحقق من Prisma
echo ""
echo "🔧 فحص Prisma..."
if [ -f "prisma/schema.prisma" ]; then
    check 0 "Prisma schema موجود"
    
    # التحقق من توليد Client
    if [ -d "node_modules/.prisma/client" ]; then
        check 0 "Prisma Client مولد"
    else
        warn "Prisma Client غير مولد - شغل: npx prisma generate"
    fi
else
    check 1 "Prisma schema مفقود"
fi

# 7. التحقق من الملفات الحساسة
echo ""
echo "🚫 فحص الملفات الحساسة..."
SENSITIVE_FILES=(".env" ".env.local" ".env.production" "*.pem" "*.key")
for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ] && ! grep -q "$file" .gitignore 2>/dev/null; then
        warn "$file غير مضاف لـ .gitignore"
    fi
done

# النتيجة النهائية
echo ""
echo "======================================="
echo "📊 النتيجة النهائية:"
echo "   أخطاء: $ERRORS"
echo "   تحذيرات: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo "✅ التطبيق جاهز للنشر!"
    else
        echo "⚠️  التطبيق جاهز للنشر مع بعض التحذيرات"
    fi
    exit 0
else
    echo "❌ يجب إصلاح الأخطاء قبل النشر"
    exit 1
fi 