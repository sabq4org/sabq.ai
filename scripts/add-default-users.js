const { PrismaClient } = require('../lib/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function addDefaultUsers() {
  try {
    console.log('🚀 بدء إضافة المستخدمين الافتراضيين...\n');

    const users = [
      {
        email: 'ali@alhazm.org',
        name: 'علي الحازمي',
        password: '123456',
        role: 'admin',
        isAdmin: true,
        isVerified: true
      },
      {
        email: 'sabq@icloud.com',
        name: 'مستخدم سبق',
        password: '123456',
        role: 'user',
        isAdmin: false,
        isVerified: true
      }
    ];

    for (const userData of users) {
      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  المستخدم ${userData.email} موجود بالفعل`);
        continue;
      }

      // تشفير كلمة المرور
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // إنشاء المستخدم
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          passwordHash: passwordHash,
          role: userData.role,
          isAdmin: userData.isAdmin,
          isVerified: userData.isVerified
        }
      });

      console.log(`✅ تم إضافة: ${newUser.name} (${newUser.email})`);
      console.log(`   - الدور: ${newUser.role}`);
      console.log(`   - مدير: ${newUser.isAdmin ? 'نعم' : 'لا'}`);
      console.log('');
    }

    console.log('\n✨ تم إضافة المستخدمين الافتراضيين بنجاح!');
    console.log('\n📝 يمكنك الآن تسجيل الدخول بـ:');
    console.log('   - المدير: ali@alhazm.org / 123456');
    console.log('   - المستخدم: sabq@icloud.com / 123456');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDefaultUsers(); 