const fs = require('fs');
const path = require('path');

// مجلدات الرفع المطلوبة
const uploadDirs = [
  'public/uploads',
  'public/uploads/avatars',
  'public/uploads/featured',
  'public/uploads/articles'
];

console.log('🔧 إصلاح أذونات مجلدات الرفع...\n');

// إنشاء المجلدات إذا لم تكن موجودة
uploadDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  
  try {
    // إنشاء المجلد
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ تم إنشاء/التحقق من: ${dir}`);
    
    // التحقق من القدرة على الكتابة
    const testFile = path.join(fullPath, '.test');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`✅ أذونات الكتابة متاحة لـ: ${dir}`);
    } catch (writeError) {
      console.error(`❌ لا يمكن الكتابة في: ${dir}`);
      console.error(`   الخطأ: ${writeError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ خطأ في إنشاء: ${dir}`);
    console.error(`   الخطأ: ${error.message}`);
  }
  
  console.log('');
});

// إضافة ملف .gitkeep للحفاظ على المجلدات في Git
console.log('📝 إضافة ملفات .gitkeep...\n');

uploadDirs.forEach(dir => {
  const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
  
  try {
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
      console.log(`✅ تم إضافة .gitkeep في: ${dir}`);
    } else {
      console.log(`✔️  .gitkeep موجود بالفعل في: ${dir}`);
    }
  } catch (error) {
    console.error(`❌ خطأ في إضافة .gitkeep في: ${dir}`);
    console.error(`   الخطأ: ${error.message}`);
  }
});

console.log('\n✨ تم الانتهاء من إصلاح أذونات المجلدات!');
console.log('\n📌 ملاحظات مهمة:');
console.log('1. تأكد من أن المجلدات لديها أذونات 755 على السيرفر');
console.log('2. في بيئة الإنتاج، قد تحتاج لتشغيل: chmod -R 755 public/uploads');
console.log('3. تأكد من أن المستخدم الذي يشغل Node.js لديه أذونات الكتابة'); 