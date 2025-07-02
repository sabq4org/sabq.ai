const fs = require('fs');
const path = require('path');

// مسارات الملفات
const articlesPath = path.join(__dirname, '../data/articles.json');
const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = path.join(backupDir, `articles_backup_${timestamp}.json`);

async function clearAllArticles() {
  try {
    console.log('🔄 بدء عملية تنظيف جميع المقالات...');

    // التأكد من وجود مجلد النسخ الاحتياطية
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 تم إنشاء مجلد النسخ الاحتياطية');
    }

    // قراءة المقالات الحالية
    let articles = [];
    if (fs.existsSync(articlesPath)) {
      const articlesData = fs.readFileSync(articlesPath, 'utf8');
      articles = JSON.parse(articlesData);
      console.log(`📊 تم العثور على ${articles.length} مقال`);

      // إنشاء نسخة احتياطية
      fs.writeFileSync(backupPath, JSON.stringify(articles, null, 2), 'utf8');
      console.log(`💾 تم حفظ نسخة احتياطية في: ${backupPath}`);
    } else {
      console.log('⚠️ ملف المقالات غير موجود');
    }

    // إنشاء ملف مقالات فارغ
    const emptyArticles = [];
    fs.writeFileSync(articlesPath, JSON.stringify(emptyArticles, null, 2), 'utf8');
    
    console.log('✅ تم حذف جميع المقالات بنجاح!');
    console.log(`📈 المقالات المحذوفة: ${articles.length}`);
    console.log('🎯 الآن يمكنك إضافة أخبار حقيقية جديدة');
    
    // عرض إحصائيات سريعة
    if (articles.length > 0) {
      const categories = [...new Set(articles.map(a => a.category))];
      const authors = [...new Set(articles.map(a => a.author))];
      
      console.log('\n📋 إحصائيات المقالات المحذوفة:');
      console.log(`   - التصنيفات: ${categories.length} (${categories.join(', ')})`);
      console.log(`   - الكتاب: ${authors.length}`);
      console.log(`   - المقالات المميزة: ${articles.filter(a => a.featured).length}`);
      console.log(`   - المقالات العاجلة: ${articles.filter(a => a.breaking).length}`);
    }

    console.log('\n🚀 النظام جاهز لإضافة محتوى جديد!');
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف المقالات:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
clearAllArticles(); 