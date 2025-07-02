'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Eye, Clock, User } from 'lucide-react';
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
  published_at?: string;
}

interface SavedArticle {
  id: string;
  title: string;
  category?: string;
  savedAt: string;
}

export default function TestBookmarksPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
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

  useEffect(() => {
    if (userId) {
      fetchSavedArticles();
    }
  }, [userId]);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?status=published&limit=10');
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

  const fetchSavedArticles = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user/${userId}/insights`);
      const data = await response.json();
      
      if (data.success && data.data?.savedArticles) {
        setSavedArticles(data.data.savedArticles);
      }
    } catch (error) {
      console.error('Error fetching saved articles:', error);
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
      }
    } catch (error) {
      console.error('Error handling like:', error);
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
        
        // تحديث قائمة المقالات المحفوظة
        if (data.action === 'added') {
          const article = articles.find(a => a.id === articleId);
          if (article) {
            setSavedArticles(prev => [{
              id: article.id,
              title: article.title,
              category: article.category_name,
              savedAt: new Date().toISOString()
            }, ...prev]);
          }
        } else {
          setSavedArticles(prev => prev.filter(a => a.id !== articleId));
        }
      }
    } catch (error) {
      console.error('Error handling save:', error);
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">اختبار نظام الحفظ</h1>
          <p className="text-gray-600">
            اختبر نظام حفظ المقالات وعرض المقالات المحفوظة في الملف الشخصي
          </p>
          {userId ? (
            <p className="text-sm text-green-600 mt-2">المستخدم المسجل: {userId}</p>
          ) : (
            <p className="text-sm text-red-600 mt-2">لم يتم تسجيل الدخول</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* المقالات المتاحة */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">المقالات المتاحة</h2>
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={getValidImageUrl(article.featured_image, article.title, 'article')}
                      alt={article.title}
                      className="w-16 h-16 rounded-lg object-cover"
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          interactions[article.id]?.liked 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${interactions[article.id]?.liked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleSave(article.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          interactions[article.id]?.saved 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${interactions[article.id]?.saved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* المقالات المحفوظة */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              المقالات المحفوظة ({savedArticles.length})
            </h2>
            {savedArticles.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">لا توجد مقالات محفوظة</p>
                <p className="text-sm text-gray-400 mt-1">
                  احفظ بعض المقالات من القائمة اليسرى
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedArticles.map((article) => (
                  <div key={article.id} className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-1 line-clamp-2">{article.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {article.category && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {article.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {new Date(article.savedAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 