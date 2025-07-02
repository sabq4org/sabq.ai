#!/bin/bash

# رابط API الإنتاج
API_URL="https://sabq-ai-cms-production.up.railway.app/api/categories"

echo "🚀 بدء إضافة التصنيفات على الإنتاج..."
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

echo "✅ تم الانتهاء من إضافة التصنيفات!"
echo ""
echo "📊 للتحقق من التصنيفات، قم بزيارة:"
echo "   $API_URL" 