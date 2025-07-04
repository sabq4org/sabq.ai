const { PrismaClient } = require('../lib/generated/prisma')
const prisma = new PrismaClient()

async function createTables() {
  console.log('🔨 إنشاء جداول الجرعات اليومية...')
  
  try {
    // إنشاء جدول DailyDose
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS DailyDose (
        id VARCHAR(191) NOT NULL,
        date DATE NOT NULL,
        timeSlot ENUM('morning', 'noon', 'evening', 'night') NOT NULL,
        greetingMain VARCHAR(255) NOT NULL,
        greetingSub VARCHAR(255) NOT NULL,
        status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
        views INT NOT NULL DEFAULT 0,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY DailyDose_date_timeSlot_key (date, timeSlot),
        INDEX DailyDose_date_idx (date),
        INDEX DailyDose_status_idx (status)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `
    console.log('✅ جدول DailyDose تم إنشاؤه')

    // إنشاء جدول DoseContent (بدون foreign keys لأن PlanetScale لا يدعمها)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS DoseContent (
        id VARCHAR(191) NOT NULL,
        doseId VARCHAR(191) NOT NULL,
        contentType ENUM('article', 'weather', 'quote', 'tip', 'audio', 'analysis') NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        imageUrl VARCHAR(500),
        audioUrl VARCHAR(500),
        articleId VARCHAR(191),
        displayOrder INT NOT NULL DEFAULT 0,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        INDEX DoseContent_doseId_idx (doseId),
        INDEX DoseContent_articleId_idx (articleId)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `
    console.log('✅ جدول DoseContent تم إنشاؤه')

    console.log('\n✅ تم إنشاء جميع الجداول بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTables() 