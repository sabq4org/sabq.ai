const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function initAIModerationSettings() {
  try {
    console.log('🤖 جاري إنشاء إعدادات الذكاء الاصطناعي...');

    // التحقق من وجود إعدادات سابقة
    const existingSettings = await prisma.aIModerationSettings.findFirst();
    
    if (existingSettings) {
      console.log('✅ الإعدادات موجودة مسبقاً');
      return;
    }

    // إنشاء إعدادات افتراضية
    const settings = await prisma.aIModerationSettings.create({
      data: {
        autoApproveThreshold: 80,
        autoRejectThreshold: 20,
        enabled: true,
        aiProvider: 'local', // نبدأ بالتحليل المحلي
        checkSpam: true,
        checkToxicity: true,
        checkProfanity: true,
        checkThreats: true,
        checkIdentityAttack: true,
        customRules: {
          bannedPhrases: [],
          allowedDomains: [],
          maxLinks: 2,
          minLength: 3,
          maxLength: 1000
        }
      }
    });

    console.log('✅ تم إنشاء إعدادات الذكاء الاصطناعي بنجاح');
    console.log('📊 الإعدادات:', {
      autoApproveThreshold: settings.autoApproveThreshold,
      autoRejectThreshold: settings.autoRejectThreshold,
      aiProvider: settings.aiProvider
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء الإعدادات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initAIModerationSettings(); 