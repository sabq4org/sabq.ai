const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createForumTables() {
  console.log('🚀 بدء إنشاء جداول منتدى سبق...\n');
  
  try {
    // التحقق من الاتصال
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة البيانات PlanetScale\n');

    // قراءة محتوى ملف SQL
    const sqlContent = fs.readFileSync(path.join(__dirname, '../database/add_forum_tables_planetscale.sql'), 'utf8');
    
    // تقسيم المحتوى إلى أوامر منفصلة
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // السماح بالأوامر غير الفارغة
        if (stmt.length === 0) return false;
        
        // تجاهل التعليقات المستقلة فقط
        const lines = stmt.split('\n');
        const hasNonCommentLine = lines.some(line => {
          const trimmedLine = line.trim();
          return trimmedLine.length > 0 && !trimmedLine.startsWith('--');
        });
        
        return hasNonCommentLine;
      });

    console.log(`📋 عدد الأوامر المطلوب تنفيذها: ${statements.length}\n`);

    // تنفيذ كل أمر
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // تحديد نوع الأمر
      let commandType = 'أمر';
      if (statement.includes('CREATE TABLE')) {
        commandType = 'إنشاء جدول';
      } else if (statement.includes('INSERT INTO')) {
        commandType = 'إدخال بيانات';
      }
      
      try {
        console.log(`⏳ تنفيذ ${commandType} ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ تم بنجاح\n`);
      } catch (error) {
        if (error.code === 'P2000' || error.message.includes('already exists')) {
          console.log(`⚠️  الجدول/البيانات موجودة مسبقاً - تم التجاوز\n`);
        } else {
          console.error(`❌ خطأ: ${error.message}\n`);
          // نستمر في محاولة الأوامر الأخرى
        }
      }
    }

    console.log('🎉 تم إنشاء جداول المنتدى!\n');
    
    // عرض الجداول المنشأة
    const tables = await prisma.$queryRaw`
      SHOW TABLES LIKE 'forum_%'
    `;
    
    if (tables.length > 0) {
      console.log('📊 الجداول المنشأة:');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    
    console.log('\n✨ منتدى سبق جاهز للاستخدام!');
    console.log('🔗 رابط المنتدى: http://localhost:3000/forum');
    console.log('🔧 لوحة التحكم: http://localhost:3000/dashboard/forum');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
createForumTables()
  .catch((error) => {
    console.error('خطأ في التنفيذ:', error);
    process.exit(1);
  }); 