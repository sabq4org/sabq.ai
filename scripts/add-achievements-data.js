const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function addAchievementsData() {
  try {
    console.log('🏆 إضافة بيانات لتفعيل الإنجازات...');
    
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
    
    const now = new Date();
    const interactions = [];
    
    // 1. إضافة 30 قراءة صباحية لإنجاز "قارئ صباحي"
    console.log('🌅 إضافة قراءات صباحية...');
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(7, Math.floor(Math.random() * 60), 0, 0); // بين 7:00 و 7:59 صباحاً
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      interactions.push({
        userId,
        articleId: randomArticle.id,
        type: 'view',
        createdAt: date
      });
    }
    
    // 2. إضافة قراءات ليلية لإنجاز "بومة الليل"
    console.log('🦉 إضافة قراءات ليلية...');
    for (let i = 0; i < 25; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(i / 2));
      date.setHours(Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0); // بين 12:00 و 2:59 صباحاً
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      interactions.push({
        userId,
        articleId: randomArticle.id,
        type: 'view',
        createdAt: date
      });
    }
    
    // 3. إضافة مشاركات لإنجاز "اجتماعي"
    console.log('🦋 إضافة مشاركات...');
    for (let i = 0; i < 60; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(i / 3));
      date.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        0,
        0
      );
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      interactions.push({
        userId,
        articleId: randomArticle.id,
        type: 'share',
        createdAt: date
      });
    }
    
    // 4. إضافة إعجابات لإنجاز "محب المحتوى"
    console.log('❤️ إضافة إعجابات...');
    for (let i = 0; i < 55; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(i / 2));
      date.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        0,
        0
      );
      
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      
      interactions.push({
        userId,
        articleId: randomArticle.id,
        type: 'like',
        createdAt: date
      });
    }
    
    // 5. إضافة قراءات من تصنيف واحد لإنجاز "متخصص"
    console.log('🎯 إضافة قراءات متخصصة...');
    const techCategory = articles.find(a => a.category?.slug === 'technology')?.category;
    if (techCategory) {
      const techArticles = articles.filter(a => a.categoryId === techCategory.id);
      
      for (let i = 0; i < 35; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(i / 2));
        
        const randomTechArticle = techArticles[Math.floor(Math.random() * techArticles.length)];
        if (randomTechArticle) {
          interactions.push({
            userId,
            articleId: randomTechArticle.id,
            type: 'view',
            createdAt: date
          });
        }
      }
    }
    
    console.log(`📝 إضافة ${interactions.length} تفاعل...`);
    
    // إضافة التفاعلات
    let addedCount = 0;
    for (const interaction of interactions) {
      try {
        // تحقق من عدم وجود تفاعل مماثل
        const existing = await prisma.interaction.findFirst({
          where: {
            userId: interaction.userId,
            articleId: interaction.articleId,
            type: interaction.type
          }
        });
        
        if (!existing) {
          await prisma.interaction.create({
            data: interaction
          });
          addedCount++;
        }
      } catch (error) {
        // تجاهل الأخطاء
      }
    }
    
    console.log(`✅ تم إضافة ${addedCount} تفاعل جديد`);
    
    // إضافة نقاط ولاء للإنجازات
    console.log('💎 إضافة نقاط ولاء...');
    
    const loyaltyPoints = [
      { points: 50, action: 'morning_reader', description: 'إنجاز قارئ صباحي' },
      { points: 50, action: 'night_owl', description: 'إنجاز بومة الليل' },
      { points: 75, action: 'social_butterfly', description: 'إنجاز اجتماعي' },
      { points: 50, action: 'content_lover', description: 'إنجاز محب المحتوى' },
      { points: 100, action: 'specialist', description: 'إنجاز متخصص' }
    ];
    
    for (const point of loyaltyPoints) {
      try {
        await prisma.loyalty_points.create({
            data: {
              user_id: userId,
            points: point.points,
            action: point.action,
            description: point.description,
            createdAt: new Date()
          }
        });
      } catch (error) {
        // تجاهل الأخطاء
      }
    }
    
    console.log('✅ تم إضافة نقاط الولاء');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAchievementsData(); 