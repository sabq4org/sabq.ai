const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importCategories() {
  console.log('🚀 بدء استيراد التصنيفات إلى قاعدة البيانات...\n');
  
  try {
    // قراءة ملف التصنيفات
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    
    console.log(`📁 تم العثور على ${categoriesData.categories.length} تصنيف\n`);
    
    // حذف التصنيفات الموجودة (اختياري)
    console.log('🗑️  حذف التصنيفات القديمة...');
    await prisma.category.deleteMany({});
    
    // إدخال التصنيفات الجديدة
    for (const cat of categoriesData.categories) {
      console.log(`⏳ إضافة: ${cat.name_ar} (${cat.name_en})...`);
      
      await prisma.category.create({
        data: {
          name: cat.name_ar,
          nameEn: cat.name_en,
          slug: cat.slug,
          description: cat.description,
          color: cat.color_hex,
          icon: cat.icon,
          displayOrder: cat.position || cat.id,
          isActive: cat.is_active !== false,
          metadata: {
            meta_title: cat.meta_title,
            meta_description: cat.meta_description,
            can_delete: cat.can_delete
          }
        }
      });
      
      console.log(`✅ تمت إضافة: ${cat.name_ar}`);
    }
    
    // عرض الملخص
    const count = await prisma.category.count();
    console.log(`\n✅ تم استيراد ${count} تصنيف بنجاح!`);
    
    // عرض التصنيفات المستوردة
    const imported = await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    
    console.log('\n📋 التصنيفات المستوردة:');
    imported.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name} (${cat.nameEn}) - ${cat.slug}`);
    });
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الاستيراد
importCategories(); 