// test-connection.js -- إصدار Prisma
const { PrismaClient } = require('@prisma/client');

console.log('🔄 محاولة الاتصال بقاعدة البيانات باستخدام Prisma Client...');

// تعريف Prisma Client مع تحديد مصدر البيانات بشكل صريح لضمان استخدام الرابط الصحيح
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:[YOUR_PASSWORD]@db.uopckyrdhlvsxnvcobbw.supabase.co:5432/postgres?sslmode=require',
    },
  },
  log: ['info', 'warn', 'error'], // تفعيل اللوق لرؤية الأخطاء من Prisma
});

async function main() {
  try {
    console.log('Executing a simple query with Prisma...');
    
    // prisma.$connect() يقوم بفتح اتصال، و أول استعلام يتأكد منه
    const result = await prisma.$queryRaw`SELECT version();`;
    
    console.log('✅ نجح الاتصال والاستعلام!');
    console.log('----------');
    console.log('⚙️ إصدار PostgreSQL:', result[0].version);
    console.log('----------');
    console.log('🎉 الاختبار نجح بالكامل باستخدام Prisma.');
    
  } catch (e) {
    console.error('❌ فشل الاختبار باستخدام Prisma:');
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
