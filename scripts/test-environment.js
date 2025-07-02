#!/usr/bin/env node
// سكريبت اختبار البيئة - منصة سبق الذكية

const path = require('path');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة من .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// تحديد المسار الصحيح للملفات
const prismaPath = path.join(__dirname, '../lib/generated/prisma');
const debugPath = path.join(__dirname, '../lib/debug');

// حذف الكاش لإعادة تحميل الملفات
delete require.cache[require.resolve(prismaPath)];
delete require.cache[require.resolve(debugPath)];

const { PrismaClient } = require(prismaPath);
const { logEnvironment, logDatabaseConnection, getEnvironmentConfig } = require(debugPath);

console.log('🔍 اختبار تكوين البيئة...\n');

// عرض معلومات البيئة
logEnvironment();

// الحصول على تكوين البيئة
const config = getEnvironmentConfig();

console.log('\n📊 تحليل البيئة:');
console.log('- بيئة الإنتاج:', config.isProduction ? '✅ نعم' : '❌ لا');
console.log('- بيئة التطوير:', config.isDevelopment ? '✅ نعم' : '❌ لا');
console.log('- Vercel:', config.isVercel ? '✅ نعم' : '❌ لا');
console.log('- API URL:', config.apiUrl);
console.log('- وضع التصحيح:', config.debug ? '✅ مفعل' : '❌ معطل');

// اختبار المتغيرات المطلوبة
console.log('\n🔐 فحص المتغيرات المطلوبة:');

const requiredVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL',
  'JWT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

const optionalVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS'
];

let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const exists = !!process.env[varName];
  console.log(`- ${varName}: ${exists ? '✅ موجود' : '❌ مفقود'}`);
  if (!exists) allRequiredPresent = false;
});

console.log('\n📦 فحص المتغيرات الاختيارية:');
optionalVars.forEach(varName => {
  const exists = !!process.env[varName];
  console.log(`- ${varName}: ${exists ? '✅ موجود' : '⚠️ غير محدد'}`);
});

// اختبار اتصال قاعدة البيانات
if (allRequiredPresent && process.env.DATABASE_URL) {
  console.log('\n🔌 اختبار اتصال قاعدة البيانات...');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(async () => {
      logDatabaseConnection(true);
      
      // محاولة قراءة بعض البيانات
      try {
        const userCount = await prisma.user.count();
        const categoryCount = await prisma.category.count();
        const articleCount = await prisma.article.count();
        
        console.log('\n📈 إحصائيات قاعدة البيانات:');
        console.log(`- عدد المستخدمين: ${userCount}`);
        console.log(`- عدد الفئات: ${categoryCount}`);
        console.log(`- عدد المقالات: ${articleCount}`);
      } catch (error) {
        console.error('⚠️ خطأ في قراءة البيانات:', error.message);
      }
      
      await prisma.$disconnect();
      console.log('\n✅ اختبار البيئة مكتمل بنجاح!');
      process.exit(0);
    })
    .catch(async (error) => {
      logDatabaseConnection(false, error);
      await prisma.$disconnect();
      console.log('\n❌ فشل اختبار البيئة!');
      process.exit(1);
    });
} else {
  console.log('\n❌ لا يمكن اختبار قاعدة البيانات - متغيرات مطلوبة مفقودة!');
  console.log('\n📝 تأكد من وجود ملف .env.local مع جميع المتغيرات المطلوبة');
  process.exit(1);
} 