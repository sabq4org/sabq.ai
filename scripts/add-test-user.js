const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('بدء إضافة المستخدم التجريبي...');

  try {
    // إنشاء مستخدم تجريبي
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'مستخدم تجريبي',
        passwordHash: hashedPassword,
        role: 'user',
        isVerified: true,
        isAdmin: false
      },
    });

    console.log('تم إنشاء المستخدم التجريبي:', user.email);
    console.log('كلمة المرور: 123456');

    // إنشاء مستخدم مدير
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'مدير النظام',
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
        isAdmin: true
      },
    });

    console.log('تم إنشاء مدير النظام:', adminUser.email);
    console.log('كلمة المرور: 123456');

    console.log('تم إضافة البيانات التجريبية بنجاح!');
  } catch (error) {
    console.error('خطأ في إضافة البيانات التجريبية:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 