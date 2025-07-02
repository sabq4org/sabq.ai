const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// قراءة الملف الحالي
const usersFile = path.join(__dirname, 'data', 'users.json');
const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

// إنشاء كلمة مرور مشفرة
const hashedPassword = bcrypt.hashSync('123456', 10);

// إضافة مستخدم اختبار
const testUser = {
  id: 'test-user-simple',
  name: 'مستخدم اختبار',
  email: 'test@test.com',
  password: hashedPassword,
  role: 'مدير النظام',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// إضافة المستخدم إذا لم يكن موجوداً
if (!data.users.find(u => u.email === 'test@test.com')) {
  data.users.push(testUser);
  fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));
  console.log('✅ تم إضافة مستخدم الاختبار بنجاح');
  console.log('📧 البريد الإلكتروني: test@test.com');
  console.log('🔑 كلمة المرور: 123456');
} else {
  console.log('ℹ️ المستخدم موجود بالفعل');
}

// عرض جميع المستخدمين
console.log('\n📋 جميع المستخدمين المسجلين:');
data.users.forEach(user => {
  console.log(`- ${user.email} (${user.name})`);
}); 