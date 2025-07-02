const fs = require('fs');
const path = require('path');

// قراءة ملف المستخدمين
const usersPath = path.join(__dirname, '../data/users.json');
const loyaltyPath = path.join(__dirname, '../data/user_loyalty_points.json');

console.log('🔄 مزامنة نقاط الولاء...\n');

try {
  // قراءة البيانات
  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const loyaltyData = JSON.parse(fs.readFileSync(loyaltyPath, 'utf8'));
  
  console.log('📊 البيانات الحالية:');
  console.log('================\n');
  
  // مزامنة النقاط
  usersData.users.forEach(user => {
    console.log(`👤 ${user.name} (${user.email}):`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - نقاط في users.json: ${user.loyaltyPoints || 0}`);
    
    // البحث عن نقاط المستخدم في ملف الولاء
    const loyaltyRecord = loyaltyData.users.find(u => u.user_id === user.id);
    
    if (loyaltyRecord) {
      console.log(`   - نقاط في loyalty: ${loyaltyRecord.total_points}`);
      
      // تحديث النقاط في loyalty file لتطابق users.json
      if (user.loyaltyPoints && loyaltyRecord.total_points !== user.loyaltyPoints) {
        loyaltyRecord.total_points = user.loyaltyPoints;
        loyaltyRecord.earned_points = user.loyaltyPoints;
        loyaltyRecord.last_updated = new Date().toISOString();
        console.log(`   ✅ تم تحديث النقاط إلى: ${user.loyaltyPoints}`);
      }
    } else if (user.loyaltyPoints) {
      // إنشاء سجل جديد
      const newRecord = {
        user_id: user.id,
        total_points: user.loyaltyPoints,
        earned_points: user.loyaltyPoints,
        redeemed_points: 0,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      loyaltyData.users.push(newRecord);
      console.log(`   ✅ تم إنشاء سجل جديد بـ ${user.loyaltyPoints} نقطة`);
    }
    
    console.log('');
  });
  
  // حفظ التحديثات
  fs.writeFileSync(loyaltyPath, JSON.stringify(loyaltyData, null, 2));
  
  console.log('✅ تمت المزامنة بنجاح!\n');
  console.log('📌 الخطوات التالية:');
  console.log('1. قم بتسجيل الخروج من النظام');
  console.log('2. قم بتسجيل الدخول مرة أخرى');
  console.log('3. تحقق من أن المستوى يظهر بشكل صحيح في جميع الصفحات\n');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
} 