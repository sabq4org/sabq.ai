// سكريبت لاختبار أزرار التحليل العميق
// انسخ والصق هذا في Console للتحقق من الأزرار

console.log('=== اختبار أزرار التحليل العميق ===');

// البحث عن جميع أزرار الإعجاب
const likeButtons = document.querySelectorAll('[id^="like-btn-"]');
console.log(`عدد أزرار الإعجاب الموجودة: ${likeButtons.length}`);

if (likeButtons.length > 0) {
  console.log('أزرار الإعجاب الموجودة:');
  likeButtons.forEach((btn, index) => {
    console.log(`  ${index + 1}. ${btn.id}`);
    
    // التحقق من وجود onclick handler
    const hasOnClick = btn.onclick !== null || btn.hasAttribute('onclick');
    const hasEventListeners = typeof btn.__reactInternalInstance !== 'undefined' || 
                            typeof btn._reactInternalFiber !== 'undefined' ||
                            typeof btn.__reactFiber !== 'undefined';
    
    console.log(`     - Has onClick: ${hasOnClick}`);
    console.log(`     - Has React handlers: ${hasEventListeners}`);
  });
  
  // محاولة النقر على أول زر
  console.log('\nمحاولة النقر على أول زر إعجاب...');
  const firstButton = likeButtons[0];
  if (firstButton) {
    console.log(`النقر على: ${firstButton.id}`);
    firstButton.click();
  }
} else {
  console.log('❌ لم يتم العثور على أي أزرار إعجاب!');
  console.log('تحقق من أن قسم التحليل العميق موجود في الصفحة.');
}

// التحقق من وجود قسم التحليل العميق
const deepAnalysisSection = document.getElementById('deep-analysis-highlight');
if (deepAnalysisSection) {
  console.log('✅ قسم التحليل العميق موجود');
} else {
  console.log('❌ قسم التحليل العميق غير موجود!');
}

// التحقق من localStorage
console.log('\n=== حالة localStorage ===');
console.log('userId:', localStorage.getItem('userId'));
console.log('sabq_reactions:', localStorage.getItem('sabq_reactions'));

// التحقق من وجود React في الصفحة
console.log('\n=== React Debug ===');
console.log('React موجود:', typeof React !== 'undefined');
console.log('ReactDOM موجود:', typeof ReactDOM !== 'undefined'); 