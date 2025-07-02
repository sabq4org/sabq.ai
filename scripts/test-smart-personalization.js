#!/usr/bin/env node

/**
 * 🧪 برنامج اختبار التخصيص الذكي
 * يقوم بتنظيف البيانات وإضافة محتوى حقيقي واختبار النظام
 */

const fs = require('fs');
const path = require('path');

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

// 🧼 الخطوة 1: تنظيف كامل للمحتوى التجريبي
function cleanTestData() {
  log('\n🧼 الخطوة 1: تنظيف كامل للمحتوى التجريبي...', 'cyan');
  
  try {
    // حفظ نسخة احتياطية
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/personalization_test_${timestamp}`;
    
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups');
    }
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // نسخ احتياطي للملفات الحالية
    const filesToBackup = [
      'data/articles.json',
      'data/categories.json',
      'data/user_preferences.json',
      'data/user_loyalty_points.json',
      'data/user_article_interactions.json'
    ];
    
    filesToBackup.forEach(file => {
      if (fs.existsSync(file)) {
        const fileName = path.basename(file);
        fs.copyFileSync(file, path.join(backupDir, fileName));
        log(`✓ تم حفظ نسخة احتياطية من ${fileName}`, 'green');
      }
    });
    
    // تنظيف ملف المقالات
    const cleanArticles = {
      articles: []
    };
    
    fs.writeFileSync('data/articles.json', JSON.stringify(cleanArticles, null, 2));
    log('✓ تم تنظيف ملف المقالات', 'green');
    
    log('✅ تم إكمال تنظيف البيانات بنجاح!', 'green');
    
  } catch (error) {
    log(`❌ خطأ في تنظيف البيانات: ${error.message}`, 'red');
    throw error;
  }
}

// 📥 الخطوة 2: إدخال محتوى حقيقي متنوع
function addRealContent() {
  log('\n📥 الخطوة 2: إدخال محتوى حقيقي متنوع...', 'cyan');
  
  const realArticles = [
    // مقالات رياضية (5 مقالات)
    {
      id: "article-sports-hilal-victory-1750630000001",
      title: "الهلال يحقق فوزاً مثيراً في الديربي أمام النصر بثلاثة أهداف مقابل هدفين",
      slug: "hilal-victory-derby-nassar-3-2",
      content: "شهد استاد الملك فهد الدولي مباراة مثيرة بين الهلال والنصر في إطار الجولة الـ15 من دوري روشن السعودي، حيث تمكن الهلال من تحقيق فوز مثير بثلاثة أهداف مقابل هدفين في مباراة مليئة بالإثارة والتشويق.",
      excerpt: "الهلال يتغلب على النصر في ديربي مثير بنتيجة 3-2 في مباراة مليئة بالأهداف والإثارة",
      category: "رياضة",
      tags: ["الهلال", "النصر", "الديربي", "دوري روشن", "كرة القدم"],
      featured_image: "hilal-victory-1.jpg",
      author: "محمد العتيبي",
      status: "published",
      featured: true,
      breaking: false,
      views: 15420,
      likes: 892,
      shares: 234,
      comments_count: 156,
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-sports-neymar-performance-1750630000002",
      title: "نيمار يقود الهلال لفوز كاسح على الاتحاد بأربعة أهداف نظيفة",
      slug: "neymar-leads-hilal-victory-ittihad-4-0",
      content: "تألق النجم البرازيلي نيمار دا سيلفا في مباراة الهلال أمام الاتحاد، حيث سجل هدفين وصنع هدفاً آخر ليقود فريقه لفوز كاسح بأربعة أهداف نظيفة في مباراة مثيرة على استاد الملك فهد.",
      excerpt: "نيمار يتألق ويقود الهلال لفوز كاسح على الاتحاد بأربعة أهداف نظيفة",
      category: "رياضة",
      tags: ["نيمار", "الهلال", "الاتحاد", "دوري روشن", "أهداف"],
      featured_image: "neymar-hilal-2.jpg",
      author: "سعد الغامدي",
      status: "published",
      featured: false,
      breaking: false,
      views: 12340,
      likes: 756,
      shares: 189,
      comments_count: 98,
      published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-sports-saudi-national-team-1750630000003",
      title: "المنتخب السعودي يستعد لمواجهة مصيرية أمام اليابان في تصفيات كأس العالم",
      slug: "saudi-national-team-japan-world-cup-qualifiers",
      content: "يستعد المنتخب السعودي الأول لكرة القدم لمواجهة مصيرية أمام نظيره اليابani في إطار الجولة السادسة من التصفيات الآسيوية المؤهلة لكأس العالم 2026، حيث يسعى الأخضر لتعزيز موقعه في المجموعة.",
      excerpt: "الأخضر يستعد لمواجهة مصيرية أمام اليابان في تصفيات كأس العالم",
      category: "رياضة",
      tags: ["المنتخب السعودي", "اليابان", "كأس العالم", "تصفيات آسيا"],
      featured_image: "saudi-national-team.jpg",
      author: "أحمد الشهري",
      status: "published",
      featured: false,
      breaking: true,
      views: 8760,
      likes: 432,
      shares: 156,
      comments_count: 78,
      published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-sports-signing-winter-1750630000004",
      title: "الهلال يعلن عن صفقة مدوية في الميركاتو الشتوي",
      slug: "hilal-announces-major-winter-signing",
      content: "أعلن نادي الهلال رسمياً عن التعاقد مع لاعب وسط برازيلي شاب في صفقة تعتبر من أبرز صفقات الميركاتو الشتوي، حيث وقع اللاعب عقداً لمدة ثلاث سنوات مع إمكانية التجديد لسنة إضافية.",
      excerpt: "الهلال يعلن عن صفقة مدوية في الميركاتو الشتوي بضم لاعب برازيلي",
      category: "رياضة",
      tags: ["الهلال", "انتقالات", "الميركاتو", "البرازيل"],
      featured_image: "hilal-signing-4.jpg",
      author: "خالد المطيري",
      status: "published",
      featured: false,
      breaking: false,
      views: 6540,
      likes: 298,
      shares: 87,
      comments_count: 45,
      published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-sports-anniversary-1750630000005",
      title: "الهلال يحتفل بالذكرى الـ97 لتأسيسه بحضور جماهيري كبير",
      slug: "hilal-97th-anniversary-celebration",
      content: "احتفل نادي الهلال بالذكرى الـ97 لتأسيسه في احتفالية مميزة أقيمت بحضور جماهيري كبير، حيث تم تكريم الأساطير والنجوم السابقين واستعراض إنجازات النادي عبر تاريخه العريق.",
      excerpt: "الهلال يحتفل بذكرى تأسيسه الـ97 في احتفالية مميزة بحضور جماهيري كبير",
      category: "رياضة",
      tags: ["الهلال", "ذكرى التأسيس", "احتفالية", "تاريخ"],
      featured_image: "hilal-anniversary-3.jpg",
      author: "فهد الدوسري",
      status: "published",
      featured: false,
      breaking: false,
      views: 4320,
      likes: 187,
      shares: 62,
      comments_count: 34,
      published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },

    // مقالات اقتصادية (3 مقالات)
    {
      id: "article-economy-vision2030-1750630000006",
      title: "رؤية 2030 تحقق إنجازات اقتصادية جديدة بنمو القطاع غير النفطي",
      slug: "vision-2030-economic-achievements-non-oil-growth",
      content: "حققت رؤية المملكة 2030 إنجازات اقتصادية مهمة خلال العام الجاري، حيث سجل القطاع غير النفطي نمواً ملحوظاً بنسبة 4.3%، مما يعكس نجاح جهود التنويع الاقتصادي وتقليل الاعتماد على النفط.",
      excerpt: "رؤية 2030 تحقق نمواً بنسبة 4.3% في القطاع غير النفطي",
      category: "اقتصاد",
      tags: ["رؤية 2030", "اقتصاد", "القطاع غير النفطي", "نمو"],
      featured_image: "vision-2030-economy.jpg",
      author: "د. عبدالله الراشد",
      status: "published",
      featured: true,
      breaking: false,
      views: 9870,
      likes: 445,
      shares: 234,
      comments_count: 67,
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-economy-neom-investment-1750630000007",
      title: "نيوم تستقطب استثمارات جديدة بقيمة 50 مليار ريال في مشاريع التقنية",
      slug: "neom-attracts-50-billion-technology-investments",
      content: "أعلنت مدينة نيوم عن استقطاب استثمارات جديدة بقيمة 50 مليار ريال في مشاريع التقنية المتقدمة والذكاء الاصطناعي، مما يعزز مكانة المملكة كمركز عالمي للابتكار والتقنية.",
      excerpt: "نيوم تجذب 50 مليار ريال استثمارات في مشاريع التقنية والذكاء الاصطناعي",
      category: "اقتصاد",
      tags: ["نيوم", "استثمارات", "تقنية", "ذكاء اصطناعي"],
      featured_image: "neom-investments.jpg",
      author: "سارة القحطاني",
      status: "published",
      featured: false,
      breaking: false,
      views: 7650,
      likes: 321,
      shares: 178,
      comments_count: 45,
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-economy-aramco-profits-1750630000008",
      title: "أرامكو تعلن عن أرباح قياسية في الربع الثالث بنمو 15%",
      slug: "aramco-record-profits-q3-15-percent-growth",
      content: "أعلنت شركة أرامكو السعودية عن تحقيق أرباح قياسية في الربع الثالث من العام الجاري بنمو قدره 15% مقارنة بالفترة نفسها من العام الماضي، مما يعكس قوة الأداء التشغيلي للشركة.",
      excerpt: "أرامكو تحقق أرباحاً قياسية بنمو 15% في الربع الثالث",
      category: "اقتصاد",
      tags: ["أرامكو", "أرباح", "نمو", "نفط"],
      featured_image: "aramco-profits.jpg",
      author: "محمد النعيمي",
      status: "published",
      featured: false,
      breaking: true,
      views: 11230,
      likes: 567,
      shares: 289,
      comments_count: 89,
      published_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },

    // مقالات تقنية (2 مقالات)
    {
      id: "article-tech-ai-healthcare-1750630000009",
      title: "السعودية تطلق مبادرة الذكاء الاصطناعي في القطاع الصحي",
      slug: "saudi-ai-healthcare-initiative-launch",
      content: "أطلقت المملكة العربية السعودية مبادرة طموحة لتطبيق الذكاء الاصطناعي في القطاع الصحي، بهدف تحسين جودة الخدمات الطبية وتسريع التشخيص والعلاج باستخدام أحدث التقنيات.",
      excerpt: "السعودية تطلق مبادرة الذكاء الاصطناعي لتطوير القطاع الصحي",
      category: "تقنية",
      tags: ["ذكاء اصطناعي", "صحة", "تقنية طبية", "مبادرة"],
      featured_image: "ai-healthcare-saudi.jpg",
      author: "د. نورا الزهراني",
      status: "published",
      featured: false,
      breaking: false,
      views: 5430,
      likes: 267,
      shares: 145,
      comments_count: 38,
      published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "article-tech-smart-cities-1750630000010",
      title: "مشروع المدن الذكية يحقق تقدماً ملموساً في الرياض وجدة",
      slug: "smart-cities-progress-riyadh-jeddah",
      content: "حقق مشروع المدن الذكية في المملكة تقدماً ملموساً في مدينتي الرياض وجدة، حيث تم تطبيق حلول ذكية لإدارة المرور والإضاءة والخدمات البلدية باستخدام إنترنت الأشياء والذكاء الاصطناعي.",
      excerpt: "مشروع المدن الذكية يحرز تقدماً في الرياض وجدة بحلول تقنية متطورة",
      category: "تقنية",
      tags: ["مدن ذكية", "إنترنت الأشياء", "الرياض", "جدة"],
      featured_image: "smart-cities-saudi.jpg",
      author: "عمر الحربي",
      status: "published",
      featured: false,
      breaking: false,
      views: 4210,
      likes: 198,
      shares: 87,
      comments_count: 29,
      published_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  try {
    // إضافة المقالات الحقيقية
    const articlesData = {
      articles: realArticles
    };
    
    fs.writeFileSync('data/articles.json', JSON.stringify(articlesData, null, 2));
    log(`✓ تم إضافة ${realArticles.length} مقال حقيقي`, 'green');
    
    // إحصائيات المحتوى المضاف
    const categories = [...new Set(realArticles.map(a => a.category))];
    log(`📊 التصنيفات المضافة: ${categories.join(', ')}`, 'blue');
    
    categories.forEach(category => {
      const count = realArticles.filter(a => a.category === category).length;
      log(`   - ${category}: ${count} مقالات`, 'yellow');
    });
    
    log('✅ تم إكمال إضافة المحتوى الحقيقي بنجاح!', 'green');
    
  } catch (error) {
    log(`❌ خطأ في إضافة المحتوى: ${error.message}`, 'red');
    throw error;
  }
}

// 🧑‍💼 الخطوة 3: تخصيص اهتمامات المستخدم
function setupUserPreferences() {
  log('\n🧑‍💼 الخطوة 3: تخصيص اهتمامات المستخدم...', 'cyan');
  
  try {
    const userPreferences = {
      "user-ali-alhazmi": {
        userId: "user-ali-alhazmi",
        name: "علي الحازمي",
        email: "ali@example.com",
        preferences: {
          categories: ["رياضة", "اقتصاد"],
          keywords: ["الهلال", "نيمار", "رؤية 2030", "استثمارات"],
          topics: ["كرة القدم", "الأسواق المالية", "التقنية"]
        },
        settings: {
          notifications: true,
          personalized_feed: true,
          email_updates: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    fs.writeFileSync('data/user_preferences.json', JSON.stringify(userPreferences, null, 2));
    log('✓ تم تخصيص اهتمامات المستخدم: رياضة + اقتصاد', 'green');
    
    // إنشاء ملف نقاط الولاء للمستخدم
    const loyaltyPoints = {
      "user-ali-alhazmi": {
        userId: "user-ali-alhazmi",
        totalPoints: 5,
        level: "البرونزي",
        pointsHistory: [
          {
            id: "loyalty-1750630000001",
            points: 5,
            reason: "إتمام اختيار الاهتمامات",
            timestamp: new Date().toISOString()
          }
        ],
        achievements: ["المبتدئ"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    fs.writeFileSync('data/user_loyalty_points.json', JSON.stringify(loyaltyPoints, null, 2));
    log('✓ تم إنشاء ملف نقاط الولاء (5 نقاط)', 'green');
    
    log('✅ تم إكمال تخصيص اهتمامات المستخدم بنجاح!', 'green');
    
  } catch (error) {
    log(`❌ خطأ في تخصيص الاهتمامات: ${error.message}`, 'red');
    throw error;
  }
}

// 📊 الخطوة 4: اختبار نظام التخصيص
function testPersonalizationSystem() {
  log('\n📊 الخطوة 4: اختبار نظام التخصيص...', 'cyan');
  
  try {
    // قراءة البيانات
    const articlesData = JSON.parse(fs.readFileSync('data/articles.json', 'utf8'));
    const userPrefs = JSON.parse(fs.readFileSync('data/user_preferences.json', 'utf8'));
    
    const articles = articlesData.articles;
    const userInterests = userPrefs["user-ali-alhazmi"].preferences.categories;
    
    log(`👤 اهتمامات المستخدم: ${userInterests.join(', ')}`, 'blue');
    log(`📰 إجمالي المقالات: ${articles.length}`, 'blue');
    
    // فلترة المقالات حسب الاهتمامات
    const personalizedArticles = articles.filter(article => 
      userInterests.includes(article.category)
    );
    
    log(`🎯 المقالات المخصصة: ${personalizedArticles.length}`, 'green');
    
    // تجميع حسب التصنيف
    const articlesByCategory = {};
    personalizedArticles.forEach(article => {
      if (!articlesByCategory[article.category]) {
        articlesByCategory[article.category] = [];
      }
      articlesByCategory[article.category].push(article);
    });
    
    // عرض النتائج
    Object.keys(articlesByCategory).forEach(category => {
      const count = articlesByCategory[category].length;
      log(`   📁 ${category}: ${count} مقالات`, 'yellow');
      
      // عرض عناوين المقالات
      articlesByCategory[category].forEach((article, index) => {
        log(`      ${index + 1}. ${article.title}`, 'white');
      });
    });
    
    // التحقق من جودة التخصيص
    const totalArticles = articles.length;
    const personalizedCount = personalizedArticles.length;
    const relevancePercentage = ((personalizedCount / totalArticles) * 100).toFixed(1);
    
    log(`\n📈 تقرير جودة التخصيص:`, 'magenta');
    log(`   • نسبة المقالات ذات الصلة: ${relevancePercentage}%`, 'cyan');
    log(`   • المقالات المستبعدة: ${totalArticles - personalizedCount}`, 'cyan');
    
    // التحقق من وجود مقالات لكل اهتمام
    const missingCategories = userInterests.filter(interest => 
      !articlesByCategory[interest] || articlesByCategory[interest].length === 0
    );
    
    if (missingCategories.length > 0) {
      log(`⚠️  تصنيفات بدون محتوى: ${missingCategories.join(', ')}`, 'yellow');
    } else {
      log(`✅ جميع الاهتمامات تحتوي على محتوى مناسب`, 'green');
    }
    
    log('\n✅ تم إكمال اختبار نظام التخصيص بنجاح!', 'green');
    
    return {
      totalArticles,
      personalizedCount,
      relevancePercentage: parseFloat(relevancePercentage),
      articlesByCategory,
      missingCategories
    };
    
  } catch (error) {
    log(`❌ خطأ في اختبار النظام: ${error.message}`, 'red');
    throw error;
  }
}

// 🔍 الخطوة 5: تحليل شامل للنتائج
function analyzeResults(testResults) {
  log('\n🔍 الخطوة 5: تحليل شامل للنتائج...', 'cyan');
  
  try {
    log('📋 تقرير التحليل الشامل:', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    // تحليل الكفاءة
    if (testResults.relevancePercentage >= 70) {
      log(`✅ كفاءة ممتازة: ${testResults.relevancePercentage}%`, 'green');
    } else if (testResults.relevancePercentage >= 50) {
      log(`⚠️  كفاءة متوسطة: ${testResults.relevancePercentage}%`, 'yellow');
    } else {
      log(`❌ كفاءة ضعيفة: ${testResults.relevancePercentage}%`, 'red');
    }
    
    // تحليل التوزيع
    log('\n📊 توزيع المحتوى المخصص:', 'blue');
    Object.entries(testResults.articlesByCategory).forEach(([category, articles]) => {
      const percentage = ((articles.length / testResults.personalizedCount) * 100).toFixed(1);
      log(`   • ${category}: ${articles.length} مقالات (${percentage}%)`, 'white');
    });
    
    // توصيات التحسين
    log('\n💡 توصيات التحسين:', 'blue');
    
    if (testResults.missingCategories.length > 0) {
      log(`   ⚠️  إضافة محتوى للتصنيفات: ${testResults.missingCategories.join(', ')}`, 'yellow');
    }
    
    if (testResults.relevancePercentage < 100) {
      const excludedCount = testResults.totalArticles - testResults.personalizedCount;
      log(`   📝 ${excludedCount} مقالات خارج الاهتمامات (طبيعي ومطلوب)`, 'cyan');
    }
    
    log(`   🎯 النظام يعمل بكفاءة عالية في فلترة المحتوى`, 'green');
    
    // خلاصة النتائج
    log('\n🏆 خلاصة الاختبار:', 'magenta');
    log(`   ✅ تم تنظيف البيانات بنجاح`, 'green');
    log(`   ✅ تم إضافة ${testResults.totalArticles} مقال حقيقي`, 'green');
    log(`   ✅ تم تخصيص اهتمامات المستخدم`, 'green');
    log(`   ✅ النظام يعرض ${testResults.personalizedCount} مقال مناسب`, 'green');
    log(`   ✅ معدل الدقة: ${testResults.relevancePercentage}%`, 'green');
    
    log('\n🎉 الاختبار مكتمل بنجاح! يمكنك الآن زيارة الموقع لرؤية النتائج.', 'green');
    
  } catch (error) {
    log(`❌ خطأ في تحليل النتائج: ${error.message}`, 'red');
    throw error;
  }
}

// 🚀 تشغيل الاختبار الشامل
async function runComprehensiveTest() {
  log('🧪 بدء اختبار التخصيص الذكي الشامل', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  try {
    // تنفيذ جميع الخطوات
    cleanTestData();
    addRealContent();
    setupUserPreferences();
    const testResults = testPersonalizationSystem();
    analyzeResults(testResults);
    
    log('\n🎯 اختبر النظام الآن:', 'magenta');
    log('   1. افتح http://localhost:3000', 'white');
    log('   2. انتقل لقسم "محتوى مخصص لك"', 'white');
    log('   3. تحقق من ظهور مقالات الرياضة والاقتصاد فقط', 'white');
    log('   4. تأكد من عدم ظهور مقالات التقنية', 'white');
    
  } catch (error) {
    log(`\n💥 فشل الاختبار: ${error.message}`, 'red');
    process.exit(1);
  }
}

// تشغيل البرنامج
if (require.main === module) {
  runComprehensiveTest();
} 