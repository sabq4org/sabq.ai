const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// قراءة الملف الحالي
const usersFile = path.join(process.cwd(), 'data', 'users.json');
const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

// إضافة مستخدم جديد
const hashedPassword = bcrypt.hashSync('password123', 10);
const newUser = {
  id: 'user-admin-Ali',
  name: 'علي الحازمي',
  email: 'Ali@alhazmi.org',
  password: hashedPassword,
  role: 'مدير النظام',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// إضافة المستخدم إذا لم يكن موجوداً
if (!data.users.find(u => u.email === 'Ali@alhazmi.org')) {
  data.users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(data, null, 2));
  console.log('تم إضافة المستخدم بنجاح');
  console.log('البريد الإلكتروني: Ali@alhazmi.org');
  console.log('كلمة المرور: password123');
} else {
  console.log('المستخدم موجود بالفعل');
} 