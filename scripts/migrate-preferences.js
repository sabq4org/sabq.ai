const fs = require('fs').promises;
const path = require('path');

async function migratePreferences() {
  try {
    console.log('بدء ترحيل تفضيلات المستخدمين...');
    
    // قراءة الملف الحالي
    const filePath = path.join(__dirname, '..', 'data', 'user_preferences.json');
    let data = {};
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(content);
    } catch (error) {
      console.log('لا يوجد ملف تفضيلات حالي، سيتم إنشاء ملف جديد');
    }
    
    // التحقق من التنسيق
    let needsMigration = false;
    
    // إذا كان التنسيق القديم (مصفوفة)
    if (Array.isArray(data)) {
      console.log('تم اكتشاف تنسيق قديم (مصفوفة)، جاري الترحيل...');
      const oldData = data;
      data = {};
      
      // تحويل من مصفوفة إلى كائن
      oldData.forEach(pref => {
        if (pref.user_id) {
          data[pref.user_id] = pref;
        }
      });
      needsMigration = true;
    }
    
    // إذا كان التنسيق القديم مع preferences property
    if (data.preferences && Array.isArray(data.preferences)) {
      console.log('تم اكتشاف تنسيق قديم (preferences array)، جاري الترحيل...');
      const oldPrefs = data.preferences;
      data = {};
      
      oldPrefs.forEach(pref => {
        if (pref.user_id) {
          data[pref.user_id] = pref;
        }
      });
      needsMigration = true;
    }
    
    // التحقق من كل مستخدم والتأكد من التنسيق الصحيح
    Object.keys(data).forEach(userId => {
      const userPref = data[userId];
      
      // التأكد من وجود البنية الأساسية
      if (!userPref.categories || typeof userPref.categories !== 'object') {
        userPref.categories = {};
        needsMigration = true;
      }
      
      if (!userPref.authors || typeof userPref.authors !== 'object') {
        userPref.authors = {};
        needsMigration = true;
      }
      
      if (!userPref.topics || !Array.isArray(userPref.topics)) {
        userPref.topics = [];
        needsMigration = true;
      }
      
      if (!userPref.reading_time) {
        userPref.reading_time = {
          preferred_hours: [],
          average_duration: 0
        };
        needsMigration = true;
      }
      
      if (!userPref.last_updated) {
        userPref.last_updated = new Date().toISOString();
        needsMigration = true;
      }
      
      // تحويل preferred_categories القديم إلى categories الجديد
      if (userPref.preferred_categories && Array.isArray(userPref.preferred_categories)) {
        userPref.preferred_categories.forEach(catId => {
          userPref.categories[catId.toString()] = 10; // وزن افتراضي
        });
        delete userPref.preferred_categories;
        needsMigration = true;
      }
      
      data[userId] = userPref;
    });
    
    if (needsMigration) {
      // نسخ احتياطية
      const backupPath = filePath.replace('.json', `_backup_${Date.now()}.json`);
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupPath, originalContent);
        console.log(`تم حفظ نسخة احتياطية في: ${backupPath}`);
      } catch (error) {
        console.log('لا يوجد ملف أصلي للنسخ الاحتياطي');
      }
      
      // حفظ البيانات المحدثة
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log('✅ تم ترحيل التفضيلات بنجاح!');
      console.log(`عدد المستخدمين: ${Object.keys(data).length}`);
    } else {
      console.log('✅ التفضيلات بالتنسيق الصحيح بالفعل');
    }
    
  } catch (error) {
    console.error('❌ خطأ في ترحيل التفضيلات:', error);
  }
}

// تشغيل الترحيل
migratePreferences(); 