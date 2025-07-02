#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function verifyPreferencesFix() {
  console.log('🔍 التحقق النهائي من إصلاح التفضيلات...\n');
  
  const checks = [];
  
  try {
    // 1. التحقق من ملف التفضيلات
    console.log('1️⃣ فحص ملف التفضيلات...');
    const preferencesPath = path.join(__dirname, '..', 'data', 'user_preferences.json');
    const content = await fs.readFile(preferencesPath, 'utf-8');
    const data = JSON.parse(content);
    
    if (data.preferences && Array.isArray(data.preferences)) {
      checks.push({ name: 'بنية ملف التفضيلات', status: '✅', details: `${data.preferences.length} تفضيل محفوظ` });
    } else {
      checks.push({ name: 'بنية ملف التفضيلات', status: '❌', details: 'بنية خاطئة' });
    }
    
    // 2. التحقق من وجود تفضيلات للمستخدم admin
    const adminPrefs = data.preferences.filter(p => p.user_id === 'admin');
    if (adminPrefs.length > 0) {
      checks.push({ name: 'تفضيلات المستخدم admin', status: '✅', details: `${adminPrefs.length} تفضيل` });
    } else {
      checks.push({ name: 'تفضيلات المستخدم admin', status: '❌', details: 'لا توجد تفضيلات' });
    }
    
    // 3. التحقق من صفحة الملف الشخصي
    console.log('\n2️⃣ فحص صفحة الملف الشخصي...');
    const profilePath = path.join(__dirname, '..', 'app', 'profile', 'page.tsx');
    const profileContent = await fs.readFile(profilePath, 'utf-8');
    
    if (profileContent.includes('console.log(\'🔍 محاولة جلب التفضيلات من API')) {
      checks.push({ name: 'تسجيل التفضيلات', status: '✅', details: 'تم إضافة تسجيل مفصل' });
    } else {
      checks.push({ name: 'تسجيل التفضيلات', status: '❌', details: 'لا يوجد تسجيل مفصل' });
    }
    
    if (profileContent.includes('sync_from_localstorage')) {
      checks.push({ name: 'مزامنة localStorage', status: '✅', details: 'تم إضافة آلية المزامنة' });
    } else {
      checks.push({ name: 'مزامنة localStorage', status: '❌', details: 'لا توجد آلية مزامنة' });
    }
    
    // 4. التحقق من API
    console.log('\n3️⃣ فحص API التفضيلات...');
    const apiPath = path.join(__dirname, '..', 'app', 'api', 'user', 'preferences', '[id]', 'route.ts');
    const apiExists = await fs.access(apiPath).then(() => true).catch(() => false);
    
    if (apiExists) {
      checks.push({ name: 'API جلب التفضيلات', status: '✅', details: 'الملف موجود' });
    } else {
      checks.push({ name: 'API جلب التفضيلات', status: '❌', details: 'الملف غير موجود' });
    }
    
    // 5. عرض النتائج
    console.log('\n📊 نتائج الفحص:');
    console.log('━'.repeat(60));
    
    let passedChecks = 0;
    checks.forEach(check => {
      console.log(`${check.status} ${check.name}: ${check.details}`);
      if (check.status === '✅') passedChecks++;
    });
    
    console.log('━'.repeat(60));
    console.log(`📈 النتيجة: ${passedChecks}/${checks.length} فحوصات نجحت`);
    
    if (passedChecks === checks.length) {
      console.log('\n🎉 تم إصلاح المشكلة بنجاح!');
      console.log('\n📋 خطوات التحقق النهائي:');
      console.log('1. تشغيل الخادم: npm run dev');
      console.log('2. فتح الملف الشخصي: http://localhost:3000/profile');
      console.log('3. فحص console للتأكد من عمل التسجيل');
      console.log('4. التحقق من ظهور التفضيلات');
      console.log('5. اختبار تعديل التفضيلات');
    } else {
      console.log('\n⚠️ هناك مشاكل تحتاج إلى إصلاح');
    }
    
    // 6. معلومات إضافية
    console.log('\n📝 معلومات إضافية:');
    console.log(`📁 ملف التفضيلات: ${preferencesPath}`);
    console.log(`📄 صفحة الملف الشخصي: ${profilePath}`);
    console.log(`🔗 API التفضيلات: ${apiPath}`);
    
    // 7. اختبار سريع للـ localStorage simulation
    console.log('\n🧪 محاكاة localStorage:');
    const mockUser = {
      id: 'admin',
      name: 'علي الحازمي',
      interests: ['sports', 'tech']
    };
    
    const interestMap = {
      'tech': { category_id: 1, category_name: 'تقنية', category_icon: '⚡', category_color: '#3B82F6' },
      'sports': { category_id: 3, category_name: 'رياضة', category_icon: '⚽', category_color: '#F97316' }
    };
    
    const mappedPreferences = mockUser.interests.map(interestId => interestMap[interestId]).filter(Boolean);
    console.log('👤 مستخدم تجريبي:', mockUser.name);
    console.log('🎯 اهتمامات localStorage:', mockUser.interests);
    console.log('🔄 تفضيلات محولة:', mappedPreferences.map(p => p.category_name));
    
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
  }
}

verifyPreferencesFix(); 