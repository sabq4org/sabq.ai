#!/bin/bash

# تحديد البيئة
ENV=${NODE_ENV:-development}

echo "🔧 إعداد Prisma لبيئة: $ENV"

# نسخ ملف Schema المناسب
if [ "$ENV" = "production" ] && [ -f "prisma/schema-postgres.prisma" ]; then
  echo "📋 استخدام PostgreSQL schema للإنتاج"
  cp prisma/schema-postgres.prisma prisma/schema.prisma
else
  echo "📋 استخدام MySQL schema للتطوير"
  cp prisma/schema-mysql.prisma prisma/schema.prisma 2>/dev/null || echo "⚠️  لا يوجد schema-mysql.prisma، استخدام الافتراضي"
fi

# توليد Prisma Client
echo "🏗️  توليد Prisma Client..."
npx prisma generate

echo "✅ تم إعداد Prisma بنجاح!" 