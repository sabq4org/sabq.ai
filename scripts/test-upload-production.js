const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// إعدادات الاختبار
const PRODUCTION_URL = 'https://jur3a.ai';
const TEST_IMAGE_PATH = path.join(__dirname, '..', 'public', 'test-image.jpg');

// إنشاء صورة اختبار إذا لم تكن موجودة
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('📸 إنشاء صورة اختبار...');
    
    // إنشاء صورة SVG بسيطة
    const svgContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#3b82f6"/>
      <text x="200" y="150" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        صورة اختبار - ${new Date().toISOString()}
      </text>
    </svg>`;
    
    // حفظ كملف SVG مؤقت
    const svgPath = TEST_IMAGE_PATH.replace('.jpg', '.svg');
    fs.writeFileSync(svgPath, svgContent);
    
    console.log('✅ تم إنشاء صورة الاختبار');
    return svgPath;
  }
  
  return TEST_IMAGE_PATH;
}

// اختبار رفع الصورة
async function testUpload() {
  console.log('🚀 بدء اختبار رفع الصور في بيئة الإنتاج\n');
  console.log(`📍 الموقع: ${PRODUCTION_URL}`);
  console.log(`🔗 API Endpoint: ${PRODUCTION_URL}/api/upload\n`);
  
  try {
    // إنشاء صورة الاختبار
    const imagePath = createTestImage();
    
    // إنشاء FormData
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('type', 'featured');
    
    console.log('📤 إرسال الصورة...\n');
    
    // إرسال الطلب
    const response = await fetch(`${PRODUCTION_URL}/api/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const responseText = await response.text();
    
    console.log(`📊 حالة الاستجابة: ${response.status} ${response.statusText}`);
    console.log('📋 رؤوس الاستجابة:');
    console.log(JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log('\n📄 محتوى الاستجابة:');
    
    try {
      const data = JSON.parse(responseText);
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('\n✅ نجح رفع الصورة!');
        console.log(`🔗 رابط الصورة: ${PRODUCTION_URL}${data.data.url}`);
      } else {
        console.log('\n❌ فشل رفع الصورة:', data.error);
      }
    } catch (e) {
      console.log(responseText);
      console.log('\n⚠️  الاستجابة ليست JSON صالح');
    }
    
  } catch (error) {
    console.error('\n💥 خطأ في الاختبار:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n📌 تلميحات:');
      console.log('1. تأكد من أن الموقع يعمل على الإنترنت');
      console.log('2. تحقق من أن HTTPS يعمل بشكل صحيح');
      console.log('3. تأكد من عدم وجود جدار ناري يحجب الاتصال');
    }
  }
  
  // تنظيف
  if (fs.existsSync(TEST_IMAGE_PATH.replace('.jpg', '.svg'))) {
    fs.unlinkSync(TEST_IMAGE_PATH.replace('.jpg', '.svg'));
  }
}

// تثبيت form-data إذا لم يكن موجوداً
try {
  require('form-data');
} catch (e) {
  console.log('📦 تثبيت form-data...');
  require('child_process').execSync('npm install form-data', { stdio: 'inherit' });
}

// تشغيل الاختبار
testUpload(); 