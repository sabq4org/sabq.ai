#!/usr/bin/env node

/**
 * 📦 سكريبت أخذ نسخة احتياطية قبل تنظيف قاعدة البيانات
 * 
 * يقوم بحفظ جميع البيانات الحالية في ملفات JSON
 * لاستخدامها في حالة الحاجة لاستعادة أي بيانات
 */

const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// دالة لطباعة رسالة ملونة
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // سماوي
    success: '\x1b[32m', // أخضر
    warning: '\x1b[33m', // أصفر
    error: '\x1b[31m',   // أحمر
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

async function backupDatabase() {
  try {
    log('\n📦 بدء عملية النسخ الاحتياطي...', 'info');
    
    // إنشاء مجلد النسخ الاحتياطية
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join('backups', `full-backup-${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });
    
    log(`📁 تم إنشاء مجلد النسخ الاحتياطي: ${backupDir}`, 'success');
    
    // 1. نسخ المقالات
    log('\n📄 نسخ المقالات...', 'info');
    const articles = await prisma.articles.findMany({
      include: {
        category: true,
        author: true
      }
    });
    await fs.writeFile(
      path.join(backupDir, 'articles.json'),
      JSON.stringify(articles, null, 2)
    );
    log(`✅ تم نسخ ${articles.length} مقال`, 'success');
    
    // 2. نسخ التصنيفات
    log('\n🏷️ نسخ التصنيفات...', 'info');
    const categories = await prisma.categories.findMany();
    await fs.writeFile(
      path.join(backupDir, 'categories.json'),
      JSON.stringify(categories, null, 2)
    );
    log(`✅ تم نسخ ${categories.length} تصنيف`, 'success');
    
    // 3. نسخ المستخدمين
    log('\n👥 نسخ المستخدمين...', 'info');
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar_url: true,
        created_at: true,
        email_verified: true
      }
    });
    await fs.writeFile(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    log(`✅ تم نسخ ${users.length} مستخدم`, 'success');
    
    // 4. نسخ المؤلفين
    log('\n✍️ نسخ المؤلفين...', 'info');
    const authors = await prisma.authors.findMany();
    await fs.writeFile(
      path.join(backupDir, 'authors.json'),
      JSON.stringify(authors, null, 2)
    );
    log(`✅ تم نسخ ${authors.length} مؤلف`, 'success');
    
    // 5. نسخ كتاب الرأي
    const opinionAuthors = await prisma.opinion_authors.findMany();
    await fs.writeFile(
      path.join(backupDir, 'opinion_authors.json'),
      JSON.stringify(opinionAuthors, null, 2)
    );
    log(`✅ تم نسخ ${opinionAuthors.length} كاتب رأي`, 'success');
    
    // 6. نسخ التعليقات
    log('\n💬 نسخ التعليقات...', 'info');
    const comments = await prisma.comments.findMany();
    await fs.writeFile(
      path.join(backupDir, 'comments.json'),
      JSON.stringify(comments, null, 2)
    );
    log(`✅ تم نسخ ${comments.length} تعليق`, 'success');
    
    // 7. نسخ التفاعلات
    log('\n👍 نسخ التفاعلات...', 'info');
    const likes = await prisma.article_likes.findMany();
    await fs.writeFile(
      path.join(backupDir, 'likes.json'),
      JSON.stringify(likes, null, 2)
    );
    log(`✅ تم نسخ ${likes.length} إعجاب`, 'success');
    
    const saves = await prisma.article_saves.findMany();
    await fs.writeFile(
      path.join(backupDir, 'saves.json'),
      JSON.stringify(saves, null, 2)
    );
    log(`✅ تم نسخ ${saves.length} حفظ`, 'success');
    
    // 8. نسخ الجرعات اليومية
    log('\n📅 نسخ الجرعات اليومية...', 'info');
    const dailyDoses = await prisma.daily_doses.findMany({
      include: {
        contents: true
      }
    });
    await fs.writeFile(
      path.join(backupDir, 'daily_doses.json'),
      JSON.stringify(dailyDoses, null, 2)
    );
    log(`✅ تم نسخ ${dailyDoses.length} جرعة يومية`, 'success');
    
    // 9. نسخ التحليلات العميقة
    log('\n🔍 نسخ التحليلات العميقة...', 'info');
    const deepAnalyses = await prisma.deep_analyses.findMany();
    await fs.writeFile(
      path.join(backupDir, 'deep_analyses.json'),
      JSON.stringify(deepAnalyses, null, 2)
    );
    log(`✅ تم نسخ ${deepAnalyses.length} تحليل عميق`, 'success');
    
    // 10. نسخ البلوكات الذكية
    const smartBlocks = await prisma.smart_blocks.findMany();
    await fs.writeFile(
      path.join(backupDir, 'smart_blocks.json'),
      JSON.stringify(smartBlocks, null, 2)
    );
    log(`✅ تم نسخ ${smartBlocks.length} بلوك ذكي`, 'success');
    
    // 11. نسخ نقاط الولاء
    const loyaltyPoints = await prisma.user_loyalty_points.findMany();
    await fs.writeFile(
      path.join(backupDir, 'loyalty_points.json'),
      JSON.stringify(loyaltyPoints, null, 2)
    );
    log(`✅ تم نسخ ${loyaltyPoints.length} سجل نقاط ولاء`, 'success');
    
    // إنشاء ملف معلومات النسخة الاحتياطية
    const backupInfo = {
      timestamp: new Date().toISOString(),
      statistics: {
        articles: articles.length,
        categories: categories.length,
        users: users.length,
        authors: authors.length,
        opinion_authors: opinionAuthors.length,
        comments: comments.length,
        likes: likes.length,
        saves: saves.length,
        daily_doses: dailyDoses.length,
        deep_analyses: deepAnalyses.length,
        smart_blocks: smartBlocks.length,
        loyalty_points: loyaltyPoints.length
      }
    };
    
    await fs.writeFile(
      path.join(backupDir, 'backup_info.json'),
      JSON.stringify(backupInfo, null, 2)
    );
    
    // عرض ملخص النتائج
    log('\n✨ تمت عملية النسخ الاحتياطي بنجاح!', 'success');
    log('===================================', 'success');
    log(`📁 موقع النسخة: ${backupDir}`, 'info');
    log('\n📊 الإحصائيات:', 'info');
    Object.entries(backupInfo.statistics).forEach(([key, value]) => {
      log(`   • ${key}: ${value}`, 'info');
    });
    
  } catch (error) {
    log('\n❌ حدث خطأ أثناء النسخ الاحتياطي:', 'error');
    log(error.message, 'error');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
backupDatabase(); 