// سكريبت لإعداد localStorage للمستخدم التجريبي
// يُنفذ في console المتصفح

const setupTestUser = () => {
  // بيانات المستخدم التجريبي
  const userData = {
    id: 'fb891596-5b72-47ab-8a13-39e0647108ed',
    name: 'مستخدم تجريبي',
    email: 'test@example.com',
    role: 'editor',
    isVerified: true,
    loyaltyPoints: 164,
    interests: ['تقنية', 'محليات', 'منوعات']
  };
  
  // حفظ البيانات في localStorage
  localStorage.setItem('user_id', userData.id);
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('currentUser', JSON.stringify(userData));
  localStorage.setItem('user_loyalty_points', '164');
  
  console.log('✅ تم إعداد بيانات المستخدم في localStorage');
  console.log('البيانات المحفوظة:');
  console.log('- user_id:', userData.id);
  console.log('- email:', userData.email);
  console.log('- loyaltyPoints:', userData.loyaltyPoints);
  console.log('- interests:', userData.interests);
  
  // إعادة تحميل الصفحة لتطبيق التغييرات
  console.log('🔄 سيتم إعادة تحميل الصفحة خلال 2 ثانية...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// تنفيذ الدالة
setupTestUser(); 