#!/usr/bin/env node

/**
 * 🧹 سكريبت تنظيف قاعدة البيانات المباشر - بدون تأكيد
 */

const { PrismaClient } = require('../lib/generated/prisma');

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

async function cleanDatabase() {
  try {
    log('\n🧹 بدء عملية تنظيف قاعدة البيانات...', 'info');
    
    // 1. حذف التفاعلات والمحتوى المرتبط أولاً
    log('\n📌 حذف التفاعلات والمحتوى المرتبط...', 'info');
    
    try {
      const deletedComments = await prisma.comment.deleteMany({});
      log(`✅ تم حذف ${deletedComments.count} تعليق`, 'success');
    } catch (error) {
      log('⚠️ لا توجد تعليقات أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedLikes = await prisma.interaction.deleteMany({
        where: { type: 'like' }
      });
      log(`✅ تم حذف ${deletedLikes.count} إعجاب`, 'success');
    } catch (error) {
      log('⚠️ لا توجد إعجابات أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedBookmarks = await prisma.interaction.deleteMany({
        where: { type: 'save' }
      });
      log(`✅ تم حذف ${deletedBookmarks.count} مقال محفوظ`, 'success');
    } catch (error) {
      log('⚠️ لا توجد مقالات محفوظة أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedVotes = await prisma.interaction.deleteMany({
        where: { type: 'comment' }
      });
      log(`✅ تم حذف ${deletedVotes.count} تفاعل تعليق`, 'success');
    } catch (error) {
      log('⚠️ لا توجد تفاعلات تعليقات أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedViews = await prisma.interaction.deleteMany({
        where: { type: 'view' }
      });
      log(`✅ تم حذف ${deletedViews.count} مشاهدة`, 'success');
    } catch (error) {
      log('⚠️ لا توجد مشاهدات أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedInteractions = await prisma.interaction.deleteMany({});
      log(`✅ تم حذف ${deletedInteractions.count} تفاعل إجمالي`, 'success');
    } catch (error) {
      log('⚠️ لا توجد تفاعلات أو تم حذفها مسبقاً', 'warning');
    }
    
    // 2. حذف المحتوى الرئيسي
    log('\n📄 حذف المحتوى الرئيسي...', 'info');
    
    try {
      const deletedDoseContents = await prisma.dose_contents.deleteMany({});
      log(`✅ تم حذف ${deletedDoseContents.count} محتوى جرعة يومية`, 'success');
    } catch (error) {
      log('⚠️ لا توجد محتويات جرعات أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedDailyDoses = await prisma.daily_doses.deleteMany({});
      log(`✅ تم حذف ${deletedDailyDoses.count} جرعة يومية`, 'success');
    } catch (error) {
      log('⚠️ لا توجد جرعات يومية أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedDeepAnalyses = await prisma.deepAnalysis.deleteMany({});
      log(`✅ تم حذف ${deletedDeepAnalyses.count} تحليل عميق`, 'success');
    } catch (error) {
      log('⚠️ لا توجد تحليلات عميقة أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedArticles = await prisma.article.deleteMany({});
      log(`✅ تم حذف ${deletedArticles.count} مقال`, 'success');
    } catch (error) {
      log('⚠️ لا توجد مقالات أو تم حذفها مسبقاً', 'warning');
    }
    
    // 3. حذف التصنيفات
    log('\n🏷️ حذف التصنيفات...', 'info');
    try {
      const deletedCategories = await prisma.category.deleteMany({});
      log(`✅ تم حذف ${deletedCategories.count} تصنيف`, 'success');
    } catch (error) {
      log('⚠️ لا توجد تصنيفات أو تم حذفها مسبقاً', 'warning');
    }
    
    // 4. حذف المؤلفين
    log('\n✍️ حذف المؤلفين والمراسلين...', 'info');
    log('⚠️ نماذج المؤلفين غير موجودة في الـ schema الحالي', 'warning');
    
    // 5. حذف المستخدمين غير الإداريين
    log('\n👥 حذف المستخدمين التجريبيين...', 'info');
    
    // أولاً: الحصول على قائمة المستخدمين الإداريين
    const adminUsers = await prisma.user.findMany({
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
    
    const adminIds = adminUsers.map(u => u.id);
    
    try {
      const deletedLoyaltyPoints = await prisma.loyalty_points.deleteMany({
          where: { user_id: { notIn: adminIds } }
        });
      log(`✅ تم حذف ${deletedLoyaltyPoints.count} سجل نقاط ولاء`, 'success');
    } catch (error) {
      log('⚠️ لا توجد نقاط ولاء أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedPreferences = await prisma.userPreference.deleteMany({
        where: { userId: { notIn: adminIds } }
      });
      log(`✅ تم حذف ${deletedPreferences.count} تفضيل مستخدم`, 'success');
    } catch (error) {
      log('⚠️ لا توجد تفضيلات أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedUsers = await prisma.user.deleteMany({
        where: { id: { notIn: adminIds } }
      });
      log(`✅ تم حذف ${deletedUsers.count} مستخدم تجريبي`, 'success');
    } catch (error) {
      log('⚠️ لا يوجد مستخدمون تجريبيون أو تم حذفهم مسبقاً', 'warning');
    }
    
    // 6. حذف البيانات الإضافية
    log('\n🗑️ حذف البيانات الإضافية...', 'info');
    
    try {
      const deletedKeywords = await prisma.keyword.deleteMany({});
      log(`✅ تم حذف ${deletedKeywords.count} كلمة مفتاحية`, 'success');
    } catch (error) {
      log('⚠️ لا توجد كلمات مفتاحية أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedActivities = await prisma.activityLog.deleteMany({});
      log(`✅ تم حذف ${deletedActivities.count} سجل نشاط`, 'success');
    } catch (error) {
      log('⚠️ لا توجد أنشطة أو تم حذفها مسبقاً', 'warning');
    }
    
    try {
      const deletedMessages = await prisma.message.deleteMany({});
      log(`✅ تم حذف ${deletedMessages.count} رسالة`, 'success');
    } catch (error) {
      log('⚠️ لا توجد رسائل أو تم حذفها مسبقاً', 'warning');
    }
    
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
  }
}

// تشغيل السكريبت
cleanDatabase(); 