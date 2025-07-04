#!/usr/bin/env node

/**
 * 🧹 سكريبت تنظيف قاعدة البيانات من جميع البيانات التجريبية
 * 
 * ⚠️ تحذير: هذا السكريبت سيحذف جميع البيانات التجريبية نهائياً
 * 
 * ✅ سيتم حذف:
 * - جميع المقالات والأخبار التجريبية
 * - جميع التصنيفات الحالية
 * - جميع المستخدمين التجريبيين (عدا الإداريين)
 * - جميع المراسلين وكتاب الرأي التجريبيين
 * - جميع التفاعلات والمحتوى المرتبط
 * 
 * 🛑 لن يتم حذف:
 * - المستخدمين الإداريين (role = 'admin' أو 'super_admin')
 */

const { PrismaClient } = require('../lib/generated/prisma');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// دالة لطرح سؤال والحصول على إجابة
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

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

async function cleanDatabase() {
  try {
    log('\n🧹 بدء عملية تنظيف قاعدة البيانات...', 'info');
    
    // عرض تحذير واضح
    log('\n⚠️  تحذير هام ⚠️', 'warning');
    log('================', 'warning');
    log('سيتم حذف جميع البيانات التالية نهائياً:', 'warning');
    log('• جميع المقالات والأخبار', 'warning');
    log('• جميع التصنيفات', 'warning');
    log('• جميع المستخدمين (عدا الإداريين)', 'warning');
    log('• جميع المؤلفين والمراسلين', 'warning');
    log('• جميع التعليقات والتفاعلات', 'warning');
    log('• جميع الجرعات اليومية', 'warning');
    log('• جميع التحليلات العميقة', 'warning');
    
    const confirmation = await askQuestion('\nهل أنت متأكد من المتابعة؟ اكتب "نعم" للتأكيد: ');
    
    if (confirmation !== 'نعم') {
      log('تم إلغاء العملية.', 'info');
      process.exit(0);
    }
    
    // بدء العملية
    log('\n🔄 جاري تنظيف قاعدة البيانات...', 'info');
    
    // 1. حذف التفاعلات والمحتوى المرتبط أولاً
    log('\n📌 حذف التفاعلات والمحتوى المرتبط...', 'info');
    
    // حذف التعليقات
    const deletedComments = await prisma.comments.deleteMany({});
    log(`✅ تم حذف ${deletedComments.count} تعليق`, 'success');
    
    // حذف الإعجابات
    const deletedLikes = await prisma.article_likes.deleteMany({});
    log(`✅ تم حذف ${deletedLikes.count} إعجاب`, 'success');
    
    // حذف المقالات المحفوظة
    const deletedBookmarks = await prisma.article_saves.deleteMany({});
    log(`✅ تم حذف ${deletedBookmarks.count} مقال محفوظ`, 'success');
    
    // حذف التصويتات
    const deletedVotes = await prisma.article_votes.deleteMany({});
    log(`✅ تم حذف ${deletedVotes.count} تصويت`, 'success');
    
    // حذف المشاهدات
    const deletedViews = await prisma.article_views.deleteMany({});
    log(`✅ تم حذف ${deletedViews.count} مشاهدة`, 'success');
    
    // حذف التفاعلات
    const deletedInteractions = await prisma.article_interactions.deleteMany({});
    log(`✅ تم حذف ${deletedInteractions.count} تفاعل`, 'success');
    
    // 2. حذف المحتوى الرئيسي
    log('\n📄 حذف المحتوى الرئيسي...', 'info');
    
    // حذف محتويات الجرعات اليومية
    const deletedDoseContents = await prisma.dose_contents.deleteMany({});
    log(`✅ تم حذف ${deletedDoseContents.count} محتوى جرعة يومية`, 'success');
    
    // حذف الجرعات اليومية
    const deletedDailyDoses = await prisma.daily_doses.deleteMany({});
    log(`✅ تم حذف ${deletedDailyDoses.count} جرعة يومية`, 'success');
    
    // حذف التحليلات العميقة
    const deletedDeepAnalyses = await prisma.deep_analyses.deleteMany({});
    log(`✅ تم حذف ${deletedDeepAnalyses.count} تحليل عميق`, 'success');
    
    // حذف جميع المقالات
    const deletedArticles = await prisma.articles.deleteMany({});
    log(`✅ تم حذف ${deletedArticles.count} مقال`, 'success');
    
    // 3. حذف التصنيفات
    log('\n🏷️ حذف التصنيفات...', 'info');
    const deletedCategories = await prisma.categories.deleteMany({});
    log(`✅ تم حذف ${deletedCategories.count} تصنيف`, 'success');
    
    // 4. حذف المؤلفين
    log('\n✍️ حذف المؤلفين والمراسلين...', 'info');
    
    // حذف كتاب الرأي
    const deletedOpinionAuthors = await prisma.opinion_authors.deleteMany({});
    log(`✅ تم حذف ${deletedOpinionAuthors.count} كاتب رأي`, 'success');
    
    // حذف المؤلفين العاديين
    const deletedAuthors = await prisma.authors.deleteMany({});
    log(`✅ تم حذف ${deletedAuthors.count} مؤلف/مراسل`, 'success');
    
    // 5. حذف المستخدمين غير الإداريين
    log('\n👥 حذف المستخدمين التجريبيين...', 'info');
    
    // أولاً: الحصول على قائمة المستخدمين الإداريين
    const adminUsers = await prisma.users.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' },
          { email: { contains: 'admin' } }
        ]
      },
      select: { id: true, email: true, role: true }
    });
    
    log(`🔒 سيتم الاحتفاظ بـ ${adminUsers.length} مستخدم إداري:`, 'info');
    adminUsers.forEach(admin => {
      log(`   - ${admin.email} (${admin.role})`, 'info');
    });
    
    // حذف نقاط الولاء للمستخدمين غير الإداريين
    const deletedLoyaltyPoints = await prisma.user_loyalty_points.deleteMany({
      where: {
        user_id: {
          notIn: adminUsers.map(u => u.id)
        }
      }
    });
    log(`✅ تم حذف ${deletedLoyaltyPoints.count} سجل نقاط ولاء`, 'success');
    
    // حذف تفضيلات المستخدمين غير الإداريين
    const deletedPreferences = await prisma.user_preferences.deleteMany({
      where: {
        user_id: {
          notIn: adminUsers.map(u => u.id)
        }
      }
    });
    log(`✅ تم حذف ${deletedPreferences.count} تفضيل مستخدم`, 'success');
    
    // حذف المستخدمين غير الإداريين
    const deletedUsers = await prisma.users.deleteMany({
      where: {
        id: {
          notIn: adminUsers.map(u => u.id)
        }
      }
    });
    log(`✅ تم حذف ${deletedUsers.count} مستخدم تجريبي`, 'success');
    
    // 6. حذف البيانات الإضافية
    log('\n🗑️ حذف البيانات الإضافية...', 'info');
    
    // حذف الكلمات المفتاحية
    const deletedKeywords = await prisma.keywords.deleteMany({});
    log(`✅ تم حذف ${deletedKeywords.count} كلمة مفتاحية`, 'success');
    
    // حذف القوالب
    const deletedTemplates = await prisma.article_templates.deleteMany({});
    log(`✅ تم حذف ${deletedTemplates.count} قالب`, 'success');
    
    // حذف البلوكات الذكية
    const deletedSmartBlocks = await prisma.smart_blocks.deleteMany({});
    log(`✅ تم حذف ${deletedSmartBlocks.count} بلوك ذكي`, 'success');
    
    // حذف الأنشطة
    const deletedActivities = await prisma.user_activities.deleteMany({});
    log(`✅ تم حذف ${deletedActivities.count} سجل نشاط`, 'success');
    
    // حذف الرسائل
    const deletedMessages = await prisma.messages.deleteMany({});
    log(`✅ تم حذف ${deletedMessages.count} رسالة`, 'success');
    
    // عرض ملخص النتائج
    log('\n✨ تمت عملية التنظيف بنجاح!', 'success');
    log('========================', 'success');
    log('قاعدة البيانات جاهزة الآن لإدخال البيانات الحقيقية.', 'success');
    log(`تم الاحتفاظ بـ ${adminUsers.length} مستخدم إداري فقط.`, 'info');
    
  } catch (error) {
    log('\n❌ حدث خطأ أثناء تنظيف قاعدة البيانات:', 'error');
    log(error.message, 'error');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// تشغيل السكريبت
cleanDatabase(); 