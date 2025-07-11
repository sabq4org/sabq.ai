import { Metadata } from 'next';
import SessionDurationChart from '../../../../components/analytics/SessionDurationChart';
import UserJourneysChart from '../../../../components/analytics/UserJourneysChart';

export const metadata: Metadata = {
  title: 'التقارير المتقدمة - سبق الذكي',
  description: 'تقارير متقدمة لتحليل أعمار الجلسة ومسارات المستخدم',
};

export default function AdvancedAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          التقارير المتقدمة
        </h1>
        <p className="text-gray-600">
          تحليلات متقدمة لأعمار الجلسة ومسارات المستخدم وسلوك التصفح
        </p>
      </div>

      <div className="space-y-12">
        {/* Session Duration Analysis */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              تحليل أعمار الجلسة
            </h2>
            <p className="text-gray-600">
              توزيع فترات الجلسات وتحليل السلوك حسب الجهاز والمتصفح
            </p>
          </div>
          <SessionDurationChart />
        </section>

        {/* User Journeys Analysis */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              تحليل مسارات المستخدم
            </h2>
            <p className="text-gray-600">
              أكثر المسارات شيوعاً ونقاط الدخول والخروج الرئيسية
            </p>
          </div>
          <UserJourneysChart />
        </section>

        {/* Additional Insights */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            رؤى إضافية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">تحسين المحتوى</h3>
              <p className="text-sm text-gray-600">
                استخدم تحليل مسارات المستخدم لتحديد المحتوى الأكثر جاذبية وتحسين تجربة المستخدم
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">تحسين الأداء</h3>
              <p className="text-sm text-gray-600">
                راقب أعمار الجلسة لتحديد المشاكل التقنية وتحسين سرعة التحميل
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">استراتيجية المحتوى</h3>
              <p className="text-sm text-gray-600">
                حلل نقاط الدخول والخروج لتطوير استراتيجية محتوى أكثر فعالية
              </p>
            </div>
          </div>
        </section>

        {/* Export Options */}
        <section className="border-t pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            تصدير البيانات
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              تصدير تحليل الجلسات (CSV)
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              تصدير مسارات المستخدم (JSON)
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              تقرير شامل (PDF)
            </button>
          </div>
        </section>
      </div>
    </div>
  );
} 