#!/bin/bash

echo "🔍 فحص التطبيق المباشر على DigitalOcean"
echo "========================================"

# URL التطبيق المباشر
LIVE_URL="https://jur3a.ai"

echo ""
echo "1️⃣ فحص الصفحة الرئيسية:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" $LIVE_URL

echo ""
echo "2️⃣ فحص API التصنيفات:"
curl -s "$LIVE_URL/api/categories" | jq '.' 2>/dev/null || echo "❌ فشل في جلب التصنيفات"

echo ""
echo "3️⃣ فحص صفحة تسجيل الدخول:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$LIVE_URL/login"

echo ""
echo "4️⃣ فحص لوحة التحكم:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$LIVE_URL/dashboard"

echo ""
echo "✅ اكتمل الفحص" 