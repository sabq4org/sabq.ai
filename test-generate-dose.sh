#!/bin/bash

echo "🧪 اختبار توليد جرعة جديدة"
echo "=========================="

# الحصول على التاريخ الحالي
DATE=$(date +%Y-%m-%d)

# تحديد الفترة بناءً على الوقت الحالي
HOUR=$(date +%H)
if [ $HOUR -ge 6 ] && [ $HOUR -lt 11 ]; then
    PERIOD="morning"
elif [ $HOUR -ge 11 ] && [ $HOUR -lt 16 ]; then
    PERIOD="afternoon"
elif [ $HOUR -ge 16 ] && [ $HOUR -lt 19 ]; then
    PERIOD="evening"
else
    PERIOD="night"
fi

echo "📅 التاريخ: $DATE"
echo "⏰ الفترة: $PERIOD"
echo ""

# توليد الجرعة
echo "🔄 جاري توليد الجرعة..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/daily-doses/generate \
  -H "Content-Type: application/json" \
  -d "{\"date\": \"$DATE\", \"period\": \"$PERIOD\"}")

# التحقق من النتيجة
if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✅ تم توليد الجرعة بنجاح!"
    echo ""
    echo "📊 تفاصيل الجرعة:"
    echo "$RESPONSE" | jq -r '.dose | "- ID: \(.id)\n- العنوان: \(.title)\n- العنوان الفرعي: \(.subtitle)\n- عدد المحتويات: \(.contents | length)"'
else
    echo "❌ فشل توليد الجرعة"
    echo "$RESPONSE" | jq -r '.error // .'
fi 