const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function fixTables() {
  console.log('🔧 إصلاح جداول الجرعات اليومية...')
  
  try {
    // حذف الجداول القديمة
    console.log('🗑️  حذف الجداول القديمة...')
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS DoseContent`
      await prisma.$executeRaw`DROP TABLE IF EXISTS DailyDose`
      console.log('✅ تم حذف الجداول القديمة')
    } catch (e) {
      console.log('⚠️  الجداول غير موجودة')
    }

    // إنشاء جدول DailyDose بالمخطط الصحيح
    await prisma.$executeRaw`
      CREATE TABLE DailyDose (
        id VARCHAR(191) NOT NULL,
        period ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL,
        title VARCHAR(500) NOT NULL,
        subtitle VARCHAR(500) NOT NULL,
        date DATE NOT NULL,
        status ENUM('draft', 'published', 'scheduled', 'archived') NOT NULL DEFAULT 'draft',
        publishedAt DATETIME(3) NULL,
        views INT NOT NULL DEFAULT 0,
        metadata JSON,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY DailyDose_date_period_key (date, period),
        INDEX DailyDose_date_idx (date),
        INDEX DailyDose_period_idx (period),
        INDEX DailyDose_status_idx (status)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `
    console.log('✅ جدول DailyDose تم إنشاؤه')

    // إنشاء جدول DoseContent
    await prisma.$executeRaw`
      CREATE TABLE DoseContent (
        id VARCHAR(191) NOT NULL,
        doseId VARCHAR(191) NOT NULL,
        articleId VARCHAR(191),
        contentType ENUM('article', 'weather', 'quote', 'tip', 'audio', 'analysis') NOT NULL,
        title VARCHAR(500) NOT NULL,
        summary TEXT NOT NULL,
        audioUrl TEXT,
        imageUrl TEXT,
        displayOrder INT NOT NULL DEFAULT 0,
        metadata JSON,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        INDEX DoseContent_doseId_idx (doseId),
        INDEX DoseContent_articleId_idx (articleId)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `
    console.log('✅ جدول DoseContent تم إنشاؤه')

    console.log('\n✅ تم إصلاح جميع الجداول بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الجداول:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixTables() 