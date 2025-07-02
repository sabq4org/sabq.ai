#!/usr/bin/env node

/**
 * سكريبت تطبيق فهارس الأداء على قاعدة بيانات PlanetScale
 * تاريخ الإنشاء: 2025-01-29
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// قراءة ملف الفهارس
const indexesFile = path.join(__dirname, '../database/performance_indexes.sql');
const indexesSQL = fs.readFileSync(indexesFile, 'utf8');

// تقسيم الفهارس إلى أوامر منفصلة
const indexCommands = indexesSQL
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('/*') && !cmd.startsWith('*/'))
  .filter(cmd => cmd.length > 0);

async function applyIndexes() {
  console.log('🚀 بدء تطبيق فهارس الأداء على قاعدة البيانات...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < indexCommands.length; i++) {
    const command = indexCommands[i];
    
    if (!command) continue;
    
    try {
      console.log(`📝 تطبيق الفهرس ${i + 1}/${indexCommands.length}:`);
      console.log(`   ${command.substring(0, 80)}${command.length > 80 ? '...' : ''}`);
      
      // تنفيذ الأمر
      await prisma.$executeRawUnsafe(command);
      
      console.log('   ✅ تم تطبيق الفهرس بنجاح\n');
      successCount++;
      
      // انتظار قليل بين الفهارس لتجنب الضغط على قاعدة البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('   ❌ فشل في تطبيق الفهرس:');
      console.log(`   ${error.message}\n`);
      errorCount++;
    }
  }
  
  console.log('📊 ملخص النتائج:');
  console.log(`   ✅ فهارس ناجحة: ${successCount}`);
  console.log(`   ❌ فهارس فاشلة: ${errorCount}`);
  console.log(`   📋 إجمالي الفهارس: ${indexCommands.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  بعض الفهارس فشلت في التطبيق. قد تكون موجودة مسبقاً أو هناك مشكلة في الصيغة.');
  } else {
    console.log('\n🎉 تم تطبيق جميع الفهارس بنجاح!');
  }
  
  console.log('\n💡 نصائح:');
  console.log('   - راقب أداء قاعدة البيانات بعد تطبيق الفهارس');
  console.log('   - اختبر سرعة استعلامات المقالات');
  console.log('   - إذا لاحظت بطء في الكتابة، قد تحتاج لإزالة بعض الفهارس');
}

async function main() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح\n');
    
    // تطبيق الفهارس
    await applyIndexes();
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { applyIndexes }; 