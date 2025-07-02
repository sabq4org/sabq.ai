const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 البحث عن المستخدمين...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        isVerified: true
      }
    });
    
    console.log(`📊 إجمالي المستخدمين: ${users.length}`);
    console.log('------------------------\n');
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'بدون اسم'}`);
        console.log(`   - البريد: ${user.email}`);
        console.log(`   - الدور: ${user.role}`);
        console.log(`   - مدير: ${user.isAdmin ? 'نعم' : 'لا'}`);
        console.log(`   - مُفعّل: ${user.isVerified ? 'نعم' : 'لا'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  لا يوجد مستخدمين في قاعدة البيانات');
      console.log('\n💡 يمكنك إضافة مستخدمين عبر:');
      console.log('   1. التسجيل من الموقع');
      console.log('   2. استخدام Prisma Studio');
      console.log('   3. تشغيل سكريبت إضافة مستخدمين');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 