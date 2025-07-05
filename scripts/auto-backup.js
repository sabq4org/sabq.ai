const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createAutoBackup() {
  try {
    console.log('🔄 بدء إنشاء نسخة احتياطية تلقائية...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    
    // إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجوداً
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // جلب جميع المقالات بدون include للـ author (لتجنب مشكلة null)
    const articles = await prisma.article.findMany({
      include: {
        category: true
      }
    });
    
    // جلب المستخدمين
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // جلب التصنيفات
    const categories = await prisma.category.findMany();
    
    // إنشاء النسخة الاحتياطية
    const backup = {
      timestamp,
      articles: articles.length,
      users: users.length,
      categories: categories.length,
      data: {
        articles,
        users,
        categories
      }
    };
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ تم إنشاء نسخة احتياطية: ${backupFile}`);
    console.log(`📊 المحتوى: ${articles.length} مقال، ${users.length} مستخدم، ${categories.length} تصنيف`);
    
    // حذف النسخ القديمة (الاحتفاظ بآخر 10)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`🗑️ تم حذف النسخة القديمة: ${file}`);
      });
    }
    
    return backup;
  } catch (error) {
    console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل النسخ الاحتياطي إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  createAutoBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { createAutoBackup }; 