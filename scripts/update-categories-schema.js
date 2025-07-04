const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function updateCategoriesSchema() {
  console.log('🚀 بدء تحديث schema التصنيفات...\n');

  try {
    // إضافة حقل name_ar
    console.log('📝 إضافة حقل name_ar...');
    try {
      await prisma.$executeRaw`ALTER TABLE categories ADD COLUMN name_ar VARCHAR(255) AFTER name`;
      console.log('✅ تم إضافة حقل name_ar');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  حقل name_ar موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة name_ar:', error.message);
      }
    }

    // إضافة حقل name_en
    console.log('\n📝 إضافة حقل name_en...');
    try {
      await prisma.$executeRaw`ALTER TABLE categories ADD COLUMN name_en VARCHAR(255) AFTER name_ar`;
      console.log('✅ تم إضافة حقل name_en');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  حقل name_en موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة name_en:', error.message);
      }
    }

    // إضافة حقل color_hex
    console.log('\n📝 إضافة حقل color_hex...');
    try {
      await prisma.$executeRaw`ALTER TABLE categories ADD COLUMN color_hex VARCHAR(7) DEFAULT '#3B82F6' AFTER description`;
      console.log('✅ تم إضافة حقل color_hex');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  حقل color_hex موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة color_hex:', error.message);
      }
    }

    // إضافة حقل icon
    console.log('\n📝 إضافة حقل icon...');
    try {
      await prisma.$executeRaw`ALTER TABLE categories ADD COLUMN icon VARCHAR(10) DEFAULT '📁' AFTER color_hex`;
      console.log('✅ تم إضافة حقل icon');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️  حقل icon موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة icon:', error.message);
      }
    }

    // نسخ القيم من name إلى name_ar للسجلات الموجودة
    console.log('\n📝 تحديث القيم الموجودة...');
    const updateResult = await prisma.$executeRaw`UPDATE categories SET name_ar = name WHERE name_ar IS NULL`;
    console.log(`✅ تم تحديث ${updateResult} سجل`);

    // إضافة فهرس لـ name_ar
    console.log('\n📝 إضافة فهرس لـ name_ar...');
    try {
      await prisma.$executeRaw`ALTER TABLE categories ADD INDEX idx_name_ar (name_ar)`;
      console.log('✅ تم إضافة الفهرس');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️  الفهرس موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة الفهرس:', error.message);
      }
    }

    console.log('\n✅ تم تحديث schema التصنيفات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في العملية:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ تم إغلاق الاتصال بقاعدة البيانات');
  }
}

// تشغيل السكريبت
updateCategoriesSchema()
  .then(() => console.log('\n🎉 تمت العملية بنجاح!'))
  .catch(error => {
    console.error('\n❌ فشلت العملية:', error);
    process.exit(1);
  }); 