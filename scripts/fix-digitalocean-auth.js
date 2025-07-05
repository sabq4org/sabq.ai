#!/usr/bin/env node

/**
 * سكريبت إصلاح مشاكل المصادقة على DigitalOcean
 * يقوم بالتحقق من إعدادات قاعدة البيانات والمصادقة وإصلاح المشاكل
 */

const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');

async function fixDigitalOceanAuth() {
  console.log('🔧 بدء إصلاح مشاكل المصادقة على DigitalOcean...\n');

  // التحقق من متغيرات البيئة
  console.log('1️⃣ فحص متغيرات البيئة...');
  
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ متغيرات البيئة المفقودة:', missingVars);
    console.log('\n📝 يجب إضافة هذه المتغيرات في DigitalOcean App Platform:');
    console.log('DATABASE_URL=[استخدم القيمة من ملف PRIVATE_ENV_VALUES.txt]');
    console.log('JWT_SECRET=82ec93a86232fee07dcee0e3669bb4191953cb42d6ea6847808431d92eda6a1f');
    console.log('\n⚠️ راجع ملف PRIVATE_ENV_VALUES.txt للحصول على القيم الفعلية');
    return;
  }
  
  console.log('✅ جميع متغيرات البيئة موجودة');

  // اختبار الاتصال بقاعدة البيانات
  console.log('\n2️⃣ اختبار الاتصال بقاعدة البيانات...');
  
  let prisma;
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ الاتصال بقاعدة البيانات ناجح');
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
    return;
  }

  // التحقق من وجود مستخدم admin
  console.log('\n3️⃣ التحقق من مستخدم admin...');
  
  try {
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@sabq.org' }
    });

    if (!adminUser) {
      console.log('⚠️ مستخدم admin غير موجود، سيتم إنشاؤه...');
      
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      
      // إنشاء مستخدم admin
      adminUser = await prisma.user.create({
        data: {
          id: '230a1f62-ad7c-453a-b7d3-4524be3c73d5',
          email: 'admin@sabq.org',
          name: 'علي عبده',
          passwordHash: hashedPassword,
          role: 'admin',
          isAdmin: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ تم إنشاء مستخدم admin بنجاح');
    } else {
      console.log('✅ مستخدم admin موجود');
      
      // التحقق من كلمة المرور
      const isPasswordValid = await bcrypt.compare('admin123456', adminUser.passwordHash || '');
      
      if (!isPasswordValid) {
        console.log('⚠️ كلمة مرور admin غير صحيحة، سيتم تحديثها...');
        
        const hashedPassword = await bcrypt.hash('admin123456', 12);
        
        await prisma.user.update({
          where: { id: adminUser.id },
          data: {
            passwordHash: hashedPassword,
            isAdmin: true,
            isVerified: true,
            role: 'admin'
          }
        });
        
        console.log('✅ تم تحديث كلمة مرور admin');
      } else {
        console.log('✅ كلمة مرور admin صحيحة');
      }
    }

    // عرض معلومات المستخدم
    console.log('\n📋 معلومات مستخدم admin:');
    console.log(`ID: ${adminUser.id}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Is Admin: ${adminUser.isAdmin}`);
    console.log(`Is Verified: ${adminUser.isVerified}`);

  } catch (error) {
    console.error('❌ خطأ في التعامل مع مستخدم admin:', error.message);
  }

  // اختبار JWT
  console.log('\n4️⃣ اختبار JWT...');
  
  try {
    const jwt = require('jsonwebtoken');
    const testPayload = { id: 'test', email: 'test@example.com' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ JWT يعمل بشكل صحيح');
  } catch (error) {
    console.error('❌ خطأ في JWT:', error.message);
  }

  // إنهاء الاتصال
  await prisma.$disconnect();
  
  console.log('\n🎉 تم الانتهاء من فحص وإصلاح مشاكل المصادقة!');
  console.log('\n📝 خطوات إضافية لـ DigitalOcean:');
  console.log('1. تأكد من إضافة متغيرات البيئة في App Platform');
  console.log('2. أعد نشر التطبيق بعد إضافة المتغيرات');
  console.log('3. جرب تسجيل الدخول باستخدام: admin@sabq.org / admin123456');
}

// تشغيل السكريبت
if (require.main === module) {
  fixDigitalOceanAuth()
    .catch((error) => {
      console.error('💥 خطأ في تشغيل السكريبت:', error);
      process.exit(1);
    });
}

module.exports = { fixDigitalOceanAuth }; 