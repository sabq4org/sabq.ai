#!/bin/bash

echo "🔧 إصلاح مشاكل التطبيق المباشر"
echo "================================"

# التحقق من وجود DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ خطأ: DATABASE_URL غير موجود!"
    echo "تأكد من تعيين متغيرات البيئة في DigitalOcean App Platform"
    exit 1
fi

echo ""
echo "1️⃣ إعادة توليد Prisma Client..."
npx prisma generate

echo ""
echo "2️⃣ مزامنة قاعدة البيانات..."
npx prisma db push --skip-generate

echo ""
echo "3️⃣ التحقق من التصنيفات..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.category.count();
    console.log('✅ عدد التصنيفات:', count);
    
    if (count === 0) {
      console.log('⚠️ لا توجد تصنيفات! جاري إضافة التصنيفات الافتراضية...');
      // إضافة تصنيفات افتراضية
      const categories = [
        { id: 'cat-1', name: 'تقنية', slug: 'technology', displayOrder: 1, isActive: true, color: '#8B5CF6', icon: '💻' },
        { id: 'cat-2', name: 'رياضة', slug: 'sports', displayOrder: 2, isActive: true, color: '#F59E0B', icon: '⚽' },
        { id: 'cat-3', name: 'اقتصاد', slug: 'economy', displayOrder: 3, isActive: true, color: '#10B981', icon: '💰' },
        { id: 'cat-4', name: 'سياسة', slug: 'politics', displayOrder: 4, isActive: true, color: '#EF4444', icon: '🏛️' },
        { id: 'cat-5', name: 'محليات', slug: 'local', displayOrder: 5, isActive: true, color: '#3B82F6', icon: '🗺️' },
        { id: 'cat-6', name: 'ثقافة', slug: 'culture', displayOrder: 6, isActive: true, color: '#EC4899', icon: '🎭' },
        { id: 'cat-7', name: 'رأي', slug: 'opinion', displayOrder: 7, isActive: true, color: '#7C3AED', icon: '✍️' },
        { id: 'cat-8', name: 'منوعات', slug: 'misc', displayOrder: 8, isActive: true, color: '#6B7280', icon: '🎉' }
      ];
      
      for (const cat of categories) {
        await prisma.category.create({ data: cat });
      }
      console.log('✅ تم إضافة التصنيفات الافتراضية');
    }
    
    // التحقق من المستخدمين
    const userCount = await prisma.user.count();
    console.log('✅ عدد المستخدمين:', userCount);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
"

echo ""
echo "4️⃣ إعادة بناء التطبيق..."
npm run build

echo ""
echo "✅ اكتمل الإصلاح!"
echo ""
echo "📝 ملاحظات مهمة:"
echo "1. تأكد من إعادة تشغيل التطبيق في DigitalOcean"
echo "2. امسح ذاكرة المتصفح المؤقتة (Ctrl+Shift+R)"
echo "3. جرب تسجيل الدخول مرة أخرى" 