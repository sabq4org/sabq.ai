#!/usr/bin/env node

/**
 * سكريبت اختبار اتصال قاعدة البيانات
 * يتحقق من Connection Pooling ويعرض معلومات مفيدة
 */

require('dotenv').config();
const { PrismaClient } = require('../lib/generated/prisma');

// ألوان للـ console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function testConnection() {
  console.log(`${colors.cyan}🔍 بدء اختبار اتصال قاعدة البيانات...${colors.reset}\n`);

  // عرض معلومات البيئة
  console.log(`${colors.blue}📋 معلومات البيئة:${colors.reset}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ موجود' : '❌ غير موجود'}`);
  console.log(`- DIRECT_URL: ${process.env.DIRECT_URL ? '✅ موجود' : '❌ غير موجود'}`);
  
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`- Host: ${url.hostname}`);
    console.log(`- Port: ${url.port}`);
    console.log(`- Database: ${url.pathname.slice(1)}`);
    console.log(`- Connection Pooling: ${url.port === '6543' ? '✅ مفعّل (pgBouncer)' : '❌ اتصال مباشر'}`);
  }
  console.log('');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // اختبار الاتصال الأساسي
    console.log(`${colors.yellow}🔗 محاولة الاتصال بقاعدة البيانات...${colors.reset}`);
    const startTime = Date.now();
    
    await prisma.$connect();
    
    const connectionTime = Date.now() - startTime;
    console.log(`${colors.green}✅ تم الاتصال بنجاح في ${connectionTime}ms${colors.reset}\n`);

    // اختبار query بسيط
    console.log(`${colors.yellow}📊 جمع إحصائيات قاعدة البيانات...${colors.reset}`);
    
    const [
      usersCount,
      articlesCount,
      categoriesCount,
      commentsCount
    ] = await Promise.all([
      prisma.users.count(),
      prisma.articles.count(),
      prisma.categories.count(),
      prisma.comments.count()
    ]);

    console.log(`${colors.green}📈 الإحصائيات:${colors.reset}`);
    console.log(`- عدد المستخدمين: ${usersCount}`);
    console.log(`- عدد المقالات: ${articlesCount}`);
    console.log(`- عدد الفئات: ${categoriesCount}`);
    console.log(`- عدد التعليقات: ${commentsCount}\n`);

    // اختبار أداء Query
    console.log(`${colors.yellow}⚡ اختبار أداء الاستعلامات...${colors.reset}`);
    
    const queries = [
      { name: 'جلب آخر 10 مقالات', fn: () => prisma.articles.findMany({ take: 10, orderBy: { created_at: 'desc' } }) },
      { name: 'جلب الفئات النشطة', fn: () => prisma.categories.findMany({ where: { is_active: true } }) },
      { name: 'عد المستخدمين المؤكدين', fn: () => prisma.users.count({ where: { is_verified: true } }) }
    ];

    for (const query of queries) {
      const start = Date.now();
      await query.fn();
      const time = Date.now() - start;
      console.log(`- ${query.name}: ${time}ms`);
    }

    // اختبار Connection Pool
    console.log(`\n${colors.yellow}🔄 اختبار Connection Pool...${colors.reset}`);
    
    const concurrentQueries = 10;
    const start = Date.now();
    
    await Promise.all(
      Array(concurrentQueries).fill(null).map((_, i) => 
        prisma.articles.count().then(() => {
          console.log(`  - Query ${i + 1} ✅`);
        })
      )
    );
    
    const totalTime = Date.now() - start;
    console.log(`${colors.green}✅ تم تنفيذ ${concurrentQueries} استعلامات متزامنة في ${totalTime}ms${colors.reset}`);
    console.log(`- متوسط الوقت لكل استعلام: ${Math.round(totalTime / concurrentQueries)}ms\n`);

    // النتيجة النهائية
    console.log(`${colors.green}🎉 نجحت جميع الاختبارات!${colors.reset}`);
    console.log(`${colors.cyan}✨ قاعدة البيانات تعمل بشكل ممتاز مع Connection Pooling${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ فشل الاختبار:${colors.reset}`);
    console.error(error);
    
    // نصائح لحل المشاكل
    console.log(`\n${colors.yellow}💡 نصائح لحل المشكلة:${colors.reset}`);
    
    if (error.code === 'P1001') {
      console.log('- تحقق من أن قاعدة البيانات تعمل');
      console.log('- تحقق من صحة DATABASE_URL');
      console.log('- تحقق من إعدادات الشبكة والجدار الناري');
    } else if (error.code === 'P1002') {
      console.log('- تحقق من أن الخادم يقبل الاتصالات');
      console.log('- تحقق من timeout settings');
    } else if (error.code === 'P1003') {
      console.log('- تحقق من أن قاعدة البيانات موجودة');
      console.log('- تحقق من صحة اسم قاعدة البيانات في DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الاختبار
testConnection().catch(console.error);
