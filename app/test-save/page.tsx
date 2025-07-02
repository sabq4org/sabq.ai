'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Eye, User } from 'lucide-react';
import { getValidImageUrl, generatePlaceholderImage } from '@/lib/cloudinary';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  featured_image?: string;
  category_name?: string;
  author_name?: string;
  views_count: number;
  created_at: string;
}

export default function TestSavePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Record<string, { liked: boolean; saved: boolean }>>({});

  useEffect(() => {
    // جلب معرف المستخدم
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId && storedUserId !== 'anonymous') {
      setUserId(storedUserId);
    }
    
    // جلب المقالات
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?status=published&limit=5');
      const data = await response.json();
      
      if (data.success && data.articles) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (articleId: string) => {
    if (!userId) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      const currentState = interactions[articleId]?.liked || false;
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          articleId,
          type: 'like',
          action: currentState ? 'remove' : 'add'
        })
      });

      if (response.ok) {
        setInteractions(prev => ({
          ...prev,
          [articleId]: {
            ...prev[articleId],
            liked: !currentState
          }
        }));
        alert(currentState ? 'تم إلغاء الإعجاب' : 'تم الإعجاب بالمقال');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      alert('حدث خطأ أثناء الإعجاب');
    }
  };

  const handleSave = async (articleId: string) => {
    if (!userId) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    try {
      const currentState = interactions[articleId]?.saved || false;
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemId: articleId,
          itemType: 'article'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInteractions(prev => ({
          ...prev,
          [articleId]: {
            ...prev[articleId],
            saved: data.action === 'added'
          }
        }));
        alert(data.action === 'added' ? 'تم حفظ المقال' : 'تم إلغاء الحفظ');
      }
    } catch (error) {
      console.error('Error handling save:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">اختبار نظام الحفظ والإعجاب</h1>
          <p className="text-gray-600">
            اختبر أزرار الإعجاب والحفظ في المقالات
          </p>
          {userId ? (
            <p className="text-sm text-green-600 mt-2">المستخدم المسجل: {userId}</p>
          ) : (
            <p className="text-sm text-red-600 mt-2">لم يتم تسجيل الدخول</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">المقالات المتاحة للاختبار</h2>
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={getValidImageUrl(article.featured_image, article.title, 'article')}
                    alt={article.title}
                    className="w-20 h-20 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.src = generatePlaceholderImage(article.title, 'article');
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {article.author_name || 'غير محدد'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.views_count}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleLike(article.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        interactions[article.id]?.liked 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                      }`}
                      title={interactions[article.id]?.liked ? 'إلغاء الإعجاب' : 'أعجبني'}
                    >
                      <Heart className={`w-5 h-5 ${interactions[article.id]?.liked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleSave(article.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        interactions[article.id]?.saved 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                      }`}
                      title={interactions[article.id]?.saved ? 'إلغاء الحفظ' : 'حفظ المقال'}
                    >
                      <Bookmark className={`w-5 h-5 ${interactions[article.id]?.saved ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* روابط مفيدة */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">روابط مفيدة</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="/profile"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              عرض الملف الشخصي
            </a>
            <a
              href="/login"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              تسجيل الدخول
            </a>
            <a
              href="/test-bookmarks"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              اختبار متقدم
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>

        {/* تعليمات */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">كيفية الاختبار:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>تأكد من تسجيل الدخول أولاً</li>
            <li>اضغط على زر القلب للإعجاب بالمقال</li>
            <li>اضغط على زر الإشارة المرجعية لحفظ المقال</li>
            <li>انتقل إلى الملف الشخصي لرؤية المقالات المحفوظة</li>
            <li>يمكنك إلغاء الإعجاب أو الحفظ بالضغط مرة أخرى</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 