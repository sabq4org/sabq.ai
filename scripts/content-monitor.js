const { PrismaClient } = require('../lib/generated/prisma');
const { createAutoBackup } = require('./auto-backup');

const prisma = new PrismaClient();

// مراقبة التغييرات في قاعدة البيانات
async function monitorContent() {
  let lastArticleCount = 0;
  let lastUserCount = 0;
  
  console.log('🔍 بدء مراقبة المحتوى...');
  
  // فحص أولي
  const initialCheck = await checkContentCounts();
  lastArticleCount = initialCheck.articles;
  lastUserCount = initialCheck.users;
  
  console.log(`📊 العدد الأولي: ${lastArticleCount} مقال، ${lastUserCount} مستخدم`);
  
  // فحص دوري كل دقيقة
  setInterval(async () => {
    try {
      const currentCheck = await checkContentCounts();
      
      // تحقق من انخفاض عدد المقالات
      if (currentCheck.articles < lastArticleCount) {
        const deletedCount = lastArticleCount - currentCheck.articles;
        console.log(`🚨 تحذير: تم حذف ${deletedCount} مقال!`);
        console.log(`📉 العدد السابق: ${lastArticleCount} ← العدد الحالي: ${currentCheck.articles}`);
        
        // إنشاء نسخة احتياطية فورية
        await createAutoBackup();
        
        // تسجيل التحذير
        await logSecurityAlert('ARTICLES_DELETED', {
          previousCount: lastArticleCount,
          currentCount: currentCheck.articles,
          deletedCount
        });
      }
      
      // تحقق من انخفاض عدد المستخدمين
      if (currentCheck.users < lastUserCount) {
        const deletedCount = lastUserCount - currentCheck.users;
        console.log(`🚨 تحذير: تم حذف ${deletedCount} مستخدم!`);
        
        await logSecurityAlert('USERS_DELETED', {
          previousCount: lastUserCount,
          currentCount: currentCheck.users,
          deletedCount
        });
      }
      
      // تحديث العدادات
      lastArticleCount = currentCheck.articles;
      lastUserCount = currentCheck.users;
      
    } catch (error) {
      console.error('❌ خطأ في مراقبة المحتوى:', error);
    }
  }, 60000); // كل دقيقة
}

async function checkContentCounts() {
  const articles = await prisma.article.count();
  const users = await prisma.user.count();
  const categories = await prisma.category.count();
  
  return { articles, users, categories };
}

async function logSecurityAlert(type, data) {
  try {
    const alert = {
      id: `alert-${Date.now()}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    };
    
    console.log('🚨 تنبيه أمني:', JSON.stringify(alert, null, 2));
    
    // يمكن إضافة إرسال إيميل أو إشعار هنا
    
  } catch (error) {
    console.error('خطأ في تسجيل التنبيه:', error);
  }
}

// تشغيل المراقبة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  monitorContent()
    .catch(console.error);
}

module.exports = { monitorContent, checkContentCounts }; 