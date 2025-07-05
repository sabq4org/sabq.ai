// التحقق من التصنيفات في قاعدة البيانات
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('../lib/generated/prisma');

async function checkCategories() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 فحص التصنيفات في قاعدة البيانات PostgreSQL');
    console.log('=========================================\n');
    
    // جلب جميع التصنيفات
    const categories = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log(`📁 عدد التصنيفات: ${categories.length}\n`);
    
    if (categories.length > 0) {
      console.log('📋 قائمة التصنيفات:');
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   - ID: ${cat.id}`);
        console.log(`   - Slug: ${cat.slug}`);
        console.log(`   - اللون: ${cat.color || 'غير محدد'}`);
        console.log(`   - الترتيب: ${cat.displayOrder}`);
        console.log(`   - نشط: ${cat.isActive ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ لا توجد تصنيفات في قاعدة البيانات!');
    }
    
    // التحقق من API endpoint
    console.log('\n🌐 اختبار API endpoint للتصنيفات...');
    
    try {
      const response = await fetch('http://localhost:3003/api/categories');
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ API يعمل بشكل صحيح - عدد التصنيفات: ${data.categories?.length || 0}`);
      } else {
        console.log(`❌ خطأ في API: ${data.error || 'Unknown error'}`);
      }
    } catch (apiError) {
      console.log('❌ فشل الاتصال بـ API - تأكد من أن الخادم يعمل على المنفذ 3003');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories(); 