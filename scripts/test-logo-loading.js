const fs = require('fs');
const path = require('path');

async function testLogoLoading() {
  console.log('🔍 اختبار تحميل اللوقو...\n');

  try {
    // 1. التحقق من وجود الصورة في النظام
    const logoPath = path.join(__dirname, '../public/uploads/logos/1750251843592-o8l84n.png');
    const logoExists = fs.existsSync(logoPath);
    console.log(`📁 وجود الصورة في النظام: ${logoExists ? '✅' : '❌'}`);
    
    if (logoExists) {
      const stats = fs.statSync(logoPath);
      console.log(`📊 حجم الصورة: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    // 2. اختبار API للقالب النشط
    console.log('\n🌐 اختبار API للقالب النشط...');
    const response = await fetch('http://localhost:3000/api/templates/active-header');
    
    if (response.ok) {
      const template = await response.json();
      console.log('✅ API يعمل بنجاح');
      console.log(`🔗 مسار اللوقو: ${template.logo_url || 'غير محدد'}`);
      console.log(`📝 نص بديل: ${template.logo_alt || 'غير محدد'}`);
      console.log(`🎨 اللون الأساسي: ${template.primary_color || 'غير محدد'}`);
    } else {
      console.log(`❌ فشل API: ${response.status}`);
    }

    // 3. اختبار الوصول المباشر للصورة
    console.log('\n🖼️ اختبار الوصول المباشر للصورة...');
    const imageResponse = await fetch('http://localhost:3000/uploads/logos/1750251843592-o8l84n.png');
    
    if (imageResponse.ok) {
      console.log('✅ الصورة متاحة عبر الخادم');
      console.log(`📏 نوع المحتوى: ${imageResponse.headers.get('content-type')}`);
      console.log(`📐 حجم الاستجابة: ${imageResponse.headers.get('content-length')} bytes`);
    } else {
      console.log(`❌ فشل الوصول للصورة: ${imageResponse.status}`);
    }

    // 4. اختبار الصفحة الرئيسية
    console.log('\n🏠 اختبار الصفحة الرئيسية...');
    const pageResponse = await fetch('http://localhost:3000/');
    
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      const hasLogo = html.includes('1750251843592-o8l84n.png');
      console.log(`✅ الصفحة الرئيسية تعمل`);
      console.log(`🖼️ اللوقو في HTML: ${hasLogo ? '✅ موجود' : '❌ غير موجود'}`);
      
      // البحث عن SabqLogo كبديل
      const hasSabqLogo = html.includes('SabqLogo') || html.includes('text-xl font-bold text-blue-600');
      console.log(`🔤 لوقو سبق النصي: ${hasSabqLogo ? '✅ موجود' : '❌ غير موجود'}`);
    } else {
      console.log(`❌ فشل تحميل الصفحة الرئيسية: ${pageResponse.status}`);
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }

  console.log('\n🎯 نصائح لحل المشاكل:');
  console.log('1. تأكد من أن الخادم يعمل على المنفذ 3000');
  console.log('2. افتح Developer Tools في المتصفح وتحقق من Console');
  console.log('3. تأكد من أن مسار الصورة صحيح في templates.json');
  console.log('4. جرب تحديث الصفحة (Ctrl+F5) لمسح cache المتصفح');
}

// تشغيل الاختبار
testLogoLoading().catch(console.error); 