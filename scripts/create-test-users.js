const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🔄 بدء إنشاء المستخدمين التجريبيين...');

    // كلمة مرور موحدة للاختبار
    const defaultPassword = 'Test@123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const now = new Date();

    // 1. إنشاء مستخدم مدير
    const admin = await prisma.users.upsert({
      where: { email: 'admin@sabq.ai' },
      update: {
        name: 'مدير النظام',
        password_hash: hashedPassword,
        role: 'admin',
        is_admin: true,
        is_verified: true,
        updated_at: now,
      },
      create: {
        id: uuidv4(),
        email: 'admin@sabq.ai',
        name: 'مدير النظام',
        password_hash: hashedPassword,
        role: 'admin',
        is_admin: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    });

    console.log('✅ تم إنشاء حساب المدير:');
    console.log('   البريد الإلكتروني: admin@sabq.ai');
    console.log('   كلمة المرور: Test@123456');
    console.log('   الصلاحيات: مدير كامل');

    // 2. إنشاء مستخدم عادي
    const user = await prisma.users.upsert({
      where: { email: 'user@sabq.ai' },
      update: {
        name: 'مستخدم تجريبي',
        password_hash: hashedPassword,
        role: 'user',
        is_admin: false,
        is_verified: true,
        updated_at: now,
      },
      create: {
        id: uuidv4(),
        email: 'user@sabq.ai',
        name: 'مستخدم تجريبي',
        password_hash: hashedPassword,
        role: 'user',
        is_admin: false,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    });

    console.log('\n✅ تم إنشاء حساب المستخدم العادي:');
    console.log('   البريد الإلكتروني: user@sabq.ai');
    console.log('   كلمة المرور: Test@123456');
    console.log('   الصلاحيات: مستخدم عادي');

    // 3. إنشاء محرر
    const editor = await prisma.users.upsert({
      where: { email: 'editor@sabq.ai' },
      update: {
        name: 'محرر المحتوى',
        password_hash: hashedPassword,
        role: 'editor',
        is_admin: false,
        is_verified: true,
        updated_at: now,
      },
      create: {
        id: uuidv4(),
        email: 'editor@sabq.ai',
        name: 'محرر المحتوى',
        password_hash: hashedPassword,
        role: 'editor',
        is_admin: false,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    });

    console.log('\n✅ تم إنشاء حساب المحرر:');
    console.log('   البريد الإلكتروني: editor@sabq.ai');
    console.log('   كلمة المرور: Test@123456');
    console.log('   الصلاحيات: محرر محتوى');

    // عرض جميع المستخدمين
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_admin: true,
        is_verified: true,
        created_at: true,
      },
    });

    console.log('\n📋 جميع المستخدمين في النظام:');
    console.table(allUsers);

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدمين:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers(); 