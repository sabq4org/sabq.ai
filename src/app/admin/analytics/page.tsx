import { Metadata } from 'next';
import AnalyticsDashboard from '../../../../components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
  title: 'لوحة التحليلات - سبق الذكي',
  description: 'لوحة تحكم شاملة لتحليلات الموقع وسلوك المستخدمين',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          لوحة التحليلات
        </h1>
        <p className="text-gray-600">
          تحليلات شاملة لسلوك المستخدمين وأداء المحتوى
        </p>
      </div>
      
      <AnalyticsDashboard />
    </div>
  );
} 