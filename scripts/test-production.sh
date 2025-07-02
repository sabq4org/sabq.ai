#!/bin/bash

# سكريبت اختبار الموقع في الإنتاج
DOMAIN="https://cms.sabq.ai"  # ضع الدومين الصحيح هنا

echo "🔍 بدء اختبار الموقع في الإنتاج..."
echo "================================"

# 1. اختبار الصفحة الرئيسية
echo -n "1. اختبار الصفحة الرئيسية... "
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN)
if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ نجح (HTTP $HTTP_STATUS)"
else
    echo "❌ فشل (HTTP $HTTP_STATUS)"
fi

# 2. اختبار API الصحة
echo -n "2. اختبار API الصحة... "
HEALTH_RESPONSE=$(curl -s $DOMAIN/api/health)
if echo $HEALTH_RESPONSE | grep -q "healthy"; then
    echo "✅ نجح"
    echo "   الاستجابة: $HEALTH_RESPONSE"
else
    echo "❌ فشل"
    echo "   الاستجابة: $HEALTH_RESPONSE"
fi

# 3. اختبار API التصنيفات
echo -n "3. اختبار API التصنيفات... "
CATEGORIES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/api/categories)
if [ $CATEGORIES_STATUS -eq 200 ]; then
    echo "✅ نجح"
    CATEGORIES_COUNT=$(curl -s $DOMAIN/api/categories | jq '.total // 0')
    echo "   عدد التصنيفات: $CATEGORIES_COUNT"
else
    echo "❌ فشل (HTTP $CATEGORIES_STATUS)"
fi

# 4. اختبار API المقالات
echo -n "4. اختبار API المقالات... "
ARTICLES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/api/articles?limit=1)
if [ $ARTICLES_STATUS -eq 200 ]; then
    echo "✅ نجح"
else
    echo "❌ فشل (HTTP $ARTICLES_STATUS)"
fi

# 5. اختبار صفحة تسجيل الدخول
echo -n "5. اختبار صفحة تسجيل الدخول... "
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/login)
if [ $LOGIN_STATUS -eq 200 ]; then
    echo "✅ نجح"
else
    echo "❌ فشل (HTTP $LOGIN_STATUS)"
fi

# 6. اختبار صفحة لوحة التحكم (يجب أن تعيد توجيه)
echo -n "6. اختبار حماية لوحة التحكم... "
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/dashboard)
if [ $DASHBOARD_STATUS -eq 307 ] || [ $DASHBOARD_STATUS -eq 302 ]; then
    echo "✅ نجح (محمي بتسجيل الدخول)"
else
    echo "⚠️  تحذير (HTTP $DASHBOARD_STATUS)"
fi

# 7. اختبار الملفات الثابتة
echo -n "7. اختبار الملفات الثابتة... "
STATIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DOMAIN/favicon.ico)
if [ $STATIC_STATUS -eq 200 ]; then
    echo "✅ نجح"
else
    echo "❌ فشل (HTTP $STATIC_STATUS)"
fi

# 8. اختبار سرعة الاستجابة
echo -n "8. اختبار سرعة الاستجابة... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" $DOMAIN)
echo "⏱️  $RESPONSE_TIME ثانية"

echo "================================"
echo "✨ اكتمل الاختبار!" 