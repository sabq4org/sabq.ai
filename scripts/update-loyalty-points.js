const fs = require('fs').promises;
const path = require('path');

async function updateLoyaltyPoints() {
  try {
    // قراءة ملف نقاط الولاء
    const loyaltyFilePath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');
    const fileContent = await fs.readFile(loyaltyFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // البحث عن المستخدم وتحديث نقاطه
    const userId = 'fb891596-5b72-47ab-8a13-39e0647108ed';
    const userIndex = data.users.findIndex(u => u.user_id === userId);
    
    if (userIndex !== -1) {
      // تحديث النقاط إلى 164
      data.users[userIndex].total_points = 164;
      data.users[userIndex].earned_points = 164;
      data.users[userIndex].last_updated = new Date().toISOString();
      
      // حفظ الملف
      await fs.writeFile(loyaltyFilePath, JSON.stringify(data, null, 2));
      
      console.log('✅ تم تحديث نقاط الولاء بنجاح');
      console.log(`النقاط القديمة: 105`);
      console.log(`النقاط الجديدة: 164`);
    } else {
      console.log('❌ لم يتم العثور على المستخدم في ملف نقاط الولاء');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

updateLoyaltyPoints(); 