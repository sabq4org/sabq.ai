const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function checkUserData() {
  try {
    const userId = "1";
    
    // عد التفاعلات
    const interactionCount = await prisma.interaction.count({
      where: { userId }
    });
    
    console.log(`📊 عدد التفاعلات: ${interactionCount}`);
    
    // تفاصيل التفاعلات
    const interactionTypes = await prisma.interaction.groupBy({
      by: ['type'],
      where: { userId },
      _count: true
    });
    
    console.log('\n📈 توزيع التفاعلات:');
    interactionTypes.forEach(item => {
      console.log(`- ${item.type}: ${item._count}`);
    });
    
    // نقاط الولاء
    const totalPoints = await prisma.loyaltyPoints.aggregate({
      where: { userId },
      _sum: { points: true }
    });
    
    console.log(`\n💎 إجمالي نقاط الولاء: ${totalPoints._sum.points || 0}`);
    
    // آخر التفاعلات
    const recentInteractions = await prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        article: {
          select: {
            title: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n📅 آخر 5 تفاعلات:');
    recentInteractions.forEach(interaction => {
      console.log(`- ${interaction.type} على "${interaction.article?.title}" في ${interaction.createdAt.toLocaleString('ar-SA')}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData(); 