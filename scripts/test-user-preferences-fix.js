#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const preferencesPath = path.join(__dirname, '..', 'data', 'user_preferences.json');

async function testUserPreferences() {
  console.log('🧪 اختبار نظام التفضيلات...\n');
  
  try {
    // 1. التحقق من وجود ملف التفضيلات
    console.log('1️⃣ التحقق من ملف التفضيلات...');
    const fileExists = await fs.access(preferencesPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      console.log('❌ ملف التفضيلات غير موجود');
      console.log('📁 إنشاء ملف التفضيلات...');
      await fs.writeFile(preferencesPath, JSON.stringify({ preferences: [] }, null, 2));
      console.log('✅ تم إنشاء ملف التفضيلات');
    } else {
      console.log('✅ ملف التفضيلات موجود');
    }
    
    // 2. قراءة محتوى الملف
    console.log('\n2️⃣ قراءة محتوى ملف التفضيلات...');
    const content = await fs.readFile(preferencesPath, 'utf-8');
    const data = JSON.parse(content);
    console.log('📄 محتوى الملف:', JSON.stringify(data, null, 2));
    
    // 3. التحقق من البنية
    console.log('\n3️⃣ التحقق من بنية البيانات...');
    if (!data.preferences || !Array.isArray(data.preferences)) {
      console.log('❌ بنية البيانات خاطئة');
      data.preferences = [];
      await fs.writeFile(preferencesPath, JSON.stringify(data, null, 2));
      console.log('✅ تم إصلاح بنية البيانات');
    } else {
      console.log('✅ بنية البيانات صحيحة');
    }
    
    // 4. إضافة تفضيلات تجريبية
    console.log('\n4️⃣ إضافة تفضيلات تجريبية...');
    const testUserId = 'admin';
    const testPreferences = [
      {
        id: `pref-${Date.now()}-1`,
        user_id: testUserId,
        category_id: 3,
        category_name: 'رياضة',
        category_icon: '⚽',
        category_color: '#F97316',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `pref-${Date.now()}-2`,
        user_id: testUserId,
        category_id: 1,
        category_name: 'تقنية',
        category_icon: '⚡',
        category_color: '#3B82F6',
        source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // إزالة التفضيلات القديمة للمستخدم التجريبي
    data.preferences = data.preferences.filter(pref => pref.user_id !== testUserId);
    
    // إضافة التفضيلات الجديدة
    data.preferences.push(...testPreferences);
    
    await fs.writeFile(preferencesPath, JSON.stringify(data, null, 2));
    console.log('✅ تم إضافة التفضيلات التجريبية');
    console.log('👤 المستخدم:', testUserId);
    console.log('📊 عدد التفضيلات:', testPreferences.length);
    
    // 5. اختبار API
    console.log('\n5️⃣ اختبار API...');
    console.log('🌐 يمكنك الآن اختبار API من خلال:');
    console.log(`   GET: http://localhost:3000/api/user/preferences/${testUserId}`);
    console.log('   POST: http://localhost:3000/api/user/preferences');
    
    console.log('\n✅ تم إصلاح نظام التفضيلات بنجاح!');
    console.log('\n📋 الخطوات التالية:');
    console.log('1. تأكد من تشغيل الخادم: npm run dev');
    console.log('2. افتح الملف الشخصي: http://localhost:3000/profile');
    console.log('3. تحقق من ظهور الاهتمامات');
    console.log('4. جرب تعديل الاهتمامات: http://localhost:3000/welcome/preferences');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار التفضيلات:', error);
  }
}

testUserPreferences(); 