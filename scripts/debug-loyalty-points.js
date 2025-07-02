/**
 * سكريبت تشخيص نقاط الولاء
 * يمكن تشغيله في console المتصفح
 */

async function debugLoyaltyPoints() {
  console.log('🔍 بدء تشخيص نقاط الولاء...');
  
  // 1. فحص بيانات المستخدم
  const userId = localStorage.getItem('user_id');
  const userData = localStorage.getItem('user');
  
  console.log('📋 بيانات المستخدم:');
  console.log('- user_id:', userId);
  console.log('- user data:', userData ? JSON.parse(userData) : null);
  
  if (!userId || userId === 'anonymous') {
    console.error('❌ لم يتم العثور على معرف المستخدم. يرجى تسجيل الدخول أولاً.');
    return;
  }
  
  // 2. جلب نقاط الولاء من API
  console.log('\n📊 جلب نقاط الولاء من الخادم...');
  
  try {
    const response = await fetch(`/api/user/loyalty-points/${userId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ نقاط الولاء:');
      console.log('- إجمالي النقاط:', data.data.total_points);
      console.log('- المستوى:', data.data.level);
      console.log('- النقاط للمستوى التالي:', data.data.next_level_points);
      
      if (data.data.recent_activities && data.data.recent_activities.length > 0) {
        console.log('\n📈 آخر النشاطات:');
        data.data.recent_activities.forEach((activity, index) => {
          console.log(`${index + 1}. ${activity.description} (+${activity.points} نقطة) - ${new Date(activity.created_at).toLocaleString('ar-SA')}`);
        });
      }
      
      // حفظ في localStorage للاستخدام المحلي
      localStorage.setItem('user_loyalty_points', data.data.total_points.toString());
      console.log('\n💾 تم حفظ النقاط في localStorage');
      
    } else {
      console.error('❌ فشل في جلب نقاط الولاء:', data.error);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال بالخادم:', error);
  }
  
  // 3. عرض التفاعلات المحلية
  console.log('\n📱 التفاعلات المحفوظة محلياً:');
  const localInteractions = localStorage.getItem(`user_interactions_${userId}`);
  if (localInteractions) {
    const interactions = JSON.parse(localInteractions);
    console.log('- عدد التفاعلات:', interactions.length);
    console.log('- آخر 5 تفاعلات:');
    interactions.slice(-5).forEach((interaction, index) => {
      console.log(`  ${index + 1}. ${interaction.interaction_type} - ${new Date(interaction.timestamp).toLocaleString('ar-SA')}`);
    });
  } else {
    console.log('- لا توجد تفاعلات محفوظة محلياً');
  }
  
  console.log('\n✅ انتهى التشخيص');
}

// دالة لإضافة نقاط تجريبية (للاختبار فقط)
async function testAddPoints(interactionType = 'like') {
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    console.error('❌ يرجى تسجيل الدخول أولاً');
    return;
  }
  
  console.log(`🎯 إضافة تفاعل تجريبي: ${interactionType}`);
  
  try {
    const response = await fetch('/api/interactions/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        articleId: 'test-article-' + Date.now(),
        interactionType: interactionType,
        source: 'debug-script'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ تم إضافة التفاعل بنجاح');
      if (data.points) {
        console.log(`🎉 حصلت على ${data.points} نقطة!`);
      }
      
      // إعادة تشغيل التشخيص لعرض النقاط الجديدة
      setTimeout(() => debugLoyaltyPoints(), 1000);
    } else {
      console.error('❌ فشل في إضافة التفاعل:', data.error);
    }
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

// دالة لمسح البيانات المحلية (استخدم بحذر!)
function clearLocalData() {
  const confirm = window.confirm('⚠️ هل أنت متأكد من مسح جميع البيانات المحلية؟');
  if (confirm) {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      localStorage.removeItem(`user_interactions_${userId}`);
      localStorage.removeItem(`user_preferences_${userId}`);
      localStorage.removeItem('user_loyalty_points');
      console.log('✅ تم مسح البيانات المحلية');
    }
  }
}

// تشغيل التشخيص
console.log('🚀 سكريبت تشخيص نقاط الولاء جاهز!');
console.log('الأوامر المتاحة:');
console.log('- debugLoyaltyPoints() : لتشخيص نقاط الولاء');
console.log('- testAddPoints("like") : لإضافة تفاعل تجريبي');
console.log('- clearLocalData() : لمسح البيانات المحلية');

// تشغيل التشخيص تلقائياً
debugLoyaltyPoints(); 