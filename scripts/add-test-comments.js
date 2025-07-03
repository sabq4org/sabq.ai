const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function addTestComments() {
  try {
    console.log('🔄 جاري إضافة تعليقات تجريبية...');

    // جلب مقال موجود
    const article = await prisma.article.findFirst({
      where: { status: 'published' }
    });

    if (!article) {
      console.log('❌ لا توجد مقالات منشورة');
      return;
    }

    // جلب مستخدم موجود
    const user = await prisma.user.findFirst();

    // إضافة تعليقات بتصنيفات مختلفة
    const comments = [
      {
        articleId: article.id,
        userId: user?.id || null,
        content: 'مقال رائع ومفيد جداً، شكراً للكاتب على هذا المحتوى القيم',
        status: 'approved',
        aiScore: 95,
        aiClassification: 'safe',
        metadata: {
          guestName: user ? null : 'زائر كريم',
          ipAddress: '192.168.1.1'
        }
      },
      {
        articleId: article.id,
        userId: null,
        content: 'هذا الكاتب لا يفهم شيئاً ويجب طرده فوراً',
        status: 'pending',
        aiScore: 15,
        aiClassification: 'toxic',
        metadata: {
          guestName: 'زائر غاضب',
          ipAddress: '192.168.1.2'
        }
      },
      {
        articleId: article.id,
        userId: null,
        content: 'احصل على آيفون مجاناً! اضغط هنا www.spam.com',
        status: 'rejected',
        aiScore: 10,
        aiClassification: 'spam',
        metadata: {
          guestName: 'مُعلن',
          ipAddress: '192.168.1.3'
        }
      },
      {
        articleId: article.id,
        userId: user?.id || null,
        content: 'معلومات مفيدة لكن أعتقد أن هناك بعض النقاط تحتاج لمزيد من التوضيح',
        status: 'approved',
        aiScore: 85,
        aiClassification: 'safe',
        metadata: {
          guestName: user ? null : 'قارئ نشط',
          ipAddress: '192.168.1.4'
        }
      },
      {
        articleId: article.id,
        userId: null,
        content: 'المقال جيد لكن العنوان مضلل قليلاً',
        status: 'pending',
        aiScore: 65,
        aiClassification: 'suspicious',
        metadata: {
          guestName: 'ناقد',
          ipAddress: '192.168.1.5'
        }
      }
    ];

    // إضافة التعليقات
    let addedCount = 0;
    for (const comment of comments) {
      try {
        await prisma.comment.create({
          data: {
            ...comment,
            aiAnalyzedAt: new Date()
          }
        });
        addedCount++;
        console.log(`✅ تم إضافة تعليق: "${comment.content.substring(0, 30)}..."`);
      } catch (error) {
        console.error(`❌ خطأ في إضافة تعليق:`, error.message);
      }
    }

    console.log(`\n✅ تم إضافة ${addedCount} تعليق تجريبي بنجاح`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestComments(); 