const fs = require('fs');
const path = require('path');

// اختبار ملف التفضيلات
function testPreferencesFile() {
  console.log('🔍 اختبار ملف التفضيلات...');
  
  const filePath = path.join(process.cwd(), 'data', 'user_preferences.json');
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      console.log('✅ ملف التفضيلات موجود');
      console.log('📊 عدد التفضيلات:', Array.isArray(data) ? data.length : 'غير صحيح');
      console.log('📋 تنسيق البيانات:', Array.isArray(data) ? 'مصفوفة' : 'غير صحيح');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📝 مثال على تفضيل:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('❌ ملف التفضيلات غير موجود');
    }
  } catch (error) {
    console.error('❌ خطأ في قراءة ملف التفضيلات:', error.message);
  }
}

// اختبار API التفضيلات
async function testPreferencesAPI() {
  console.log('\n🔍 اختبار API التفضيلات...');
  
  try {
    const response = await fetch('http://localhost:3000/api/user/preferences?userId=test-user-123');
    const data = await response.json();
    
    console.log('✅ API التفضيلات يعمل');
    console.log('📊 الاستجابة:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ خطأ في API التفضيلات:', error.message);
  }
}

// اختبار حفظ تفضيلات جديدة
async function testSavePreferences() {
  console.log('\n🔍 اختبار حفظ تفضيلات جديدة...');
  
  try {
    const response = await fetch('http://localhost:3000/api/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-123',
        categoryIds: [1, 2, 3],
        source: 'manual'
      })
    });
    
    const data = await response.json();
    
    console.log('✅ حفظ التفضيلات:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ خطأ في حفظ التفضيلات:', error.message);
  }
}

// تشغيل الاختبارات
async function runTests() {
  console.log('🚀 بدء اختبارات التفضيلات...\n');
  
  testPreferencesFile();
  
  // انتظار قليل للتأكد من تشغيل الخادم
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testPreferencesAPI();
  await testSavePreferences();
  
  console.log('\n✅ انتهت الاختبارات');
}

runTests().catch(console.error); 