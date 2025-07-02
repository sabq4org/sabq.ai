const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function seedUserInteractions() {
  try {
    console.log('🌱 بدء إضافة التفاعلات التجريبية...');
    
    // المستخدم الذي سنضيف له التفاعلات
    const userId = "1";
    
    // جلب بعض المقالات الموجودة
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      take: 10,
      include: { category: true }
    });
    
    if (articles.length === 0) {
      console.log('❌ لا توجد مقالات منشورة لإضافة تفاعلات عليها');
      return;
    }
    
    console.log(`✅ تم العثور على ${articles.length} مقال`);
    
    // إضافة تفاعلات متنوعة
    const interactions = [];
    const now = new Date();
    
    // إضافة تفاعلات على مدى الأيام السابقة
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      
      // تفاعلات عشوائية لكل يوم
      const dailyInteractionCount = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < dailyInteractionCount; i++) {
        const randomArticle = articles[Math.floor(Math.random() * articles.length)];
        const hour = Math.floor(Math.random() * 24);
        const interactionDate = new Date(date);
        interactionDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        
        // إضافة تفاعل view أولاً
        interactions.push({
          userId,
          articleId: randomArticle.id,
          type: 'view',
          createdAt: interactionDate
        });
        
        // احتمالية إضافة تفاعلات أخرى
        if (Math.random() > 0.5) {
          interactions.push({
            userId,
            articleId: randomArticle.id,
            type: 'like',
            createdAt: new Date(interactionDate.getTime() + 60000) // بعد دقيقة
          });
        }
        
        if (Math.random() > 0.7) {
          interactions.push({
            userId,
            articleId: randomArticle.id,
            type: 'save',
            createdAt: new Date(interactionDate.getTime() + 120000) // بعد دقيقتين
          });
        }
        
        if (Math.random() > 0.8) {
          interactions.push({
            userId,
            articleId: randomArticle.id,
            type: 'share',
            createdAt: new Date(interactionDate.getTime() + 180000) // بعد 3 دقائق
          });
        }
      }
    }
    
    console.log(`📝 إضافة ${interactions.length} تفاعل...`);
    
    // حذف التفاعلات القديمة للمستخدم
    await prisma.interaction.deleteMany({
      where: { userId }
    });
    
    // إضافة التفاعلات الجديدة واحدة تلو الأخرى
    let addedCount = 0;
    for (const interaction of interactions) {
      try {
        await prisma.interaction.create({
          data: interaction
        });
        addedCount++;
      } catch (error) {
        // تجاهل الأخطاء المتعلقة بالتكرار
        console.log(`⚠️ تجاهل تفاعل مكرر: ${interaction.type} على المقال ${interaction.articleId}`);
      }
    }
    
    console.log(`✅ تم إضافة ${addedCount} تفاعل بنجاح`);
    
    // إضافة نقاط ولاء
    const loyaltyPoints = [];
    
    // نقاط للقراءة
    const viewCount = interactions.filter(i => i.type === 'view').length;
    for (let i = 0; i < viewCount; i++) {
      loyaltyPoints.push({
        userId,
        points: 10,
        action: 'read_article',
        description: 'قراءة مقال',
        createdAt: interactions.find(int => int.type === 'view')?.createdAt || now
      });
    }
    
    // نقاط للإعجاب
    const likeCount = interactions.filter(i => i.type === 'like').length;
    for (let i = 0; i < likeCount; i++) {
      loyaltyPoints.push({
        userId,
        points: 5,
        action: 'like_article',
        description: 'الإعجاب بمقال',
        createdAt: interactions.find(int => int.type === 'like')?.createdAt || now
      });
    }
    
    // نقاط للمشاركة
    const shareCount = interactions.filter(i => i.type === 'share').length;
    for (let i = 0; i < shareCount; i++) {
      loyaltyPoints.push({
        userId,
        points: 15,
        action: 'share_article',
        description: 'مشاركة مقال',
        createdAt: interactions.find(int => int.type === 'share')?.createdAt || now
      });
    }
    
    console.log(`💎 إضافة ${loyaltyPoints.length} نقطة ولاء...`);
    
    // حذف نقاط الولاء القديمة
    await prisma.loyaltyPoints.deleteMany({
      where: { userId }
    });
    
    // إضافة نقاط الولاء الجديدة
    const loyaltyResult = await prisma.loyaltyPoints.createMany({
      data: loyaltyPoints
    });
    
    console.log(`✅ تم إضافة ${loyaltyResult.count} نقطة ولاء`);
    
    // عرض ملخص
    console.log('\n📊 ملخص التفاعلات:');
    console.log(`- المشاهدات: ${viewCount}`);
    console.log(`- الإعجابات: ${likeCount}`);
    console.log(`- المقالات المحفوظة: ${interactions.filter(i => i.type === 'save').length}`);
    console.log(`- المشاركات: ${shareCount}`);
    console.log(`- إجمالي النقاط: ${loyaltyPoints.reduce((sum, p) => sum + p.points, 0)}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUserInteractions(); 