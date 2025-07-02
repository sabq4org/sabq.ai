'use client';

import { useEffect, useState } from 'react';

export default function TestCategoriesAPI() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        
        console.log('Full response:', result);
        setData(result);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">جاري التحميل...</div>;
  if (error) return <div className="p-8 text-red-600">خطأ: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">اختبار API التصنيفات</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
} 