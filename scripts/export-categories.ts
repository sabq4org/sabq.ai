import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function exportCategories() {
  try {
    console.log('🔄 جاري تصدير التصنيفات...');
    
    // جلب جميع التصنيفات
    const categories = await prisma.category.findMany({
      orderBy: {
        displayOrder: 'asc'
      }
    });
    
    // تحويل البيانات للتوافق مع تنسيق الاستيراد
    const exportData = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      name_en: cat.nameEn,
      slug: cat.slug,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      parent_id: cat.parentId,
      display_order: cat.displayOrder,
      is_active: cat.isActive,
      metadata: cat.metadata,
      created_at: cat.createdAt.toISOString(),
      updated_at: cat.updatedAt.toISOString()
    }));
    
    // حفظ في ملف JSON
    const exportDir = path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const fileName = `categories-export-${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(exportDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ تم تصدير ${categories.length} تصنيف`);
    console.log(`📁 الملف: ${filePath}`);
    
    // عرض ملخص
    console.log('\n📊 ملخص التصنيفات:');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug}) ${cat.isActive ? '✓' : '✗'}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في تصدير التصنيفات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportCategories(); 