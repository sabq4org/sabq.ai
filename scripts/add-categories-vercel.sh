#!/bin/bash

# رابط API على Vercel
API_URL="https://sabq-ai-cms.vercel.app/api/categories"

echo "🚀 بدء إضافة التصنيفات على Vercel..."
echo ""

# التحقق من صحة الاتصال أولاً
echo "🔍 التحقق من الاتصال بقاعدة البيانات..."
HEALTH_CHECK=$(curl -s "$API_URL")
if [[ $HEALTH_CHECK == *"DATABASE_URL"* ]]; then
    echo "❌ خطأ: DATABASE_URL غير مُعرّف في Vercel!"
    echo "   يرجى إضافة متغيرات البيئة في إعدادات Vercel أولاً."
    echo "   راجع ملف VERCEL_DATABASE_SETUP.md للتعليمات."
    exit 1
fi

echo "✅ الاتصال بقاعدة البيانات يعمل!"
echo ""

# تصنيف الأخبار
echo "📰 إضافة تصنيف الأخبار..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "أخبار",
    "name_en": "News",
    "slug": "news",
    "description": "آخر الأخبار المحلية والعالمية",
    "color_hex": "#E5F1FA",
    "icon": "📰",
    "position": 1,
    "is_active": true
  }'
echo ""
echo ""

# انتظار ثانية
sleep 1

# تصنيف الرياضة
echo "⚽ إضافة تصنيف الرياضة..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "رياضة",
    "name_en": "Sports",
    "slug": "sports",
    "description": "أخبار الرياضة والمباريات",
    "color_hex": "#E3FCEF",
    "icon": "⚽",
    "position": 2,
    "is_active": true
  }'
echo ""
echo ""

# انتظار ثانية
sleep 1

# تصنيف التقنية
echo "💻 إضافة تصنيف التقنية..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "تقنية",
    "name_en": "Technology",
    "slug": "technology",
    "description": "آخر أخبار التقنية والابتكار",
    "color_hex": "#FFF5E5",
    "icon": "💻",
    "position": 3,
    "is_active": true
  }'
echo ""
echo ""

# تصنيف الاقتصاد
echo "💰 إضافة تصنيف الاقتصاد..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "اقتصاد",
    "name_en": "Economy",
    "slug": "economy",
    "description": "أخبار الاقتصاد والأعمال",
    "color_hex": "#FDE7F3",
    "icon": "💰",
    "position": 4,
    "is_active": true
  }'
echo ""
echo ""

# تصنيف الثقافة
echo "🎭 إضافة تصنيف الثقافة..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "name_ar": "ثقافة",
    "name_en": "Culture",
    "slug": "culture",
    "description": "أخبار الثقافة والفنون",
    "color_hex": "#F2F6FF",
    "icon": "🎭",
    "position": 5,
    "is_active": true
  }'
echo ""
echo ""

echo "✅ تم الانتهاء من إضافة التصنيفات!"
echo ""
echo "📊 للتحقق من التصنيفات، قم بزيارة:"
echo "   $API_URL"
echo "   https://sabq-ai-cms.vercel.app/dashboard/categories" 