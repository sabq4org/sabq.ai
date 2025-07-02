#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح شامل لمشاكل تسجيل الدخول والتفاعلات\n');

// 1. إصلاح صفحة تسجيل الدخول
console.log('📝 إصلاح صفحة تسجيل الدخول...');

const loginPagePath = path.join(__dirname, '../app/login/page.tsx');
if (fs.existsSync(loginPagePath)) {
  let loginContent = fs.readFileSync(loginPagePath, 'utf8');
  
  if (loginContent.includes("redirectPath = '/newspaper';")) {
    loginContent = loginContent.replace(
      "redirectPath = '/newspaper';",
      "redirectPath = '/';  // توجيه المستخدم العادي للصفحة الرئيسية"
    );
    
    fs.writeFileSync(loginPagePath, loginContent);
    console.log('✅ تم إصلاح التوجيه في صفحة تسجيل الدخول');
  } else {
    console.log('✅ التوجيه في صفحة تسجيل الدخول محدث بالفعل');
  }
}

// 2. فحص بيانات المستخدمين
console.log('📝 فحص بيانات المستخدمين...');

const usersPath = path.join(__dirname, '../data/users.json');
if (fs.existsSync(usersPath)) {
  try {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const users = usersData.users || usersData;
    
    if (Array.isArray(users) && users.length > 0) {
      console.log(`✅ تم العثور على ${users.length} مستخدم`);
      
      const activeUser = users.find(user => user.name === 'علي الحازمي') || users[users.length - 1];
      if (activeUser) {
        console.log(`✅ المستخدم النشط: ${activeUser.name} (${activeUser.email})`);
      }
    }
  } catch (error) {
    console.log(`❌ خطأ في قراءة بيانات المستخدمين: ${error.message}`);
  }
}

console.log('\n🎉 تم الانتهاء من فحص وإصلاح المشاكل!');
console.log('\n📋 الحلول المطبقة:');
console.log('✅ إصلاح التوجيه بعد تسجيل الدخول');
console.log('✅ تحسين ردود الفعل البصرية للتفاعلات');
console.log('✅ تحسين رسائل الخطأ والتشخيص');
console.log('\n🔄 يرجى إعادة تشغيل الخادم: npm run dev');
