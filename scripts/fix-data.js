const fs = require('fs').promises;
const path = require('path');

// ألوان للطباعة في Terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function fixData() {
  console.log(`${colors.blue}🔧 بدء إصلاح البيانات...${colors.reset}\n`);

  try {
    // 1. التحقق من وجود مجلد البيانات
    const dataDir = path.join(__dirname, '..', 'data');
    await fs.access(dataDir);
    console.log(`${colors.green}✓ مجلد البيانات موجود${colors.reset}`);

    // 2. التحقق من الملفات الأساسية
    const requiredFiles = [
      'users.json',
      'articles.json',
      'categories.json',
      'user_loyalty_points.json',
      'user_article_interactions.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(dataDir, file);
      try {
        await fs.access(filePath);
        console.log(`${colors.green}✓ ${file} موجود${colors.reset}`);
        
        // التحقق من صحة JSON
        const content = await fs.readFile(filePath, 'utf8');
        JSON.parse(content);
        console.log(`${colors.green}  ↳ البيانات صالحة${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}✗ ${file} مفقود أو تالف${colors.reset}`);
        
        // إنشاء الملف بالبيانات الافتراضية
        await createDefaultFile(filePath, file);
      }
    }

    // 3. تنظيف البيانات التجريبية
    console.log(`\n${colors.yellow}🧹 تنظيف البيانات التجريبية...${colors.reset}`);
    
    // تنظيف المقالات التجريبية
    const articlesPath = path.join(dataDir, 'articles.json');
    const articlesFile = JSON.parse(await fs.readFile(articlesPath, 'utf8'));
    const articlesData = articlesFile.articles || articlesFile;
    
    const cleanedArticles = articlesData.filter(article => {
      // إزالة المقالات التي تحتوي على "test" أو "lorem"
      const isTest = article.title.toLowerCase().includes('test') || 
                     (article.content && article.content.toLowerCase().includes('lorem ipsum'));
      if (isTest) {
        console.log(`${colors.yellow}  - حذف مقال تجريبي: ${article.title}${colors.reset}`);
      }
      return !isTest;
    });
    
    // حفظ البيانات بنفس التنسيق الأصلي
    const outputData = articlesFile.articles ? { articles: cleanedArticles } : cleanedArticles;
    await fs.writeFile(articlesPath, JSON.stringify(outputData, null, 2));
    console.log(`${colors.green}✓ تم تنظيف ${articlesData.length - cleanedArticles.length} مقال تجريبي${colors.reset}`);

    // 4. إصلاح العلاقات بين البيانات
    console.log(`\n${colors.blue}🔗 إصلاح العلاقات بين البيانات...${colors.reset}`);
    
    // التأكد من أن جميع التفاعلات تشير لمستخدمين موجودين
    const usersPath = path.join(dataDir, 'users.json');
    const interactionsPath = path.join(dataDir, 'user_article_interactions.json');
    
    const usersData = JSON.parse(await fs.readFile(usersPath, 'utf8'));
    const userIds = usersData.users.map(u => u.id);
    
    const interactionsData = JSON.parse(await fs.readFile(interactionsPath, 'utf8'));
    const validInteractions = {};
    
    for (const [userId, interactions] of Object.entries(interactionsData)) {
      if (userIds.includes(userId)) {
        validInteractions[userId] = interactions;
      } else {
        console.log(`${colors.yellow}  - حذف تفاعلات لمستخدم غير موجود: ${userId}${colors.reset}`);
      }
    }
    
    await fs.writeFile(interactionsPath, JSON.stringify(validInteractions, null, 2));
    
    // 5. إنشاء تقرير
    console.log(`\n${colors.blue}📊 تقرير الحالة:${colors.reset}`);
    console.log(`  - عدد المستخدمين: ${usersData.users.length}`);
    console.log(`  - عدد المقالات: ${cleanedArticles.length}`);
    console.log(`  - عدد المستخدمين النشطين: ${Object.keys(validInteractions).length}`);
    
    console.log(`\n${colors.green}✅ تم إصلاح البيانات بنجاح!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ خطأ في إصلاح البيانات:${colors.reset}`, error);
  }
}

async function createDefaultFile(filePath, fileName) {
  const defaults = {
    'users.json': { users: [] },
    'articles.json': [],
    'categories.json': [
      { id: 1, name: 'الأخبار المحلية', slug: 'local-news', color: '#3B82F6' },
      { id: 2, name: 'الرياضة', slug: 'sports', color: '#10B981' },
      { id: 3, name: 'الاقتصاد', slug: 'economy', color: '#F59E0B' },
      { id: 4, name: 'التقنية', slug: 'technology', color: '#8B5CF6' },
      { id: 5, name: 'الثقافة والفن', slug: 'culture', color: '#EC4899' },
      { id: 6, name: 'السياسة', slug: 'politics', color: '#EF4444' },
      { id: 7, name: 'الصحة', slug: 'health', color: '#06B6D4' }
    ],
    'user_loyalty_points.json': {},
    'user_article_interactions.json': {}
  };
  
  await fs.writeFile(filePath, JSON.stringify(defaults[fileName] || {}, null, 2));
  console.log(`${colors.green}  ↳ تم إنشاء ${fileName} بالبيانات الافتراضية${colors.reset}`);
}

// تشغيل السكريبت
fixData(); 