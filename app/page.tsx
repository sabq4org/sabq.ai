import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          مرحباً بك في نظام سبق الذكي
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          نظام إدارة محتوى ذكي مع دعم الذكاء الاصطناعي
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">📝 إدارة المقالات</h3>
            <p className="text-gray-600 mb-4">إنشاء وتحرير ونشر المقالات بسهولة</p>
            <Link href="/dashboard/articles" className="text-blue-600 hover:underline">
              بدء العمل
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">🤖 الذكاء الاصطناعي</h3>
            <p className="text-gray-600 mb-4">تحليل المحتوى والتوصيات الذكية</p>
            <Link href="/dashboard/ai" className="text-blue-600 hover:underline">
              استكشاف الميزات
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">📊 التحليلات</h3>
            <p className="text-gray-600 mb-4">إحصائيات وتحليلات متقدمة</p>
            <Link href="/dashboard/analytics" className="text-blue-600 hover:underline">
              عرض البيانات
            </Link>
          </div>
        </div>
        
        <div className="mt-12">
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            دخول لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  )
} 