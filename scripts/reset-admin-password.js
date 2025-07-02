const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    // قراءة ملف المستخدمين
    const usersFilePath = path.join(__dirname, '../data/users.json');
    const fileContent = await fs.readFile(usersFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // البحث عن المدير
    const adminIndex = data.users.findIndex(u => u.email === 'ali@alhazm.org');
    
    if (adminIndex === -1) {
      console.error('❌ لم يتم العثور على المدير');
      return;
    }
    
    // تشفير كلمة المرور الجديدة
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // تحديث كلمة المرور
    data.users[adminIndex].password = hashedPassword;
    
    // حفظ الملف
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));
    
    console.log('✅ تم تحديث كلمة مرور المدير بنجاح!');
    console.log('📧 البريد الإلكتروني: ali@alhazm.org');
    console.log('🔑 كلمة المرور الجديدة: 123456');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

resetAdminPassword(); 