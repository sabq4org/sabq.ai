const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('البحث عن المستخدمين المدراء...\n');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        isAdmin: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true
      }
    });
    
    if (adminUsers.length === 0) {
      console.log('❌ لا يوجد مستخدمون مدراء في النظام حالياً\n');
      console.log('يمكنك إنشاء مستخدم مدير باستخدام:');
      console.log('- البريد الإلكتروني: admin@example.com');
      console.log('- كلمة المرور: 123456');
      console.log('\nأو تشغيل: npm run seed');
    } else {
      console.log(`✅ تم العثور على ${adminUsers.length} مستخدم مدير:\n`);
      
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 البريد الإلكتروني: ${user.email}`);
        console.log(`   🔑 الدور: ${user.isAdmin ? 'مدير' : 'مستخدم عادي'}`);
        console.log(`   📅 تاريخ الإنشاء: ${new Date(user.createdAt).toLocaleDateString('ar-SA')}`);
        console.log(`   ✓ الحالة: ${user.isVerified ? 'مفعّل' : 'غير مفعّل'}`);
        console.log('   -------------------');
      });
      
      console.log('\n💡 ملاحظة: كلمة المرور الافتراضية لجميع المستخدمين التجريبيين هي: 123456');
    }
    
    // البحث عن أي مستخدمين آخرين
    const allUsers = await prisma.user.count();
    console.log(`\n📊 إجمالي المستخدمين في النظام: ${allUsers}`);
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    console.log('\nتأكد من:');
    console.log('1. تشغيل قاعدة البيانات');
    console.log('2. صحة إعدادات الاتصال في ملف .env');
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers(); 