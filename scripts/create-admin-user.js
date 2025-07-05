const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔄 إنشاء مستخدم مدير...');
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    // إنشاء المستخدم
    const user = await prisma.user.upsert({
      where: {
        email: 'admin@sabq.org'
      },
      update: {
        passwordHash: hashedPassword,
        role: 'admin',
        isAdmin: true,
        isVerified: true
      },
      create: {
        id: 'admin-user-1',
        name: 'مدير سبق',
        email: 'admin@sabq.org',
        passwordHash: hashedPassword,
        role: 'admin',
        isAdmin: true,
        isVerified: true,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ تم إنشاء المستخدم المدير بنجاح:');
    console.log(`📧 البريد الإلكتروني: ${user.email}`);
    console.log(`👤 الاسم: ${user.name}`);
    console.log(`🔑 الدور: ${user.role}`);
    console.log(`🔐 كلمة المرور: admin123456`);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 