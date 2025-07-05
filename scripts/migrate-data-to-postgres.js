const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// إنشاء عميل Prisma للـ PostgreSQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://doadmin:[YOUR_PASSWORD]@db-sabq-ai-1755-do-user-23559731-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require'
    }
  }
});

async function migrateData() {
  try {
    console.log('🚀 بدء ترحيل البيانات إلى PostgreSQL...');
    
    // البحث عن أحدث نسخة احتياطية
    const backupsDir = path.join(__dirname, '../backups');
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.error('❌ لا توجد نسخ احتياطية!');
      return;
    }
    
    const latestBackup = files[0];
    console.log(`📂 استخدام النسخة الاحتياطية: ${latestBackup}`);
    
    const backupData = JSON.parse(
      fs.readFileSync(path.join(backupsDir, latestBackup), 'utf8')
    );
    
    // ترحيل المستخدمين
    if (backupData.users && backupData.users.length > 0) {
      console.log(`\n👥 ترحيل ${backupData.users.length} مستخدم...`);
      for (const user of backupData.users) {
        try {
          await prisma.user.create({
            data: {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              resetTokenExpiry: user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null
            }
          });
        } catch (error) {
          console.log(`  ⚠️ تخطي مستخدم ${user.email}: ${error.message}`);
        }
      }
    }
    
    // ترحيل التصنيفات
    if (backupData.categories && backupData.categories.length > 0) {
      console.log(`\n📁 ترحيل ${backupData.categories.length} تصنيف...`);
      for (const category of backupData.categories) {
        try {
          await prisma.category.create({
            data: {
              ...category,
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt)
            }
          });
        } catch (error) {
          console.log(`  ⚠️ تخطي تصنيف ${category.name}: ${error.message}`);
        }
      }
    }
    
    // ترحيل المقالات
    if (backupData.articles && backupData.articles.length > 0) {
      console.log(`\n📝 ترحيل ${backupData.articles.length} مقال...`);
      for (const article of backupData.articles) {
        try {
          await prisma.article.create({
            data: {
              ...article,
              createdAt: new Date(article.createdAt),
              updatedAt: new Date(article.updatedAt),
              publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
              scheduledFor: article.scheduledFor ? new Date(article.scheduledFor) : null
            }
          });
        } catch (error) {
          console.log(`  ⚠️ تخطي مقال ${article.title}: ${error.message}`);
        }
      }
    }
    
    // ترحيل الكلمات المفتاحية
    if (backupData.keywords && backupData.keywords.length > 0) {
      console.log(`\n🏷️ ترحيل ${backupData.keywords.length} كلمة مفتاحية...`);
      for (const keyword of backupData.keywords) {
        try {
          await prisma.keyword.create({
            data: {
              ...keyword,
              createdAt: new Date(keyword.createdAt)
            }
          });
        } catch (error) {
          console.log(`  ⚠️ تخطي كلمة ${keyword.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ اكتمل ترحيل البيانات بنجاح!');
    
    // عرض الإحصائيات
    const stats = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      articles: await prisma.article.count(),
      keywords: await prisma.keyword.count()
    };
    
    console.log('\n📊 إحصائيات قاعدة البيانات:');
    console.log(`  - المستخدمون: ${stats.users}`);
    console.log(`  - التصنيفات: ${stats.categories}`);
    console.log(`  - المقالات: ${stats.articles}`);
    console.log(`  - الكلمات المفتاحية: ${stats.keywords}`);
    
  } catch (error) {
    console.error('❌ خطأ في الترحيل:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData(); 