#!/usr/bin/env node

/**
 * سكريبت لإصلاح مشكلة user_id المفقود في localStorage
 * يمكن تشغيله مباشرة في console المتصفح
 */

function fixUserId() {
  console.log('🔧 بدء إصلاح user_id...');
  
  // التحقق من وجود بيانات المستخدم
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    console.log('❌ لا توجد بيانات مستخدم في localStorage');
    return false;
  }
  
  try {
    const user = JSON.parse(userData);
    console.log('✅ تم العثور على بيانات المستخدم:', user);
    
    // التحقق من وجود id في بيانات المستخدم
    if (!user.id) {
      console.log('❌ لا يوجد id في بيانات المستخدم');
      return false;
    }
    
    // حفظ user_id
    localStorage.setItem('user_id', user.id);
    console.log(`✅ تم حفظ user_id: ${user.id}`);
    
    // التحقق من النجاح
    const savedUserId = localStorage.getItem('user_id');
    if (savedUserId === user.id) {
      console.log('🎉 تم إصلاح المشكلة بنجاح!');
      console.log('يمكنك الآن استخدام الموقع بشكل طبيعي');
      return true;
    } else {
      console.log('❌ فشل في حفظ user_id');
      return false;
    }
    
  } catch (error) {
    console.error('❌ خطأ في معالجة البيانات:', error);
    return false;
  }
}

// تشغيل الإصلاح
fixUserId();

// للاستخدام في المتصفح، انسخ الكود التالي والصقه في console:
/*
const userData = localStorage.getItem('user');
if (userData) {
  const user = JSON.parse(userData);
  if (user.id) {
    localStorage.setItem('user_id', user.id);
    console.log('✅ تم إصلاح user_id:', user.id);
  }
}
*/ 