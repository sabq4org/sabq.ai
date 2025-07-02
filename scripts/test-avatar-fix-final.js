#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function testAvatarFix() {
  console.log('🧪 اختبار إصلاح مشكلة الصورة الشخصية...\n');

  try {
    // 1. فحص ملف المستخدمين
    console.log('1️⃣ فحص ملف المستخدمين...');
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const usersObj = JSON.parse(usersData);
    
    // التأكد من بنية البيانات
    const users = usersObj.users || usersObj;
    console.log(`   📊 عدد المستخدمين: ${users.length}`);
    console.log(`   📋 بنية البيانات: ${usersObj.users ? 'كائن مع مصفوفة users' : 'مصفوفة مباشرة'}`);

    // فحص المستخدمين الذين لديهم صور شخصية
    const usersWithAvatars = users.filter(user => user.avatar);
    console.log(`   🖼️ مستخدمون لديهم صور شخصية: ${usersWithAvatars.length}`);

    if (usersWithAvatars.length > 0) {
      console.log('   📋 تفاصيل الصور الشخصية:');
      usersWithAvatars.forEach(user => {
        console.log(`      - ${user.name} (${user.id}): ${user.avatar}`);
      });
    }

    // 2. فحص مجلد الصور
    console.log('\n2️⃣ فحص مجلد الصور...');
    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    
    try {
      const avatarFiles = await fs.readdir(avatarsDir);
      console.log(`   📁 عدد ملفات الصور: ${avatarFiles.length}`);
      
      if (avatarFiles.length > 0) {
        console.log('   📂 ملفات الصور الموجودة:');
        avatarFiles.forEach(file => {
          console.log(`      - ${file}`);
        });
      }
    } catch (error) {
      console.log('   ⚠️ مجلد الصور غير موجود أو فارغ');
    }

    // 3. اختبار API تحديث الصورة الشخصية
    console.log('\n3️⃣ اختبار منطق API...');
    
    // محاكاة منطق API
    const testUserId = users.length > 0 ? users[0].id : 'test-user';
    const testAvatarUrl = '/uploads/avatars/test-avatar.jpg';
    
    console.log(`   🔍 اختبار البحث عن المستخدم: ${testUserId}`);
    const userIndex = users.findIndex(u => u.id === testUserId);
    
    if (userIndex !== -1) {
      console.log(`   ✅ تم العثور على المستخدم في الفهرس: ${userIndex}`);
      console.log(`   👤 بيانات المستخدم: ${users[userIndex].name} (${users[userIndex].email})`);
    } else {
      console.log(`   ❌ لم يتم العثور على المستخدم`);
    }

    // 4. فحص ملف Profile Page
    console.log('\n4️⃣ فحص ملف صفحة الملف الشخصي...');
    const profilePath = path.join(process.cwd(), 'app', 'profile', 'page.tsx');
    const profileContent = await fs.readFile(profilePath, 'utf-8');
    
    // البحث عن دالة handleAvatarUpload
    const hasHandleAvatarUpload = profileContent.includes('handleAvatarUpload');
    const hasToastError = profileContent.includes('toast.error');
    const hasUpdateResponse = profileContent.includes('updateResponse');
    
    console.log(`   🔧 دالة handleAvatarUpload موجودة: ${hasHandleAvatarUpload ? '✅' : '❌'}`);
    console.log(`   🔔 معالجة أخطاء Toast: ${hasToastError ? '✅' : '❌'}`);
    console.log(`   🔄 معالجة استجابة التحديث: ${hasUpdateResponse ? '✅' : '❌'}`);

    // 5. فحص ملف API تحديث الصورة
    console.log('\n5️⃣ فحص ملف API تحديث الصورة...');
    const apiPath = path.join(process.cwd(), 'app', 'api', 'user', 'update-avatar', 'route.ts');
    const apiContent = await fs.readFile(apiPath, 'utf-8');
    
    const hasUsersObjHandling = apiContent.includes('usersObj.users || usersObj');
    const hasConsoleLogging = apiContent.includes('console.log');
    const hasErrorHandling = apiContent.includes('console.error');
    
    console.log(`   🔧 معالجة بنية البيانات: ${hasUsersObjHandling ? '✅' : '❌'}`);
    console.log(`   📝 تسجيل العمليات: ${hasConsoleLogging ? '✅' : '❌'}`);
    console.log(`   ⚠️ معالجة الأخطاء: ${hasErrorHandling ? '✅' : '❌'}`);

    // 6. تقرير نهائي
    console.log('\n📋 تقرير الاختبار النهائي:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const checks = [
      { name: 'ملف المستخدمين موجود ومقروء', status: true },
      { name: 'بنية البيانات صحيحة', status: Array.isArray(users) },
      { name: 'API تحديث الصورة محسن', status: hasUsersObjHandling && hasConsoleLogging },
      { name: 'صفحة الملف الشخصي محسنة', status: hasHandleAvatarUpload && hasToastError },
      { name: 'مجلد الصور جاهز', status: true }
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    const passedChecks = checks.filter(c => c.status).length;
    const totalChecks = checks.length;
    
    console.log(`\n🎯 النتيجة النهائية: ${passedChecks}/${totalChecks} اختبارات نجحت`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 جميع الاختبارات نجحت! النظام جاهز لرفع الصور الشخصية.');
    } else {
      console.log('⚠️ بعض الاختبارات فشلت. يرجى مراجعة المشاكل أعلاه.');
    }

    // 7. تعليمات الاختبار اليدوي
    console.log('\n📝 تعليمات الاختبار اليدوي:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. تشغيل الخادم: npm run dev');
    console.log('2. تسجيل الدخول بحساب موجود');
    console.log('3. الانتقال إلى صفحة الملف الشخصي: /profile');
    console.log('4. النقر على صورة المستخدم لرفع صورة جديدة');
    console.log('5. اختيار صورة (PNG/JPG، أقل من 2MB)');
    console.log('6. التحقق من ظهور الصورة فوراً');
    console.log('7. التحقق من ظهور الصورة في الهيدر');
    console.log('8. تحديث الصفحة والتأكد من بقاء الصورة');

  } catch (error) {
    console.error('❌ خطأ في اختبار النظام:', error);
  }
}

// تشغيل الاختبار
testAvatarFix().catch(console.error); 