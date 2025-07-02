export default function TestPage() {
  return (
    <div className="min-h-screen bg-soft-cream dark:bg-soft-dark-cream p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-gray-100">
          صفحة اختبار الألوان الناعمة
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-soft-white dark:bg-soft-dark-white p-6 rounded-lg shadow-soft">
            <h2 className="text-2xl font-semibold mb-4">بطاقة اختبار</h2>
            <p className="text-gray-600 dark:text-gray-400">
              هذا نص تجريبي لاختبار الألوان الناعمة الجديدة. 
              الخلفية الآن أكثر راحة للعين من الأبيض الفاقع.
            </p>
          </div>
          
          <div className="bg-soft-gray dark:bg-soft-dark-gray p-6 rounded-lg shadow-medium">
            <h2 className="text-2xl font-semibold mb-4">بطاقة أخرى</h2>
            <p className="text-gray-600 dark:text-gray-400">
              خلفية رمادية ناعمة ودافئة تخفف من إجهاد العين.
            </p>
          </div>
          
          <div className="bg-soft-beige dark:bg-soft-dark-beige p-6 rounded-lg shadow-large">
            <h2 className="text-2xl font-semibold mb-4">بطاقة بيج</h2>
            <p className="text-gray-600 dark:text-gray-400">
              لون بيج فاتح مريح للقراءة الطويلة.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">بطاقة عادية</h2>
            <p className="text-gray-600 dark:text-gray-400">
              هذه بطاقة بالألوان العادية للمقارنة.
            </p>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gradient-to-r from-soft-cream to-soft-white dark:from-soft-dark-cream dark:to-soft-dark-white rounded-lg">
          <h3 className="text-xl font-semibold mb-2">تدرج لوني ناعم</h3>
          <p className="text-gray-700 dark:text-gray-300">
            تدرجات لونية خفيفة تضيف عمقاً بدون إزعاج بصري.
          </p>
        </div>
      </div>
    </div>
  );
} 