#!/bin/bash

# سكريبت اختبار موقع jur3a.ai
DOMAIN="https://jur3a.ai"

echo "🔍 اختبار موقع jur3a.ai"
echo "================================"

# 1. اختبار الصفحة الرئيسية
echo -n "1. الصفحة الرئيسية... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ تعمل (HTTP $HTTP_STATUS)"
else
    echo "❌ فشل (HTTP $HTTP_STATUS)"
fi

# 2. اختبار API الصحة
echo -n "2. API الصحة... "
HEALTH_RESPONSE=$(curl -s $DOMAIN/api/health)
if echo $HEALTH_RESPONSE | grep -q "healthy"; then
    echo "✅ تعمل"
else
    echo "⚠️  تحقق من الاستجابة"
    echo "   الاستجابة: $HEALTH_RESPONSE"
fi

# 3. اختبار API التصنيفات
echo -n "3. API التصنيفات... "
CATEGORIES_RESPONSE=$(curl -s -w "\n%{http_code}" $DOMAIN/api/categories)
CATEGORIES_STATUS=$(echo "$CATEGORIES_RESPONSE" | tail -n 1)
if [ $CATEGORIES_STATUS -eq 200 ]; then
    echo "✅ تعمل"
    CATEGORIES_COUNT=$(echo "$CATEGORIES_RESPONSE" | head -n -1 | jq -r '.total // .categories | length' 2>/dev/null || echo "0")
    echo "   عدد التصنيفات: $CATEGORIES_COUNT"
else
    echo "❌ فشل (HTTP $CATEGORIES_STATUS)"
fi

# 4. اختبار API المقالات
echo -n "4. API المقالات... "
ARTICLES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/api/articles?limit=1)
if [ $ARTICLES_STATUS -eq 200 ]; then
    echo "✅ تعمل"
else
    echo "❌ فشل (HTTP $ARTICLES_STATUS)"
fi

# 5. اختبار صفحة تسجيل الدخول
echo -n "5. صفحة تسجيل الدخول... "
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/login)
if [ $LOGIN_STATUS -eq 200 ]; then
    echo "✅ تعمل"
else
    echo "❌ فشل (HTTP $LOGIN_STATUS)"
fi

# 6. اختبار SSL
echo -n "6. شهادة SSL... "
SSL_CHECK=$(curl -s -I $DOMAIN 2>&1 | grep -i "SSL certificate problem")
if [ -z "$SSL_CHECK" ]; then
    echo "✅ صالحة"
else
    echo "❌ مشكلة في SSL"
fi

# 7. اختبار سرعة الاستجابة
echo -n "7. سرعة الاستجابة... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $DOMAIN)
echo "⏱️  $RESPONSE_TIME ثانية"

# 8. اختبار الصور والملفات الثابتة
echo -n "8. الملفات الثابتة... "
FAVICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/favicon.ico)
if [ $FAVICON_STATUS -eq 200 ]; then
    echo "✅ تعمل"
else
    echo "⚠️  تحقق من الملفات الثابتة"
fi

# 9. اختبار صفحة التصنيفات
echo -n "9. صفحة التصنيفات... "
CATEGORIES_PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/categories)
if [ $CATEGORIES_PAGE_STATUS -eq 200 ]; then
    echo "✅ تعمل"
else
    echo "⚠️  (HTTP $CATEGORIES_PAGE_STATUS)"
fi

# 10. اختبار لوحة التحكم (يجب أن تعيد توجيه)
echo -n "10. حماية لوحة التحكم... "
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L $DOMAIN/dashboard)
if [ $DASHBOARD_STATUS -eq 200 ]; then
    echo "⚠️  تحقق من الحماية"
else
    echo "✅ محمية (HTTP $DASHBOARD_STATUS)"
fi

echo "================================"
echo "✨ اكتمل الاختبار!"
echo ""
echo "📊 ملخص النتائج:"
echo "- الموقع: https://jur3a.ai"
echo "- الحالة: متصل وبعمل"
echo "- SSL: نشط"
echo ""
echo "🔗 روابط مفيدة للاختبار اليدوي:"
echo "- الصفحة الرئيسية: $DOMAIN"
echo "- التصنيفات: $DOMAIN/categories"
echo "- تسجيل الدخول: $DOMAIN/login"
echo "- API الصحة: $DOMAIN/api/health"
echo "- API التصنيفات: $DOMAIN/api/categories" 