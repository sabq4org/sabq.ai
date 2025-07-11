import { Metadata } from 'next';
import AnalyticsDashboard from '../../../../components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'لوحة التحليلات الذكية - سبق الذكي',
  description: 'لوحة تحكم شاملة لمراقبة وتحليل أداء المحتوى والمستخدمين'
};

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  لوحة التحليلات الذكية
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  مراقبة وتحليل شامل لأداء المحتوى وسلوك المستخدمين
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  📊 عرض تقارير متقدمة
                </button>
                <button
                  type="button"
                  className="mr-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  📈 إنشاء تقرير مخصص
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnalyticsDashboard 
          initialPeriod="30d"
          showExportOptions={true}
        />
      </div>

      {/* Quick Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      إجمالي الزيارات اليوم
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      --
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/analytics/realtime" className="font-medium text-blue-600 hover:text-blue-500">
                  عرض البيانات المباشرة
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">👥</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      المستخدمون النشطون
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      --
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/users" className="font-medium text-green-600 hover:text-green-500">
                  إدارة المستخدمين
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      المقالات المنشورة
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      --
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/articles" className="font-medium text-yellow-600 hover:text-yellow-500">
                  إدارة المقالات
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      معدل التفاعل
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      --%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/admin/analytics/engagement" className="font-medium text-red-600 hover:text-red-500">
                  تحليل التفاعل
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 