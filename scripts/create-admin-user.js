const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// قراءة ملف المستخدمين
const usersPath = path.join(__dirname, '../data/users.json');
let users = [];

try {
  const data = fs.readFileSync(usersPath, 'utf8');
  users = JSON.parse(data);
} catch (error) {
  console.log('لا يوجد ملف مستخدمين، سيتم إنشاء واحد جديد');
}

// بيانات المدير الافتراضية
const adminEmail = 'admin@sabq.ai';
const adminPassword = 'Admin@123456';
const hashedPassword = bcrypt.hashSync(adminPassword, 10);

// إنشاء مستخدم مدير
const adminUser = {
  id: `user-${Date.now()}-admin`,
  name: 'مدير النظام',
  email: adminEmail,
  password: hashedPassword,
  role: 'admin',
  permissions: [
    'manage_articles',
    'manage_users',
    'manage_categories',
    'manage_templates',
    'manage_blocks',
    'manage_roles',
    'view_analytics',
    'manage_system'
  ],
  avatar: '/default-avatar.png',
  bio: 'مدير نظام سبق الذكي',
  isVerified: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLogin: null,
  preferences: {
    language: 'ar',
    theme: 'light',
    notifications: {
      email: true,
      browser: true,
      mobile: false
    },
    categories: [],
    interests: []
  }
};

// التحقق من عدم وجود المستخدم مسبقاً
const existingUser = users.find(u => u.email === adminEmail);
if (existingUser) {
  console.log('❌ المستخدم موجود بالفعل!');
  console.log('📧 البريد الإلكتروني:', adminEmail);
  console.log('🔑 كلمة المرور:', adminPassword);
} else {
  // إضافة المستخدم الجديد
  users.push(adminUser);
  
  // حفظ الملف
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  
  console.log('✅ تم إنشاء مستخدم المدير بنجاح!');
  console.log('📧 البريد الإلكتروني:', adminEmail);
  console.log('🔑 كلمة المرور:', adminPassword);
  console.log('🔗 رابط تسجيل الدخول: http://localhost:3000/login');
} 