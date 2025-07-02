const fs = require('fs').promises;
const path = require('path');

async function testAvatarFix() {
  console.log('🧪 اختبار إصلاح مشكلة الصورة الشخصية...\n');

  try {
    // فحص ملف المستخدمين
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const usersObj = JSON.parse(usersData);
    const users = usersObj.users || usersObj;

    console.log(`📊 عدد المستخدمين: ${users.length}`);

    // فحص المستخدمين الذين لديهم صور شخصية
    const usersWithAvatars = users.filter(user => user.avatar);
    console.log(`🖼️ مستخدمون لديهم صور شخصية: ${usersWithAvatars.length}`);

    if (usersWithAvatars.length > 0) {
      console.log('📋 تفاصيل الصور الشخصية:');
      usersWithAvatars.forEach(user => {
        console.log(`   - ${user.name}: ${user.avatar}`);
      });
    }

    // فحص مجلد الصور
    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    
    try {
      const avatarFiles = await fs.readdir(avatarsDir);
      console.log(`📁 عدد الملفات في مجلد الصور: ${avatarFiles.length}`);
      
      if (avatarFiles.length > 0) {
        console.log('📋 الملفات الموجودة:');
        avatarFiles.forEach(file => {
          console.log(`   - ${file}`);
        });
      }
    } catch (error) {
      console.log('⚠️ مجلد الصور غير موجود، سيتم إنشاؤه...');
      await fs.mkdir(avatarsDir, { recursive: true });
      console.log('✅ تم إنشاء مجلد الصور');
    }

    console.log('\n✅ تم الانتهاء من الفحص بنجاح!');
    console.log('\n🎯 خطوات الاختبار اليدوي:');
    console.log('1. سجل دخول أي مستخدم موجود');
    console.log('2. اذهب إلى صفحة الملف الشخصي (/profile)');
    console.log('3. انقر على الصورة الشخصية لرفع صورة جديدة');
    console.log('4. تحقق من ظهور الصورة في الملف الشخصي والهيدر');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

testAvatarFix().catch(console.error);
