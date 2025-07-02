// سكريبت لتنظيف بيانات المستخدم من localStorage
// يمكن تشغيله في console المتصفح

console.log('🧹 بدء تنظيف بيانات المستخدم...');

// تنظيف localStorage
const keysToRemove = [
  'user',
  'user_id', 
  'user_preferences',
  'darkMode',
  'auth-token',
  'token'
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`✅ تم حذف: ${key}`);
  } else {
    console.log(`ℹ️ غير موجود: ${key}`);
  }
});

// تنظيف sessionStorage
sessionStorage.clear();
console.log('✅ تم تنظيف sessionStorage');

// تنظيف الكوكيز
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ تم تنظيف الكوكيز');

console.log('🎉 تم تنظيف جميع بيانات المستخدم بنجاح!');
console.log('يرجى إعادة تحميل الصفحة الآن.'); 