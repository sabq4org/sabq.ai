const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function completeUserData() {
  try {
    console.log('🚀 بدء إضافة بيانات شاملة للمستخدم...');
    
    const userId = "1";
    
    // جلب المقالات مع تصنيفاتها
    const articles = await prisma.article.findMany({
      where: { 
        status: 'published',
        categoryId: { not: null }
      },
      include: { category: true }
    });
    
    if (articles.length === 0) {
      console.log('❌ لا توجد مقالات منشورة');
      return;
    }
    
    console.log(`📋 وجدت ${articles.length} مقال`);
    
    // حذف التفاعلات القديمة
    await prisma.interaction.deleteMany({
      where: { userId }
    });
    
    console.log('🧹 تم حذف التفاعلات القديمة');
    
    // إنشاء تفاعلات متنوعة على مدى 30 يوم
    const interactions = [];
    const now = new Date();
    
    // 1. إضافة قراءات يومية لضمان سلسلة 7 أيام متتالية
    console.log('📖 إضافة قراءات يومية...');
    for (let day = 0; day < 10; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // 3-5 مقالات يومياً
      const dailyCount = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < dailyCount; i++) {
        const hour = 6 + Math.floor(Math.random() * 16); // من 6 صباحاً إلى 10 مساءً
        const interactionDate = new Date(date);
        interactionDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        
        const article = articles[Math.floor(Math.random() * articles.length)];
        
        // قراءة المقال
        interactions.push({
          userId,
          articleId: article.id,
          type: 'view',
          createdAt: interactionDate
        });
      }
    }
    
    // 2. إضافة قراءات صباحية (15+ للحصول على إنجاز قارئ صباحي)
    console.log('🌅 إضافة قراءات صباحية...');
    for (let i = 0; i < 20; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 2)); // توزيع على 40 يوم
      date.setHours(6 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0); // 6-10 صباحاً
      
      const article = articles[Math.floor(Math.random() * articles.length)];
      
      interactions.push({
        userId,
        articleId: article.id,
        type: 'view',
        createdAt: date
      });
    }
    
    // 3. إضافة إعجابات (25+ للحصول على إنجاز قارئ متفاعل)
    console.log('❤️ إضافة إعجابات...');
    const viewedArticles = [...new Set(interactions.filter(i => i.type === 'view').map(i => i.articleId))];
    const likedArticles = viewedArticles.slice(0, 30);
    
    for (const articleId of likedArticles) {
      const viewInteraction = interactions.find(i => i.articleId === articleId && i.type === 'view');
      if (viewInteraction) {
        const likeDate = new Date(viewInteraction.createdAt);
        likeDate.setMinutes(likeDate.getMinutes() + 5); // بعد 5 دقائق من القراءة
        
        interactions.push({
          userId,
          articleId,
          type: 'like',
          createdAt: likeDate
        });
      }
    }
    
    // 4. إضافة مشاركات (15+ للحصول على إنجاز ناشر المعرفة)
    console.log('🔄 إضافة مشاركات...');
    const sharedArticles = likedArticles.slice(0, 20);
    
    for (const articleId of sharedArticles) {
      const likeInteraction = interactions.find(i => i.articleId === articleId && i.type === 'like');
      if (likeInteraction) {
        const shareDate = new Date(likeInteraction.createdAt);
        shareDate.setMinutes(shareDate.getMinutes() + 10); // بعد 10 دقائق من الإعجاب
        
        interactions.push({
          userId,
          articleId,
          type: 'share',
          createdAt: shareDate
        });
      }
    }
    
    // 5. إضافة مقالات محفوظة
    console.log('💾 إضافة مقالات محفوظة...');
    const savedArticles = viewedArticles.slice(0, 15);
    
    for (const articleId of savedArticles) {
      const viewInteraction = interactions.find(i => i.articleId === articleId && i.type === 'view');
      if (viewInteraction) {
        const saveDate = new Date(viewInteraction.createdAt);
        saveDate.setMinutes(saveDate.getMinutes() + 3); // بعد 3 دقائق من القراءة
        
        interactions.push({
          userId,
          articleId,
          type: 'save',
          createdAt: saveDate
        });
      }
    }
    
    // 6. إضافة تعليقات
    console.log('💬 إضافة تعليقات...');
    const commentedArticles = likedArticles.slice(0, 10);
    
    for (const articleId of commentedArticles) {
      const likeInteraction = interactions.find(i => i.articleId === articleId && i.type === 'like');
      if (likeInteraction) {
        const commentDate = new Date(likeInteraction.createdAt);
        commentDate.setMinutes(commentDate.getMinutes() + 15); // بعد 15 دقيقة من الإعجاب
        
        interactions.push({
          userId,
          articleId,
          type: 'comment',
          createdAt: commentDate
        });
      }
    }
    
    // إضافة جميع التفاعلات
    console.log(`📝 إضافة ${interactions.length} تفاعل...`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const interaction of interactions) {
      try {
        await prisma.interaction.create({
          data: interaction
        });
        addedCount++;
      } catch (error) {
        skippedCount++;
      }
    }
    
    console.log(`✅ تم إضافة ${addedCount} تفاعل`);
    console.log(`⏭️ تم تجاهل ${skippedCount} تفاعل مكرر`);
    
    // حذف نقاط الولاء القديمة
    await prisma.loyaltyPoints.deleteMany({
      where: { userId }
    });
    
    // إضافة نقاط الولاء
    const loyaltyPoints = [];
    const finalInteractions = await prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    
    for (const interaction of finalInteractions) {
      let points = 0;
      let action = '';
      let description = '';
      
      switch (interaction.type) {
        case 'view':
          points = 10;
          action = 'read_article';
          description = 'قراءة مقال';
          break;
        case 'like':
          points = 5;
          action = 'like_article';
          description = 'الإعجاب بمقال';
          break;
        case 'share':
          points = 15;
          action = 'share_article';
          description = 'مشاركة مقال';
          break;
        case 'save':
          points = 5;
          action = 'save_article';
          description = 'حفظ مقال';
          break;
        case 'comment':
          points = 10;
          action = 'comment_article';
          description = 'التعليق على مقال';
          break;
      }
      
      if (points > 0) {
        loyaltyPoints.push({
          userId,
          points,
          action,
          description,
          referenceId: interaction.articleId,
          referenceType: 'article',
          createdAt: interaction.createdAt
        });
      }
    }
    
    console.log(`💎 إضافة ${loyaltyPoints.length} نقطة ولاء...`);
    
    const loyaltyResult = await prisma.loyaltyPoints.createMany({
      data: loyaltyPoints
    });
    
    console.log(`✅ تم إضافة ${loyaltyResult.count} نقطة ولاء`);
    
    // عرض ملخص نهائي
    const summary = await prisma.interaction.groupBy({
      by: ['type'],
      where: { userId },
      _count: true
    });
    
    const totalPoints = await prisma.loyaltyPoints.aggregate({
      where: { userId },
      _sum: { points: true }
    });
    
    console.log('\n📊 ملخص البيانات النهائي:');
    console.log('=======================');
    summary.forEach(item => {
      const typeMap = {
        view: 'قراءات',
        like: 'إعجابات',
        share: 'مشاركات',
        save: 'مقالات محفوظة',
        comment: 'تعليقات'
      };
      console.log(`- ${typeMap[item.type] || item.type}: ${item._count}`);
    });
    console.log(`- إجمالي النقاط: ${totalPoints._sum.points || 0}`);
    console.log('=======================');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeUserData(); 