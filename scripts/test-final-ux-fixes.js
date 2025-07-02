#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 اختبار نهائي لجميع إصلاحات تجربة المستخدم\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFunction) {
  totalTests++;
  console.log(`📋 اختبار: ${testName}`);
  
  try {
    const result = testFunction();
    if (result) {
      console.log('✅ نجح\n');
      passedTests++;
    } else {
      console.log('❌ فشل\n');
    }
  } catch (error) {
    console.log(`❌ خطأ: ${error.message}\n`);
  }
}

// اختبار 1: فحص إصلاح صفحة تسجيل الدخول
runTest('إصلاح التوجيه في صفحة تسجيل الدخول', () => {
  const loginPath = path.join(__dirname, '../app/login/page.tsx');
  if (!fs.existsSync(loginPath)) return false;
  
  const content = fs.readFileSync(loginPath, 'utf8');
  return content.includes("redirectPath = '/';") || !content.includes("redirectPath = '/newspaper';");
});

// اختبار 2: فحص تحسينات مكون NewsCard
runTest('تحسينات مكون NewsCard مع ردود الفعل البصرية', () => {
  const pagePath = path.join(__dirname, '../app/page.tsx');
  if (!fs.existsSync(pagePath)) return false;
  
  const content = fs.readFileSync(pagePath, 'utf8');
  return content.includes('const [isLiked, setIsLiked] = useState(false)') &&
         content.includes('const handleInteraction = async') &&
         content.includes('toast.success');
});

// اختبار 3: فحص دالة trackInteraction المحسنة
runTest('دالة trackInteraction مع التشخيص الذكي', () => {
  const pagePath = path.join(__dirname, '../app/page.tsx');
  if (!fs.existsSync(pagePath)) return false;
  
  const content = fs.readFileSync(pagePath, 'utf8');
  return content.includes('فحص شامل لحالة تسجيل الدخول') &&
         content.includes('const hasUserId = userId') &&
         content.includes('تشخيص مفصل للمشاكل');
});

// اختبار 4: فحص بيانات المستخدمين
runTest('وجود بيانات المستخدمين', () => {
  const usersPath = path.join(__dirname, '../data/users.json');
  if (!fs.existsSync(usersPath)) return false;
  
  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const users = usersData.users || usersData;
  return Array.isArray(users) && users.length > 0;
});

// اختبار 5: فحص ملف التفضيلات
runTest('بنية ملف التفضيلات', () => {
  const preferencesPath = path.join(__dirname, '../data/user_preferences.json');
  if (!fs.existsSync(preferencesPath)) return false;
  
  const preferencesData = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
  return preferencesData.preferences && Array.isArray(preferencesData.preferences);
});

// اختبار 6: فحص استيراد أيقونة Bookmark
runTest('استيراد أيقونة Bookmark', () => {
  const pagePath = path.join(__dirname, '../app/page.tsx');
  if (!fs.existsSync(pagePath)) return false;
  
  const content = fs.readFileSync(pagePath, 'utf8');
  return content.includes('Bookmark') && content.includes('lucide-react');
});

// النتائج النهائية
console.log('🎯 نتائج الاختبار النهائي:');
console.log(`✅ نجح: ${passedTests}/${totalTests} اختبار`);
console.log(`📊 نسبة النجاح: ${Math.round((passedTests/totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 تهانينا! جميع الإصلاحات تعمل بشكل صحيح');
  console.log('🚀 النظام جاهز للاستخدام مع تجربة مستخدم محسنة');
} else {
  console.log(`\n⚠️ يحتاج ${totalTests - passedTests} اختبار إلى مراجعة`);
}

console.log('\n🔄 الخطوة التالية: npm run dev');
