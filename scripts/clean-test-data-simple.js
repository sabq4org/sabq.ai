#!/usr/bin/env node

/**
 * سكريبت بسيط لحذف البيانات التجريبية
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// الكلمات المفتاحية للبحث عن البيانات التجريبية
const TEST_KEYWORDS = [
  'تجربة',
  'test',
  'السلام عليكم',
  'dummy',
  'اختبار'
];

async function cleanTestData() {
  console.log('🧹 بدء تنظيف البيانات التجريبية...\n');

  try {
    // 1. البحث عن المقالات التجريبية
    console.log('📊 البحث عن المقالات التجريبية...');
    
    const testArticles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: 'السلام عليكم' } },
          { title: { contains: 'test' } },
          { title: { contains: 'تجربة' } },
          { content: { contains: 'السلام عليكم ورحمة الله' } },
          // محتوى قصير جداً (أقل من 200 حرف)
          { content: { lte: '                                                                                                                                                                                                                    ' } }
        ]
      }
    });

    console.log(`✅ تم العثور على ${testArticles.length} مقال تجريبي`);
    
    if (testArticles.length > 0) {
      console.log('\n📝 المقالات التي سيتم حذفها:');
      testArticles.forEach((article, i) => {
        console.log(`   ${i + 1}. ${article.title} (ID: ${article.id})`);
      });

      // جمع IDs المقالات التجريبية
      const articleIds = testArticles.map(a => a.id);

      // حذف التفاعلات المرتبطة
      const deletedInteractions = await prisma.interaction.deleteMany({
        where: { articleId: { in: articleIds } }
      });
      console.log(`\n✅ تم حذف ${deletedInteractions.count} تفاعل`);

      // حذف التعليقات المرتبطة
      const deletedComments = await prisma.comment.deleteMany({
        where: { articleId: { in: articleIds } }
      });
      console.log(`✅ تم حذف ${deletedComments.count} تعليق`);

      // حذف المقالات
      const deletedArticles = await prisma.article.deleteMany({
        where: { id: { in: articleIds } }
      });
      console.log(`✅ تم حذف ${deletedArticles.count} مقال تجريبي`);
    }

    // 2. عرض الإحصائيات النهائية
    console.log('\n📊 الإحصائيات النهائية:');
    const finalCount = await prisma.article.count();
    console.log(`   - عدد المقالات المتبقية: ${finalCount}`);

    // عرض المقالات الحقيقية المتبقية
    const realArticles = await prisma.article.findMany({
      where: { status: 'published' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n✨ المقالات الحقيقية المتبقية:');
    realArticles.forEach((article, i) => {
      console.log(`   ${i + 1}. ${article.title}`);
    });

    console.log('\n✅ تمت عملية التنظيف بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// التحقق من الاتصال بقاعدة البيانات
console.log('🔌 التحقق من اتصال قاعدة البيانات...');
const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.includes('planetscale') || dbUrl.includes('psdb.cloud')) {
  console.log('✅ متصل بـ PlanetScale\n');
  
  // تأكيد من المستخدم
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('⚠️  هل أنت متأكد من حذف البيانات التجريبية؟ (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      cleanTestData().then(() => {
        readline.close();
      });
    } else {
      console.log('تم إلغاء العملية.');
      readline.close();
      process.exit(0);
    }
  });
} else {
  console.log('❌ لست متصلاً بـ PlanetScale!');
  process.exit(1);
} 