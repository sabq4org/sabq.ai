/**
 * سكريبت البيانات التجريبية لنظام سبق الذكي
 * Seed script for Sabq AI CMS
 * @version 2.1.0
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إدراج البيانات التجريبية...');

  // إنشاء مستخدمين تجريبيين
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sabq.org' },
    update: {},
    create: {
      email: 'admin@sabq.org',
      name: 'المدير العام',
      hashed_password: await hash('admin123', 10),
      role: 'admin',
      is_verified: true,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          browser: true,
          mobile: true
        }
      }
    }
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@sabq.org' },
    update: {},
    create: {
      email: 'editor@sabq.org',
      name: 'محرر الأخبار',
      hashed_password: await hash('editor123', 10),
      role: 'editor',
      is_verified: true,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          browser: false,
          mobile: true
        }
      }
    }
  });

  const writerUser = await prisma.user.upsert({
    where: { email: 'writer@sabq.org' },
    update: {},
    create: {
      email: 'writer@sabq.org',
      name: 'كاتب المقالات',
      hashed_password: await hash('writer123', 10),
      role: 'writer',
      is_verified: true,
      preferences: {
        language: 'ar',
        timezone: 'Asia/Riyadh',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        }
      }
    }
  });

  console.log('✅ تم إنشاء المستخدمين التجريبيين');

  // إنشاء تصنيفات المقالات
  const categories = [
    { name: 'محليات', slug: 'local', description: 'أخبار المناطق والمدن السعودية' },
    { name: 'العالم', slug: 'world', description: 'أخبار العالم والتحليلات الدولية' },
    { name: 'حياتنا', slug: 'life', description: 'نمط الحياة والصحة والأسرة' },
    { name: 'محطات', slug: 'stations', description: 'تقارير خاصة وملفات متنوعة' },
    { name: 'رياضة', slug: 'sports', description: 'أخبار رياضية محلية وعالمية' },
    { name: 'سياحة', slug: 'tourism', description: 'تقارير سياحية ومواقع مميزة' },
    { name: 'أعمال', slug: 'business', description: 'أخبار الأعمال والشركات وريادة الأعمال' },
    { name: 'تقنية', slug: 'technology', description: 'أخبار وتطورات التقنية والذكاء الاصطناعي' },
    { name: 'سيارات', slug: 'cars', description: 'أخبار وتقارير السيارات' },
    { name: 'ميديا', slug: 'media', description: 'فيديوهات وصور وإعلام رقمي' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
  }

  console.log('✅ تم إنشاء التصنيفات');

  // إنشاء مقالات تجريبية
  const sampleArticles = [
    {
      title: 'المملكة تطلق رؤية 2030 الجديدة للذكاء الاصطناعي',
      slug: 'saudi-ai-vision-2030',
      summary: 'تعلن المملكة عن استراتيجية جديدة لتطوير الذكاء الاصطناعي كجزء من رؤية 2030',
      content: `
        <h2>رؤية طموحة للمستقبل</h2>
        <p>أعلنت المملكة العربية السعودية عن استراتيجية شاملة لتطوير الذكاء الاصطناعي...</p>
        <h3>المحاور الرئيسية</h3>
        <ul>
          <li>التعليم والبحث العلمي</li>
          <li>الصحة والطب</li>
          <li>النقل والمواصلات</li>
          <li>الطاقة والبيئة</li>
        </ul>
        <p>تهدف هذه الاستراتيجية إلى جعل المملكة مركزاً عالمياً للذكاء الاصطناعي...</p>
      `,
      category: 'technology',
      status: 'published',
      featured: true,
      authorId: adminUser.id
    },
    {
      title: 'نيوم تكشف عن أحدث مشاريع المدينة الذكية',
      slug: 'neom-smart-city-projects',
      summary: 'مشاريع جديدة في نيوم تعيد تعريف مفهوم المدن الذكية',
      content: `
        <h2>مشاريع ثورية في نيوم</h2>
        <p>كشفت مدينة نيوم عن مجموعة من المشاريع الثورية...</p>
        <h3>المشاريع الجديدة</h3>
        <ul>
          <li>مركز الأبحاث التقنية</li>
          <li>منطقة الذكاء الاصطناعي</li>
          <li>مختبرات الطاقة المتجددة</li>
        </ul>
      `,
      category: 'local',
      status: 'published',
      featured: true,
      authorId: editorUser.id
    },
    {
      title: 'تطورات جديدة في عالم الطب الرقمي',
      slug: 'digital-medicine-developments',
      summary: 'أحدث التطورات في مجال الطب الرقمي والتطبيقات الصحية',
      content: `
        <h2>ثورة في الرعاية الصحية</h2>
        <p>يشهد عالم الطب تطورات مذهلة في مجال التقنيات الرقمية...</p>
        <h3>التطبيقات الحديثة</h3>
        <ul>
          <li>التشخيص بالذكاء الاصطناعي</li>
          <li>الجراحة الروبوتية</li>
          <li>الطب الدقيق</li>
        </ul>
      `,
      category: 'life',
      status: 'published',
      featured: false,
      authorId: writerUser.id
    },
    {
      title: 'بطولة كأس العالم للسعودية 2034',
      slug: 'saudi-world-cup-2034',
      summary: 'المملكة تستعد لاستضافة كأس العالم 2034 بخطط طموحة',
      content: `
        <h2>حلم يصبح حقيقة</h2>
        <p>تستعد المملكة العربية السعودية لاستضافة كأس العالم 2034...</p>
        <h3>الاستعدادات</h3>
        <ul>
          <li>بناء ملاعب عالمية</li>
          <li>تطوير البنية التحتية</li>
          <li>برامج الضيافة</li>
        </ul>
      `,
      category: 'sports',
      status: 'published',
      featured: true,
      authorId: adminUser.id
    },
    {
      title: 'أسواق الأسهم السعودية تحقق أرقام قياسية',
      slug: 'saudi-stock-market-records',
      summary: 'السوق السعودي يحقق مستويات تاريخية جديدة',
      content: `
        <h2>نمو مستمر في الأسواق</h2>
        <p>حققت الأسواق السعودية أرقاماً قياسية جديدة...</p>
        <h3>أبرز القطاعات</h3>
        <ul>
          <li>قطاع التقنية</li>
          <li>قطاع الطاقة</li>
          <li>قطاع البنوك</li>
        </ul>
      `,
      category: 'business',
      status: 'published',
      featured: false,
      authorId: editorUser.id
    }
  ];

  for (const article of sampleArticles) {
    const category = await prisma.category.findUnique({
      where: { slug: article.category }
    });

    if (category) {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {},
        create: {
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          category_id: category.id,
          author_id: article.authorId,
          status: article.status,
          featured: article.featured,
          published_at: article.status === 'published' ? new Date() : null,
          seo_data: {
            title: article.title,
            description: article.summary,
            keywords: ['أخبار', 'المملكة', 'تقنية', 'رؤية2030']
          }
        }
      });
    }
  }

  console.log('✅ تم إنشاء المقالات التجريبية');

  // إنشاء بيانات تحليلية تجريبية
  const articles = await prisma.article.findMany();
  
  for (const article of articles) {
    // إنشاء أحداث تحليلية متنوعة
    const events = [
      'article_view', 'article_like', 'article_share', 
      'comment_add', 'bookmark_add', 'read_time'
    ];

    for (let i = 0; i < 20; i++) {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      await prisma.analyticsEvent.create({
        data: {
          event_type: randomEvent,
          article_id: article.id,
          user_id: Math.random() > 0.5 ? adminUser.id : null,
          event_data: {
            timestamp: randomDate.toISOString(),
            source: 'web',
            device: Math.random() > 0.5 ? 'desktop' : 'mobile',
            location: 'Saudi Arabia',
            duration: randomEvent === 'read_time' ? Math.floor(Math.random() * 300) : null
          },
          created_at: randomDate
        }
      });
    }
  }

  console.log('✅ تم إنشاء البيانات التحليلية');

  // إنشاء بيانات تكامل تجريبية
  const integrations = [
    {
      name: 'Google Analytics',
      type: 'analytics',
      config: {
        trackingId: 'GA-XXXXXXXXX',
        enabled: true,
        events: ['page_view', 'article_view', 'user_signup']
      },
      isActive: true
    },
    {
      name: 'Facebook Pixel',
      type: 'marketing',
      config: {
        pixelId: 'XXXXXXXXX',
        enabled: true,
        events: ['page_view', 'article_view', 'conversion']
      },
      isActive: true
    },
    {
      name: 'Twitter API',
      type: 'social',
      config: {
        apiKey: 'XXXXXXXXX',
        enabled: false,
        autoShare: true
      },
      isActive: false
    }
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { name: integration.name },
      update: {},
      create: integration
    });
  }

  console.log('✅ تم إنشاء التكاملات التجريبية');

  console.log('🎉 تم إكمال إدراج البيانات التجريبية بنجاح!');
  console.log('\n📊 ملخص البيانات المدرجة:');
  console.log(`👥 المستخدمون: ${await prisma.user.count()}`);
  console.log(`📂 التصنيفات: ${await prisma.category.count()}`);
  console.log(`📝 المقالات: ${await prisma.article.count()}`);
  console.log(`📈 الأحداث التحليلية: ${await prisma.analyticsEvent.count()}`);
  console.log(`🔗 التكاملات: ${await prisma.integration.count()}`);
  
  console.log('\n🔐 بيانات الدخول التجريبية:');
  console.log('المدير العام: admin@sabq.org / admin123');
  console.log('محرر الأخبار: editor@sabq.org / editor123');
  console.log('كاتب المقالات: writer@sabq.org / writer123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطأ في إدراج البيانات:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 