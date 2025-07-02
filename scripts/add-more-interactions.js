const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function addMoreInteractions() {
  try {
    console.log('🌱 إضافة المزيد من التفاعلات لإظهار الإنجازات...');
    
    const userId = "1";
    
    // جلب المقالات مع تصنيفاتها
    const articles = await prisma.article.findMany({
      where: { 
        status: 'published',
        categoryId: { not: null }
      },
      include: { category: true }
    });
    
    console.log(`📋 وجدت ${articles.length} مقال`);
    
    // إضافة تفاعلات صباحية لإنجاز "قارئ صباحي"
    const morningInteractions = [];
    const now = new Date();
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(7, 30, 0, 0); // 7:30 صباحاً
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      morningInteractions.push({
        userId,
        articleId: randomArticle.id,
        type: 'view',
        createdAt: date
      });
    }
    
    // إضافة المزيد من الإعجابات لإنجاز "قارئ متفاعل"
    const likeInteractions = [];
    for (let i = 0; i < 25; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(i / 3));
      date.setHours(14 + (i % 8), Math.floor(Math.random() * 60), 0, 0);
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      likeInteractions.push({
        userId,
        articleId: randomArticle.id,
        type: 'like',
        createdAt: date
      });
    }
    
    // إضافة المزيد من المشاركات لإنجاز "ناشر المعرفة"
    const shareInteractions = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(i / 2));
      date.setHours(16 + (i % 6), Math.floor(Math.random() * 60), 0, 0);
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      shareInteractions.push({
        userId,
        articleId: randomArticle.id,
        type: 'share',
        createdAt: date
      });
    }
    
    // إضافة تفاعلات لسلسلة قراءة 7 أيام
    const streakInteractions = [];
    for (let day = 0; day < 8; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // 2-3 مقالات يومياً
      const dailyCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < dailyCount; i++) {
        const hour = 8 + Math.floor(Math.random() * 14);
        date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        
        const randomArticle = articles[Math.floor(Math.random() * articles.length)];
        
        streakInteractions.push({
          userId,
          articleId: randomArticle.id,
          type: 'view',
          createdAt: new Date(date)
        });
      }
    }
    
    // إضافة جميع التفاعلات
    const allInteractions = [
      ...morningInteractions,
      ...likeInteractions,
      ...shareInteractions,
      ...streakInteractions
    ];
    
    console.log(`📝 إضافة ${allInteractions.length} تفاعل...`);
    
    let addedCount = 0;
    for (const interaction of allInteractions) {
      try {
        await prisma.interaction.create({
          data: interaction
        });
        addedCount++;
      } catch (error) {
        // تجاهل التكرارات
      }
    }
    
    console.log(`✅ تم إضافة ${addedCount} تفاعل جديد`);
    
    // إضافة نقاط الولاء
    const loyaltyPoints = [];
    const viewCount = allInteractions.filter(i => i.type === 'view').length;
    const likeCount = allInteractions.filter(i => i.type === 'like').length;
    const shareCount = allInteractions.filter(i => i.type === 'share').length;
    
    // نقاط القراءة
    for (let i = 0; i < viewCount; i++) {
      loyaltyPoints.push({
        userId,
        points: 10,
        action: 'read_article',
        description: 'قراءة مقال'
      });
    }
    
    // نقاط الإعجاب
    for (let i = 0; i < likeCount; i++) {
      loyaltyPoints.push({
        userId,
        points: 5,
        action: 'like_article',
        description: 'الإعجاب بمقال'
      });
    }
    
    // نقاط المشاركة
    for (let i = 0; i < shareCount; i++) {
      loyaltyPoints.push({
        userId,
        points: 15,
        action: 'share_article',
        description: 'مشاركة مقال'
      });
    }
    
    console.log(`💎 إضافة ${loyaltyPoints.length} نقطة ولاء...`);
    
    try {
      const loyaltyResult = await prisma.loyaltyPoints.createMany({
        data: loyaltyPoints
      });
      console.log(`✅ تم إضافة ${loyaltyResult.count} نقطة ولاء`);
    } catch (error) {
      console.log('⚠️ تم تجاهل بعض نقاط الولاء المكررة');
    }
    
    // عرض ملخص
    console.log('\n📊 ملخص التفاعلات المضافة:');
    console.log(`- القراءات الصباحية: ${morningInteractions.length}`);
    console.log(`- الإعجابات: ${likeCount}`);
    console.log(`- المشاركات: ${shareCount}`);
    console.log(`- سلسلة القراءة: ${streakInteractions.length} قراءة على مدى 8 أيام`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreInteractions(); 