const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function addSampleForumData() {
  console.log('🚀 إضافة بيانات تجريبية لمنتدى سبق...\n');
  
  try {
    // إنشاء بعض المستخدمين التجريبيين (إذا لم يكونوا موجودين)
    const testUsers = [
      { id: 'user1', name: 'أحمد الغامدي', email: 'ahmad@test.com' },
      { id: 'user2', name: 'سارة المالكي', email: 'sara@test.com' },
      { id: 'user3', name: 'محمد العتيبي', email: 'mohammed@test.com' }
    ];

    for (const user of testUsers) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO users (id, name, email) VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE name = name
        `, user.id, user.name, user.email);
      } catch (e) {
        // تجاهل الأخطاء إذا كان المستخدم موجوداً
      }
    }

    console.log('✅ تم إنشاء المستخدمين التجريبيين\n');

    // جلب فئات المنتدى
    const categories = await prisma.$queryRaw`
      SELECT id, slug FROM forum_categories
    `;

    if (categories.length === 0) {
      console.log('❌ لا توجد فئات في المنتدى');
      return;
    }

    console.log(`📋 تم العثور على ${categories.length} فئة\n`);

    // إضافة مواضيع تجريبية
    const topics = [
      {
        title: 'مرحباً بكم في منتدى سبق الجديد!',
        content: 'أهلاً وسهلاً بجميع أعضاء مجتمع سبق. هذا المنتدى الجديد سيكون مساحة للنقاش وتبادل الأفكار حول منصتنا.',
        category_id: categories.find(c => c.slug === 'announcements')?.id || categories[0].id,
        author_id: 'user1',
        is_pinned: true,
        views: 523
      },
      {
        title: 'كيف أستخدم نظام الذكاء الاصطناعي في كتابة المقالات؟',
        content: 'السلام عليكم، أريد أن أعرف كيف يمكنني الاستفادة من مميزات الذكاء الاصطناعي في سبق لتحسين جودة المقالات؟',
        category_id: categories.find(c => c.slug === 'help')?.id || categories[0].id,
        author_id: 'user2',
        views: 156
      },
      {
        title: 'اقتراح: إضافة ميزة الترجمة التلقائية',
        content: 'أقترح إضافة زر للترجمة التلقائية للمقالات من وإلى اللغة الإنجليزية. هذا سيساعد في الوصول لجمهور أوسع.',
        category_id: categories.find(c => c.slug === 'requests')?.id || categories[0].id,
        author_id: 'user3',
        views: 89
      },
      {
        title: 'مشكلة في رفع الصور الكبيرة',
        content: 'عند محاولة رفع صورة بحجم أكبر من 5 ميجابايت، يظهر خطأ. هل هناك حل لهذه المشكلة؟',
        category_id: categories.find(c => c.slug === 'bugs')?.id || categories[0].id,
        author_id: 'user2',
        views: 45
      }
    ];

    // إضافة المواضيع
    for (const topic of topics) {
      const topicId = crypto.randomUUID();
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO forum_topics (id, title, content, category_id, author_id, is_pinned, views)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, topicId, topic.title, topic.content, topic.category_id, topic.author_id, topic.is_pinned || false, topic.views);
      
      console.log(`✅ تم إضافة الموضوع: ${topic.title}`);

      // إضافة بعض الردود التجريبية
      if (Math.random() > 0.5) {
        const replyId = crypto.randomUUID();
        const replyAuthors = testUsers.filter(u => u.id !== topic.author_id);
        const randomAuthor = replyAuthors[Math.floor(Math.random() * replyAuthors.length)];
        
        await prisma.$executeRawUnsafe(`
          INSERT INTO forum_replies (id, topic_id, author_id, content)
          VALUES (?, ?, ?, ?)
        `, replyId, topicId, randomAuthor.id, 'شكراً لك على هذا الموضوع المفيد. أتفق معك تماماً!');
        
        // تحديث آخر رد
        await prisma.$executeRawUnsafe(`
          UPDATE forum_topics 
          SET last_reply_at = NOW(), last_reply_by = ?
          WHERE id = ?
        `, randomAuthor.id, topicId);
      }
    }

    console.log('\n🎉 تم إضافة البيانات التجريبية بنجاح!');
    console.log('🔗 زر المنتدى الآن: http://localhost:3000/forum');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
addSampleForumData(); 