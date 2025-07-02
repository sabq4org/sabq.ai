const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // قراءة ملف المستخدمين
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
    const fileContents = await fs.readFile(usersFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // التحقق من وجود المستخدم
    const existingUser = data.users.find(u => u.email === 'test@example.com');
    if (existingUser) {
      console.log('✅ المستخدم موجود بالفعل:', existingUser.email);
      console.log('معرف المستخدم:', existingUser.id);
      return;
    }
    
    // إنشاء مستخدم جديد
    const hashedPassword = await bcrypt.hash('password123', 10);
    const newUser = {
      id: 'fb891596-5b72-47ab-8a13-39e0647108ed', // نفس المعرف في قاعدة البيانات
      name: 'مستخدم تجريبي',
      email: 'test@example.com',
      password: hashedPassword,
      email_verified: true,
      isVerified: true,
      status: 'active',
      role: 'editor',
      loyaltyPoints: 164,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // إضافة المستخدم
    data.users.push(newUser);
    
    // حفظ الملف
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));
    
    console.log('✅ تم إنشاء المستخدم التجريبي بنجاح');
    console.log('البريد الإلكتروني: test@example.com');
    console.log('كلمة المرور: password123');
    console.log('معرف المستخدم:', newUser.id);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

createTestUser(); 