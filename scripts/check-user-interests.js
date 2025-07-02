const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function checkUserInterests() {
  try {
    console.log('🔍 التحقق من الاهتمامات المحفوظة...\n');

    // جلب جميع المستخدمين
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`📊 إجمالي المستخدمين: ${users.length}\n`);

    // التحقق من الاهتمامات لكل مستخدم
    for (const user of users) {
      console.log(`\n👤 المستخدم: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);

      // جلب الاهتمامات
      const interests = await prisma.userInterest.findMany({
        where: { userId: user.id },
        orderBy: { score: 'desc' }
      });

      if (interests.length > 0) {
        console.log(`   ✅ الاهتمامات (${interests.length}):`);
        interests.forEach(interest => {
          console.log(`      - ${interest.interest} (Score: ${interest.score}, Source: ${interest.source})`);
        });
      } else {
        console.log('   ❌ لا توجد اهتمامات محفوظة');
      }

      // جلب التفضيلات الإضافية
      const preferences = await prisma.userPreference.findMany({
        where: { 
          userId: user.id,
          key: 'selected_categories'
        }
      });

      if (preferences.length > 0) {
        console.log('   📌 التصنيفات المختارة:', preferences[0].value);
      }
    }

    // إحصائيات عامة
    const totalInterests = await prisma.userInterest.count();
    const uniqueInterests = await prisma.userInterest.groupBy({
      by: ['interest'],
      _count: true,
      orderBy: {
        _count: {
          interest: 'desc'
        }
      }
    });

    console.log('\n\n📈 إحصائيات عامة:');
    console.log(`   - إجمالي الاهتمامات المحفوظة: ${totalInterests}`);
    console.log(`   - الاهتمامات الأكثر شيوعاً:`);
    uniqueInterests.slice(0, 5).forEach(interest => {
      console.log(`      • ${interest.interest}: ${interest._count} مستخدم`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserInterests(); 