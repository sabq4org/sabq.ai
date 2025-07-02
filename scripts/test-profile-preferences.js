const fs = require('fs');
const path = require('path');

// قراءة ملف التفضيلات
const preferencesPath = path.join(__dirname, '../data/user_preferences.json');
const categoriesPath = path.join(__dirname, '../data/categories.json');

try {
  // قراءة التصنيفات
  const categoriesData = fs.readFileSync(categoriesPath, 'utf8');
  const categoriesObj = JSON.parse(categoriesData);
  const categories = categoriesObj.categories || [];
  
  console.log('📂 التصنيفات المتاحة:');
  categories.forEach(cat => {
    console.log(`  ${cat.icon} ${cat.name_ar} (ID: ${cat.id})`);
  });
  
  // إنشاء تفضيلات تجريبية
  const testPreferences = [
    {
      user_id: "test-user-123",
      category_id: "1",
      created_at: new Date().toISOString()
    },
    {
      user_id: "test-user-123", 
      category_id: "2",
      created_at: new Date().toISOString()
    },
    {
      user_id: "test-user-123",
      category_id: "3", 
      created_at: new Date().toISOString()
    }
  ];
  
  // كتابة التفضيلات
  fs.writeFileSync(preferencesPath, JSON.stringify(testPreferences, null, 2));
  
  console.log('\n✅ تم إنشاء تفضيلات تجريبية:');
  testPreferences.forEach(pref => {
    const category = categories.find(c => c.id.toString() === pref.category_id);
    if (category) {
      console.log(`  ${category.icon} ${category.name_ar}`);
    }
  });
  
  console.log('\n📝 لاختبار الصفحة:');
  console.log('1. قم بتسجيل الدخول');
  console.log('2. اذهب إلى http://localhost:3000/profile');
  console.log('3. يجب أن تظهر الاهتمامات في القسم المخصص');
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
} 