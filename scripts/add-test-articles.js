const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function addTestArticles() {
  try {
    console.log('🚀 بدء إضافة المقالات التجريبية...\n');

    // جلب التصنيفات والمستخدمين
    const categories = await prisma.category.findMany({ where: { isActive: true } });
    const users = await prisma.user.findMany();
    
    if (categories.length === 0) {
      console.error('❌ لا توجد تصنيفات في قاعدة البيانات');
      return;
    }
    
    if (users.length === 0) {
      console.error('❌ لا يوجد مستخدمون في قاعدة البيانات');
      return;
    }

    // مقالات تجريبية لكل تصنيف
    const testArticles = {
      'local': [
        {
          title: 'افتتاح أكبر مركز تجاري في المنطقة الشرقية',
          excerpt: 'تم افتتاح مركز تجاري ضخم يضم أكثر من 500 متجر ومرافق ترفيهية متنوعة',
          content: 'محتوى المقال الكامل هنا...'
        },
        {
          title: 'مشروع جديد لتطوير الواجهة البحرية في جدة',
          excerpt: 'تفاصيل مشروع تطوير الواجهة البحرية الذي سيغير معالم المدينة',
          content: 'محتوى المقال الكامل هنا...'
        }
      ],
      'politics': [
        {
          title: 'القمة العربية تناقش التحديات الإقليمية',
          excerpt: 'انطلاق أعمال القمة العربية بمشاركة جميع الدول الأعضاء',
          content: 'محتوى المقال الكامل هنا...'
        }
      ],
      'economy': [
        {
          title: 'ارتفاع مؤشرات البورصة السعودية',
          excerpt: 'سجلت البورصة السعودية مكاسب قوية خلال جلسة التداول اليوم',
          content: 'محتوى المقال الكامل هنا...'
        },
        {
          title: 'توقعات إيجابية لنمو الاقتصاد الوطني',
          excerpt: 'خبراء اقتصاديون يتوقعون نمواً قوياً للاقتصاد خلال العام المقبل',
          content: 'محتوى المقال الكامل هنا...'
        }
      ],
      'sports': [
        {
          title: 'المنتخب السعودي يحقق فوزاً مستحقاً',
          excerpt: 'فوز مستحق للمنتخب السعودي في المباراة الودية الدولية',
          content: 'محتوى المقال الكامل هنا...'
        },
        {
          title: 'انطلاق بطولة كأس الملك لكرة القدم',
          excerpt: 'تنطلق غداً منافسات بطولة كأس الملك بمشاركة جميع أندية المملكة',
          content: 'محتوى المقال الكامل هنا...'
        }
      ],
      'technology': [
        {
          title: 'إطلاق أول مدينة ذكية متكاملة في المملكة',
          excerpt: 'مشروع طموح لبناء مدينة ذكية تعتمد على أحدث التقنيات',
          content: 'محتوى المقال الكامل هنا...'
        }
      ],
      'culture': [
        {
          title: 'مهرجان الجنادرية يعود بحلة جديدة',
          excerpt: 'عودة مهرجان الجنادرية الثقافي بفعاليات متنوعة تحتفي بالتراث السعودي',
          content: 'محتوى المقال الكامل هنا...'
        }
      ]
    };

    let addedCount = 0;
    const author = users[0]; // استخدام أول مستخدم ككاتب

    for (const category of categories) {
      const articlesForCategory = testArticles[category.slug] || [];
      
      if (articlesForCategory.length === 0) {
        // إضافة مقال افتراضي للتصنيفات التي ليس لها مقالات محددة
        articlesForCategory.push({
          title: `مقال تجريبي في ${category.name}`,
          excerpt: `هذا مقال تجريبي لتصنيف ${category.name}`,
          content: 'محتوى المقال التجريبي...'
        });
      }

      for (const articleData of articlesForCategory) {
        try {
          const article = await prisma.article.create({
            data: {
              title: articleData.title,
              slug: articleData.title.toLowerCase().replace(/\s+/g, '-'),
              content: articleData.content,
              excerpt: articleData.excerpt,
              authorId: author.id,
              categoryId: category.id,
              status: 'published',
              publishedAt: new Date(),
              views: Math.floor(Math.random() * 1000),
              readingTime: Math.floor(Math.random() * 10) + 3,
              seoKeywords: category.name,
              allowComments: true
            }
          });
          
          console.log(`✅ تم إضافة: "${article.title}" في تصنيف ${category.name}`);
          addedCount++;
        } catch (error) {
          console.error(`❌ خطأ في إضافة مقال لتصنيف ${category.name}:`, error.message);
        }
      }
    }

    console.log(`\n✨ تم إضافة ${addedCount} مقال بنجاح!`);

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestArticles(); 