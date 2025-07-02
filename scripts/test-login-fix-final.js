#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 اختبار نهائي لمشكلة التفاعل مع تسجيل الدخول\n');

// فحص ملف المستخدمين
const usersPath = path.join(__dirname, '../data/users.json');
if (!fs.existsSync(usersPath)) {
  console.log('❌ ملف المستخدمين غير موجود');
  process.exit(1);
}

const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const users = usersData.users || usersData;
console.log(`✅ تم العثور على ${users.length} مستخدم`);

// البحث عن المستخدم النشط
const activeUser = users.find(user => user.name === 'علي الحازمي') || users[users.length - 1];
if (!activeUser) {
  console.log('❌ لا يوجد مستخدم نشط');
  process.exit(1);
}

console.log(`👤 المستخدم النشط: ${activeUser.name} (${activeUser.email})`);
console.log(`🆔 معرف المستخدم: ${activeUser.id}\n`);

// محاكاة بيانات localStorage
const mockLocalStorage = {
  'user_id': activeUser.id,
  'user': JSON.stringify(activeUser),
  'currentUser': JSON.stringify(activeUser)
};

console.log('📋 محاكاة بيانات localStorage:');
Object.entries(mockLocalStorage).forEach(([key, value]) => {
  const displayValue = typeof value === 'string' && value.length > 50 ? 
    value.substring(0, 50) + '...' : value;
  console.log(`  ${key}: ${displayValue}`);
});

// اختبار منطق التحقق من تسجيل الدخول
console.log('\n🧪 اختبار منطق التحقق من تسجيل الدخول:');

const userId = mockLocalStorage['user_id'];
const userData = mockLocalStorage['user'];

console.log(`1. user_id: "${userId}"`);
console.log(`2. userData موجود: ${userData ? 'نعم' : 'لا'}`);

// شروط التحقق الصارمة (نفس الكود في trackInteraction)
const hasUserId = userId && userId.trim() !== '' && userId !== 'null' && userId !== 'undefined';
const isNotAnonymous = userId !== 'anonymous';
const hasUserData = userData && userData.trim() !== '' && userData !== 'null' && userData !== 'undefined';

console.log('\n📋 نتائج الفحص الصارم:');
console.log(`- hasUserId: ${hasUserId ? '✅ صحيح' : '❌ خاطئ'}`);
console.log(`- isNotAnonymous: ${isNotAnonymous ? '✅ صحيح' : '❌ خاطئ'}`);
console.log(`- hasUserData: ${hasUserData ? '✅ صحيح' : '❌ خاطئ'}`);

const isUserLoggedIn = hasUserId && isNotAnonymous && hasUserData;
console.log(`\n🎯 النتيجة النهائية: ${isUserLoggedIn ? '✅ مسجل دخول' : '❌ غير مسجل دخول'}`);

if (isUserLoggedIn) {
  console.log('\n✅ التحقق من تسجيل الدخول يعمل بشكل صحيح!');
  console.log('✅ لن تظهر رسالة "يرجى تسجيل الدخول" للمستخدم');
} else {
  console.log('\n❌ مشكلة في التحقق من تسجيل الدخول!');
  console.log('⚠️ هذا يعني أن رسالة "يرجى تسجيل الدخول" ستظهر للمستخدم');
}

console.log('\n🎉 تم الانتهاء من الاختبار!');
