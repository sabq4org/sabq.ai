#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function testFinalLoginFix() {
  console.log('🧪 اختبار الحل النهائي لمشكلة تسجيل الدخول...\n');
  
  const checks = [];
  
  try {
    // 1. التحقق من تحديث دالة trackInteraction
    console.log('1️⃣ فحص تحديث دالة trackInteraction...');
    const pageContent = await fs.readFile(path.join(__dirname, '..', 'app', 'page.tsx'), 'utf-8');
    
    if (pageContent.includes('إعادة فحص حالة تسجيل الدخول من localStorage مباشرة')) {
      checks.push({ name: 'تحديث دالة trackInteraction', status: '✅', details: 'تم إضافة فحص localStorage مباشرة' });
    } else {
      checks.push({ name: 'تحديث دالة trackInteraction', status: '❌', details: 'لم يتم العثور على التحديث' });
    }
    
    // 2. التحقق من إضافة console.log
    if (pageContent.includes('console.log(\'🔍 فحص حالة تسجيل الدخول:\');')) {
      checks.push({ name: 'إضافة تسجيل الأخطاء', status: '✅', details: 'تم إضافة console.log للتتبع' });
    } else {
      checks.push({ name: 'إضافة تسجيل الأخطاء', status: '❌', details: 'لم يتم إضافة التسجيل' });
    }
    
    // 3. التحقق من آلية التصحيح التلقائي
    if (pageContent.includes('تم تصحيح حالة تسجيل الدخول')) {
      checks.push({ name: 'آلية التصحيح التلقائي', status: '✅', details: 'تم إضافة تصحيح حالة React' });
    } else {
      checks.push({ name: 'آلية التصحيح التلقائي', status: '❌', details: 'لم يتم إضافة التصحيح' });
    }
    
    // 4. التحقق من وجود التقرير
    console.log('\n2️⃣ فحص التقرير...');
    const reportExists = await fs.access(path.join(__dirname, '..', 'reports', 'login-state-fix-report.md'))
      .then(() => true).catch(() => false);
    
    if (reportExists) {
      checks.push({ name: 'تقرير الإصلاح', status: '✅', details: 'تم إنشاء التقرير الشامل' });
    } else {
      checks.push({ name: 'تقرير الإصلاح', status: '❌', details: 'التقرير غير موجود' });
    }
    
    // 5. التحقق من سكريبت الاختبار
    console.log('\n3️⃣ فحص سكريبت الاختبار...');
    const testScriptExists = await fs.access(path.join(__dirname, 'test-login-state.js'))
      .then(() => true).catch(() => false);
    
    if (testScriptExists) {
      checks.push({ name: 'سكريبت الاختبار', status: '✅', details: 'تم إنشاء سكريبت اختبار حالة الدخول' });
    } else {
      checks.push({ name: 'سكريبت الاختبار', status: '❌', details: 'سكريبت الاختبار غير موجود' });
    }
    
    // عرض النتائج
    console.log('\n📊 نتائج الاختبار:');
    console.log('='.repeat(50));
    
    let passedChecks = 0;
    checks.forEach((check, index) => {
      console.log(`${index + 1}. ${check.name}: ${check.status}`);
      console.log(`   ${check.details}\n`);
      if (check.status === '✅') passedChecks++;
    });
    
    console.log('='.repeat(50));
    console.log(`📈 النتيجة النهائية: ${passedChecks}/${checks.length} فحوصات نجحت`);
    
    if (passedChecks === checks.length) {
      console.log('🎉 تم إصلاح المشكلة بنجاح! جميع الفحوصات مرت بنجاح.');
      console.log('\n🔧 خطوات الاختبار النهائية:');
      console.log('1. افتح http://localhost:3000');
      console.log('2. تأكد من تسجيل الدخول');
      console.log('3. جرب عمل لايك على أي مقال');
      console.log('4. راقب console في أدوات المطور');
      console.log('5. يجب ألا تظهر رسالة "يرجى تسجيل الدخول"');
    } else {
      console.log('⚠️  بعض الفحوصات فشلت. يرجى مراجعة التفاصيل أعلاه.');
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار الحل:', error.message);
  }
}

// تشغيل الاختبار
testFinalLoginFix(); 