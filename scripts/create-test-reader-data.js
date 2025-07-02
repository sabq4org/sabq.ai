const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    // إنشاء أو الحصول على المستخدم التجريبي
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'مستخدم تجريبي',
          role: 'editor',
          isVerified: true
        }
      });
      console.log('✅ تم إنشاء المستخدم:', user.email);
    } else {
      console.log('✅ المستخدم موجود بالفعل:', user.email);
    }

    // الحصول على بعض المقالات
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      take: 5,
      include: { category: true }
    });

    if (articles.length === 0) {
      console.log('❌ لا توجد مقالات منشورة في قاعدة البيانات');
      return;
    }

    // إنشاء تفاعلات متنوعة
    const interactionTypes = ['view', 'like', 'save', 'share', 'comment'];
    const interactions = [];

    for (const article of articles) {
      // إنشاء 2-4 تفاعلات لكل مقال
      const numInteractions = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numInteractions; i++) {
        const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
        
        try {
          const interaction = await prisma.interaction.create({
            data: {
              userId: user.id, // استخدام معرف المستخدم الفعلي
              articleId: article.id,
              type,
              metadata: type === 'comment' ? { comment: 'تعليق تجريبي' } : {}
            }
          });
          
          interactions.push(interaction);
          console.log(`✅ تم إنشاء تفاعل: ${type} للمقال "${article.title.substring(0, 30)}..."`);
        } catch (error) {
          console.log(`⚠️ تخطي تفاعل مكرر: ${type} للمقال ${article.id}`);
        }
      }
    }

    // إنشاء نقاط ولاء
    const loyaltyActions = [
      { action: 'article_read', points: 5 },
      { action: 'article_like', points: 10 },
      { action: 'article_share', points: 15 },
      { action: 'profile_complete', points: 50 },
      { action: 'daily_visit', points: 20 }
    ];

    let totalPoints = 0;
    for (const action of loyaltyActions) {
      const loyalty = await prisma.loyaltyPoint.create({
        data: {
          userId: user.id, // استخدام معرف المستخدم الفعلي
          action: action.action,
          points: action.points,
          metadata: { test: true }
        }
      });
      totalPoints += action.points;
    }

    // عرض ملخص
    console.log('\n📊 ملخص التفاعلات:');
    const summary = interactions.reduce((acc, int) => {
      acc[int.type] = (acc[int.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} تفاعل`);
    });

    console.log(`\n🏆 مجموع نقاط الولاء: ${totalPoints} نقطة`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData(); 