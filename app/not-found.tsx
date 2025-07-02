import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <div className="h-1 w-24 bg-primary mx-auto mt-4 rounded-full"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          الصفحة غير موجودة
        </h2>
        
        <p className="text-gray-600 mb-8">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. 
          قد تكون الصفحة قد تم نقلها أو حذفها.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="btn-primary inline-flex items-center justify-center"
          >
            العودة للوحة التحكم
          </Link>
          
          <Link 
            href="/"
            className="btn-secondary inline-flex items-center justify-center"
          >
            الصفحة الرئيسية
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني
          </p>
        </div>
      </div>
    </div>
  )
} 