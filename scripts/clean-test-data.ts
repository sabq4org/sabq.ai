#!/usr/bin/env ts-node

/**
 * سكريبت حذف البيانات التجريبية من قاعدة البيانات
 * الهدف: الاحتفاظ فقط بالبيانات الحقيقية في PlanetScale
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// تحميل متغيرات البيئة
dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// كلمات مفتاحية للبحث عن البيانات التجريبية
const TEST_KEYWORDS = [
  'تجربة',
  'test',
  'dummy',
  'اختبار',
  'السلام عليكم',
  'demo',
  'sample',
  'example'
];

/**
 * تحليل البيانات الموجودة
 */
async function analyzeData() {
  console.log('\n📊 تحليل البيانات الحالية...\n');

  // تحليل المقالات
  const totalArticles = await prisma.article.count();
  const testArticles = await prisma.article.findMany({
    where: {
      OR: [
        ...TEST_KEYWORDS.map(keyword => ({
          title: { contains: keyword }
        })),
        ...TEST_KEYWORDS.map(keyword => ({
          content: { contains: keyword }
        })),
        // مقالات قصيرة جداً (أقل من 200 حرف)
        { content: { lte: String(200) } }
      ]
    },
    select: {
      id: true,
      title: true,
      content: true,
      authorId: true,
      createdAt: true
    }
  });

  console.log(`📰 المقالات:`);
  console.log(`   - إجمالي المقالات: ${totalArticles}`);
  console.log(`   - مقالات تجريبية محتملة: ${testArticles.length}`);
  
  if (testArticles.length > 0) {
    console.log('\n   📝 المقالات التجريبية المكتشفة:');
    testArticles.forEach((article, index) => {
      console.log(`      ${index + 1}. "${article.title}" (${article.content?.length || 0} حرف)`);
      console.log(`         ID: ${article.id}`);
      console.log(`         تاريخ الإنشاء: ${article.createdAt.toLocaleDateString('ar-SA')}`);
    });
  }

  // تحليل المستخدمين
  const totalUsers = await prisma.user.count();
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        ...TEST_KEYWORDS.map(keyword => ({
          name: { contains: keyword }
        })),
        ...TEST_KEYWORDS.map(keyword => ({
          email: { contains: keyword }
        })),
        { email: { contains: '@test' } },
        { email: { contains: '@example' } },
        { email: { contains: '@dummy' } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  console.log(`\n👥 المستخدمين:`);
  console.log(`   - إجمالي المستخدمين: ${totalUsers}`);
  console.log(`   - مستخدمين تجريبيين محتملين: ${testUsers.length}`);
  
  if (testUsers.length > 0) {
    console.log('\n   🧪 المستخدمين التجريبيين المكتشفين:');
    testUsers.forEach((user, index) => {
      console.log(`      ${index + 1}. ${user.name} (${user.email})`);
      console.log(`         ID: ${user.id}`);
      console.log(`         الدور: ${user.role}`);
    });
  }

  // تحليل التعليقات
  const totalComments = await prisma.comment.count();
  const testComments = await prisma.comment.findMany({
    where: {
      OR: TEST_KEYWORDS.map(keyword => ({
        content: { contains: keyword }
      }))
    }
  });

  console.log(`\n💬 التعليقات:`);
  console.log(`   - إجمالي التعليقات: ${totalComments}`);
  console.log(`   - تعليقات تجريبية محتملة: ${testComments.length}`);

  // تحليل التفاعلات
  const totalInteractions = await prisma.interaction.count();
  console.log(`\n🤝 التفاعلات:`);
  console.log(`   - إجمالي التفاعلات: ${totalInteractions}`);

  return {
    testArticles: testArticles.map(a => a.id),
    testUsers: testUsers.map(u => u.id),
    testComments: testComments.map(c => c.id)
  };
}

/**
 * حذف البيانات التجريبية
 */
async function cleanTestData(dataToDelete: {
  testArticles: string[];
  testUsers: string[];
  testComments: string[];
}) {
  console.log('\n🗑️  بدء عملية الحذف...\n');

  try {
    // بدء معاملة قاعدة البيانات
    await prisma.$transaction(async (tx) => {
      // حذف التعليقات التجريبية
      if (dataToDelete.testComments.length > 0) {
        const deletedComments = await tx.comment.deleteMany({
          where: {
            id: { in: dataToDelete.testComments }
          }
        });
        console.log(`✅ تم حذف ${deletedComments.count} تعليق تجريبي`);
      }

      // حذف التفاعلات المرتبطة بالمقالات التجريبية
      const deletedInteractions = await tx.interaction.deleteMany({
        where: {
          articleId: { in: dataToDelete.testArticles }
        }
      });
      if (deletedInteractions.count > 0) {
        console.log(`✅ تم حذف ${deletedInteractions.count} تفاعل مرتبط بالمقالات التجريبية`);
      }

      // حذف التعليقات المرتبطة بالمقالات التجريبية
      const deletedArticleComments = await tx.comment.deleteMany({
        where: {
          articleId: { in: dataToDelete.testArticles }
        }
      });
      if (deletedArticleComments.count > 0) {
        console.log(`✅ تم حذف ${deletedArticleComments.count} تعليق مرتبط بالمقالات التجريبية`);
      }

      // حذف المقالات التجريبية
      if (dataToDelete.testArticles.length > 0) {
        const deletedArticles = await tx.article.deleteMany({
          where: {
            id: { in: dataToDelete.testArticles }
          }
        });
        console.log(`✅ تم حذف ${deletedArticles.count} مقال تجريبي`);
      }

      // حذف المستخدمين التجريبيين (بحذر)
      // ملاحظة: لن نحذف المستخدمين إذا كان لديهم مقالات حقيقية
      if (dataToDelete.testUsers.length > 0) {
        // التحقق من وجود مقالات حقيقية للمستخدمين
        const usersWithRealArticles = await tx.article.findMany({
          where: {
            authorId: { in: dataToDelete.testUsers },
            id: { notIn: dataToDelete.testArticles }
          },
          select: {
            authorId: true
          }
        });

        const safeToDeleteUsers = dataToDelete.testUsers.filter(
          userId => !usersWithRealArticles.some(a => a.authorId === userId)
        );

        if (safeToDeleteUsers.length > 0) {
          const deletedUsers = await tx.user.deleteMany({
            where: {
              id: { in: safeToDeleteUsers }
            }
          });
          console.log(`✅ تم حذف ${deletedUsers.count} مستخدم تجريبي`);
        } else {
          console.log(`⚠️  لم يتم حذف أي مستخدم (لديهم مقالات حقيقية)`);
        }
      }
    });

    console.log('\n✨ تمت عملية التنظيف بنجاح!');
  } catch (error) {
    console.error('\n❌ خطأ في عملية الحذف:', error);
    throw error;
  }
}

/**
 * التحقق من الاتصال بقاعدة البيانات الصحيحة
 */
function verifyDatabaseConnection() {
  const dbUrl = process.env.DATABASE_URL || '';
  
  console.log('\n🔌 التحقق من اتصال قاعدة البيانات...\n');
  
  if (dbUrl.includes('planetscale') || dbUrl.includes('psdb.cloud')) {
    console.log('✅ متصل بقاعدة بيانات PlanetScale');
    console.log(`   - Host: ${dbUrl.split('@')[1]?.split('/')[0] || 'غير معروف'}`);
    console.log(`   - Database: ${dbUrl.split('/').pop()?.split('?')[0] || 'غير معروف'}`);
    return true;
  } else {
    console.log('⚠️  تحذير: قد لا تكون متصلاً بقاعدة بيانات PlanetScale الإنتاجية');
    console.log(`   - DATABASE_URL: ${dbUrl.substring(0, 50)}...`);
    return false;
  }
}

/**
 * عرض التوصيات لمنع البيانات التجريبية مستقبلاً
 */
function showRecommendations() {
  console.log('\n📋 توصيات لمنع البيانات التجريبية مستقبلاً:\n');
  
  console.log('1️⃣ إضافة تحققات في النماذج:');
  console.log('   - منع استخدام كلمات مثل "test", "تجربة" في العناوين');
  console.log('   - التحقق من طول المحتوى (لا يقل عن 200 حرف)');
  console.log('   - التحقق من صحة البريد الإلكتروني');
  
  console.log('\n2️⃣ استخدام بيئات منفصلة:');
  console.log('   - بيئة تطوير منفصلة للاختبار');
  console.log('   - منع الوصول المباشر لقاعدة البيانات الإنتاجية');
  
  console.log('\n3️⃣ إضافة حقل is_production:');
  console.log('   - إضافة حقل boolean للتمييز بين البيانات الحقيقية والتجريبية');
  console.log('   - تفعيله تلقائياً في البيئة الإنتاجية');
  
  console.log('\n4️⃣ مراجعة دورية:');
  console.log('   - جدولة تشغيل هذا السكريبت شهرياً');
  console.log('   - مراقبة البيانات الجديدة');
}

/**
 * السؤال للمستخدم
 */
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * الدالة الرئيسية
 */
async function main() {
  console.log('🧹 سكريبت تنظيف البيانات التجريبية');
  console.log('=====================================\n');

  // التحقق من الاتصال
  const isProduction = verifyDatabaseConnection();
  
  if (!isProduction) {
    const proceed = await askQuestion('\n⚠️  هل تريد المتابعة رغم التحذير؟ (نعم/لا): ');
    if (proceed.toLowerCase() !== 'نعم' && proceed.toLowerCase() !== 'yes') {
      console.log('\nتم إلغاء العملية.');
      process.exit(0);
    }
  }

  try {
    // تحليل البيانات
    const dataToDelete = await analyzeData();

    // التحقق من وجود بيانات للحذف
    const totalToDelete = 
      dataToDelete.testArticles.length + 
      dataToDelete.testUsers.length + 
      dataToDelete.testComments.length;

    if (totalToDelete === 0) {
      console.log('\n✨ لم يتم العثور على بيانات تجريبية للحذف!');
      console.log('قاعدة البيانات نظيفة بالفعل.');
    } else {
      console.log(`\n⚠️  سيتم حذف:`);
      console.log(`   - ${dataToDelete.testArticles.length} مقال`);
      console.log(`   - ${dataToDelete.testUsers.length} مستخدم (محتمل)`);
      console.log(`   - ${dataToDelete.testComments.length} تعليق`);

      const confirm = await askQuestion('\nهل أنت متأكد من الحذف؟ اكتب "حذف نهائي" للتأكيد: ');
      
      if (confirm === 'حذف نهائي') {
        await cleanTestData(dataToDelete);
      } else {
        console.log('\nتم إلغاء عملية الحذف.');
      }
    }

    // عرض التوصيات
    showRecommendations();

  } catch (error) {
    console.error('\n❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// تشغيل السكريبت
main().catch(console.error); 