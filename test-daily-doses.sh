#!/bin/bash

echo "🧪 اختبار نظام الجرعات اليومية"
echo "================================"

# الحصول على الجرعة الحالية
echo -e "\n1️⃣ جلب الجرعة الحالية:"
curl -X GET http://localhost:3000/api/daily-doses \
  -H "Content-Type: application/json" | jq '.'

# توليد جرعة جديدة بالذكاء الاصطناعي
echo -e "\n\n2️⃣ توليد جرعة جديدة:"
curl -X POST http://localhost:3000/api/daily-doses/generate \
  -H "Content-Type: application/json" | jq '.'

# إنشاء جرعة يدوياً (مثال)
echo -e "\n\n3️⃣ إنشاء جرعة يدوية:"
curl -X POST http://localhost:3000/api/daily-doses \
  -H "Content-Type: application/json" \
  -d '{
    "timeSlot": "morning",
    "greeting": {
      "main": "صباح الخير",
      "sub": "ابدأ يومك بأهم الأخبار"
    },
    "contents": [
      {
        "type": "article",
        "title": "خبر تجريبي",
        "summary": "هذا ملخص للخبر التجريبي",
        "url": "/article/test-article",
        "imageUrl": "https://via.placeholder.com/400x300"
      },
      {
        "type": "weather",
        "title": "حالة الطقس",
        "summary": "الطقس معتدل اليوم مع درجة حرارة 25°م"
      }
    ]
  }' | jq '.'

echo -e "\n✅ اكتمل الاختبار" 