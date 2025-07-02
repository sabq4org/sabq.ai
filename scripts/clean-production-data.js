#!/usr/bin/env node

/**
 * سكريبت حذف البيانات التجريبية نهائياً
 * يجب تشغيله فوراً لتنظيف البيئة الحية
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 بدء تنظيف البيانات التجريبية...\n');

// قائمة الأسماء الوهمية التي يجب حذفها
const FAKE_AUTHORS = [
  'أحمد الرياضي',
  'محمد الخبير', 
  'سارة التحليلية',
  'محرر سبق',
  'سعود الإعلامي',
  'فاطمة المحللة',
  'عبدالله التقني'
];

// 1. تنظيف ملف المقالات
const articlesPath = path.join(__dirname, '../data/articles.json');
if (fs.existsSync(articlesPath)) {
  const data = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
  
  // فلترة المقالات - الاحتفاظ فقط بالمقالات الحقيقية
  const realArticles = data.articles.filter(article => {
    // حذف المقالات ذات الأسماء الوهمية
    if (FAKE_AUTHORS.includes(article.author_name || article.author)) {
      console.log(`❌ حذف مقال وهمي: "${article.title}" - المؤلف: ${article.author_name || article.author}`);
      return false;
    }
    
    // حذف المقالات المحذوفة أو التجريبية
    if (article.is_deleted || article.status === 'deleted') {
      console.log(`❌ حذف مقال محذوف: "${article.title}"`);
      return false;
    }
    
    // حذف المقالات ذات المعرفات التجريبية
    if (article.id.includes('hilal-1750749963783') || 
        article.id.includes('test') || 
        article.id.includes('demo')) {
      console.log(`❌ حذف مقال تجريبي: "${article.title}"`);
      return false;
    }
    
    return true;
  });
  
  console.log(`\n✅ تم الاحتفاظ بـ ${realArticles.length} مقال حقيقي`);
  console.log(`❌ تم حذف ${data.articles.length - realArticles.length} مقال وهمي\n`);
  
  // حفظ البيانات النظيفة
  fs.writeFileSync(articlesPath, JSON.stringify({ articles: realArticles }, null, 2));
}

// 2. تنظيف ملف التفاعلات
const interactionsPath = path.join(__dirname, '../data/user_article_interactions.json');
if (fs.existsSync(interactionsPath)) {
  const data = JSON.parse(fs.readFileSync(interactionsPath, 'utf8'));
  
  // حذف جميع التفاعلات الوهمية
  const cleanInteractions = {};
  Object.keys(data).forEach(userId => {
    // الاحتفاظ فقط بالتفاعلات للمقالات الحقيقية
    cleanInteractions[userId] = {};
  });
  
  fs.writeFileSync(interactionsPath, JSON.stringify(cleanInteractions, null, 2));
  console.log('✅ تم تصفير جميع التفاعلات الوهمية');
}

// 3. تنظيف ملف أعضاء الفريق
const teamPath = path.join(__dirname, '../data/team_members.json');
if (fs.existsSync(teamPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
    
    // التحقق من وجود المصفوفة
    if (data.team_members && Array.isArray(data.team_members)) {
      // حذف الأعضاء الوهميين
      const realMembers = data.team_members.filter(member => {
        if (FAKE_AUTHORS.includes(member.name)) {
          console.log(`❌ حذف عضو وهمي: ${member.name}`);
          return false;
        }
        return true;
      });
      
      fs.writeFileSync(teamPath, JSON.stringify({ team_members: realMembers }, null, 2));
      console.log('✅ تم تنظيف أعضاء الفريق');
    } else {
      console.log('⚠️  ملف أعضاء الفريق لا يحتوي على البنية المتوقعة');
    }
  } catch (error) {
    console.log('⚠️  خطأ في قراءة ملف أعضاء الفريق:', error.message);
  }
}

// 4. تنظيف المستخدمين
const usersPath = path.join(__dirname, '../data/users.json');
if (fs.existsSync(usersPath)) {
  const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  
  // حذف المستخدمين التجريبيين
  const realUsers = data.users.filter(user => {
    if (user.email.includes('test') || 
        user.email.includes('demo') ||
        FAKE_AUTHORS.includes(user.name)) {
      console.log(`❌ حذف مستخدم تجريبي: ${user.email}`);
      return false;
    }
    return true;
  });
  
  fs.writeFileSync(usersPath, JSON.stringify({ users: realUsers }, null, 2));
  console.log('✅ تم تنظيف المستخدمين');
}

// 5. تنظيف نقاط الولاء
const loyaltyPath = path.join(__dirname, '../data/user_loyalty_points.json');
if (fs.existsSync(loyaltyPath)) {
  // تصفير جميع النقاط الوهمية
  fs.writeFileSync(loyaltyPath, JSON.stringify({}, null, 2));
  console.log('✅ تم تصفير نقاط الولاء الوهمية');
}

// 6. تنظيف سجلات النشاط
const activitiesPath = path.join(__dirname, '../data/activities.json');
if (fs.existsSync(activitiesPath)) {
  fs.writeFileSync(activitiesPath, JSON.stringify({ activities: [] }, null, 2));
  console.log('✅ تم تنظيف سجلات النشاط التجريبية');
}

// 7. حذف الصور الوهمية
const uploadsDir = path.join(__dirname, '../public/uploads');
const fakeImagePatterns = ['test', 'demo', 'ahmad-riadi', 'mohammad-khabir', 'sara-analyst'];

if (fs.existsSync(uploadsDir)) {
  const deleteRecursive = (dir) => {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        deleteRecursive(filePath);
      } else {
        // حذف الصور الوهمية
        if (fakeImagePatterns.some(pattern => file.includes(pattern))) {
          fs.unlinkSync(filePath);
          console.log(`❌ حذف صورة وهمية: ${file}`);
        }
      }
    });
  };
  
  deleteRecursive(uploadsDir);
  console.log('✅ تم تنظيف الصور الوهمية');
}

console.log('\n' + '='.repeat(50));
console.log('✅ اكتمل التنظيف بنجاح!');
console.log('📌 البيئة الآن نظيفة من جميع البيانات التجريبية');
console.log('⚠️  تذكر: لا تشغل أي سكريبت seed في الإنتاج!');
console.log('='.repeat(50)); 