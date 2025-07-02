#!/bin/bash

# سكريبت لتثبيت Git hooks

echo "🔧 تثبيت Git hooks..."

# إنشاء مجلد .git/hooks إذا لم يكن موجوداً
mkdir -p .git/hooks

# نسخ post-merge hook
if [ -f .githooks/post-merge ]; then
    cp .githooks/post-merge .git/hooks/post-merge
    chmod +x .git/hooks/post-merge
    echo "✅ تم تثبيت post-merge hook"
else
    echo "❌ لم يتم العثور على .githooks/post-merge"
fi

echo ""
echo "✅ تم تثبيت Git hooks بنجاح!"
echo "🔔 سيتم تنبيهك تلقائياً بعد كل git pull" 