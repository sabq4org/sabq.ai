#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

async function testAvatarUploadFix() {
  console.log("🧪 اختبار إصلاح مشكلة الصورة الشخصية...
");

  try {
    // 1. فحص ملف users.json
    console.log("1️⃣ فحص ملف المستخدمين...");
    const usersPath = path.join(process.cwd(), "data", "users.json");
    const usersData = await fs.readFile(usersPath, "utf-8");
    const usersObj = JSON.parse(usersData);
    const users = usersObj.users || usersObj;

    console.log(`   📊 عدد المستخدمين: ${users.length}`);

    // فحص المستخدمين الذين لديهم صور شخصية
    const usersWithAvatars = users.filter(user => user.avatar);
    console.log(`   🖼️ مستخدمون لديهم صور شخصية: ${usersWithAvatars.length}`);

    if (usersWithAvatars.length > 0) {
      console.log("   📋 تفاصيل الصور الشخصية:");
      usersWithAvatars.forEach(user => {
        console.log(`      - ${user.name}: ${user.avatar}`);
      });
    }

    // 2. فحص مجلد الصور
    console.log("
2️⃣ فحص مجلد الصور الشخصية...");
    const avatarsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    
    try {
      const avatarFiles = await fs.readdir(avatarsDir);
      console.log(`   📁 عدد الملفات في مجلد الصور: ${avatarFiles.length}`);
      
      if (avatarFiles.length > 0) {
        console.log("   📋 الملفات الموجودة:");
        avatarFiles.forEach(file => {
          console.log(`      - ${file}`);
        });
      }
    } catch (error) {
      console.log(`   ⚠️ مجلد الصور غير موجود`);
      console.log("   📁 إنشاء مجلد الصور...");
      await fs.mkdir(avatarsDir, { recursive: true });
      console.log("   ✅ تم إنشاء مجلد الصور");
    }

    console.log("
✅ تم الانتهاء من الاختبار بنجاح!");

  } catch (error) {
    console.error("❌ خطأ في الاختبار:", error);
  }
}

testAvatarUploadFix().catch(console.error);
