import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">سبق الذكي</h3>
            <p className="text-gray-400 text-sm">
              نظام إدارة محتوى ذكي مع دعم الذكاء الاصطناعي
              لتحسين تجربة إنشاء ونشر المحتوى الرقمي
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="text-gray-400 hover:text-white">لوحة التحكم</Link></li>
              <li><Link href="/dashboard/articles" className="text-gray-400 hover:text-white">المقالات</Link></li>
              <li><Link href="/dashboard/analytics" className="text-gray-400 hover:text-white">التحليلات</Link></li>
              <li><Link href="/docs" className="text-gray-400 hover:text-white">التوثيق</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">الميزات</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">الذكاء الاصطناعي</li>
              <li className="text-gray-400">التحليلات المتقدمة</li>
              <li className="text-gray-400">التوصيات الذكية</li>
              <li className="text-gray-400">إدارة المحتوى</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">support@sabq-ai.com</li>
              <li className="text-gray-400">+966 XX XXX XXXX</li>
              <li className="text-gray-400">الرياض، المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 سبق الذكي. جميع الحقوق محفوظة. تم التطوير بواسطة علي الحازمي
          </p>
        </div>
      </div>
    </footer>
  )
} 