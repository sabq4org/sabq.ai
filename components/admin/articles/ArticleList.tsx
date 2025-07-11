"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived' | 'in_review';
  featured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  created_at: string;
  updated_at: string;
  published_at?: string;
  scheduled_at?: string;
  view_count: number;
  stats: {
    comments: number;
    likes: number;
    revisions: number;
  };
}

interface ArticleListProps {
  initialArticles?: Article[];
  categories?: Array<{ id: string; name: string; slug: string }>;
  authors?: Array<{ id: string; name: string; email: string }>;
}

export default function ArticleList({ 
  initialArticles = [], 
  categories = [], 
  authors = [] 
}: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  
  // فلاتر البحث
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // ترقيم الصفحات
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // حالة UI
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // جلب المقالات
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort: sortBy,
        order: sortOrder,
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(authorFilter && { author: authorFilter }),
        ...(featuredFilter && { featured: featuredFilter })
      });

      const response = await fetch(`/api/articles?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب المقالات');
      }

      const data = await response.json();
      setArticles(data.data.articles);
      setTotalPages(data.data.pagination.pages);
      setTotalCount(data.data.pagination.total);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  // تأثير البحث والفلترة
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      fetchArticles();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, statusFilter, categoryFilter, authorFilter, featuredFilter, sortBy, sortOrder]);

  // تأثير تغيير الصفحة
  useEffect(() => {
    fetchArticles();
  }, [currentPage, itemsPerPage]);

  // حذف مقال
  const handleDelete = async (articleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('فشل في حذف المقال');
      }

      await fetchArticles();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف');
    }
  };

  // تحديد/إلغاء تحديد المقالات
  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const toggleAllSelection = () => {
    setSelectedArticles(prev => 
      prev.length === articles.length ? [] : articles.map(a => a.id)
    );
  };

  // إجراءات جماعية
  const handleBulkAction = async (action: string) => {
    if (selectedArticles.length === 0) return;

    const confirmMessage = {
      'delete': 'هل أنت متأكد من حذف المقالات المحددة؟',
      'publish': 'هل تريد نشر المقالات المحددة؟',
      'archive': 'هل تريد أرشفة المقالات المحددة؟'
    }[action];

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/articles/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action,
          article_ids: selectedArticles
        })
      });

      if (!response.ok) {
        throw new Error('فشل في تنفيذ الإجراء');
      }

      setSelectedArticles([]);
      await fetchArticles();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تنفيذ الإجراء');
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // تنسيق حالة المقال
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
      published: { label: 'منشور', color: 'bg-green-100 text-green-800' },
      scheduled: { label: 'مجدول', color: 'bg-blue-100 text-blue-800' },
      archived: { label: 'مؤرشف', color: 'bg-yellow-100 text-yellow-800' },
      in_review: { label: 'قيد المراجعة', color: 'bg-orange-100 text-orange-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* رأس الصفحة */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المقالات</h1>
            <p className="text-gray-600 mt-1">
              {totalCount.toLocaleString('ar-SA')} مقال إجمالي
            </p>
          </div>
          <Link
            href="/admin/articles/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>مقال جديد</span>
          </Link>
        </div>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* البحث */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 rtl:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في المقالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 rtl:pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* أزرار الفلاتر */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>فلاتر</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {selectedArticles.length > 0 && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>{selectedArticles.length} محدد</span>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* الفلاتر المتقدمة */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="scheduled">مجدول</option>
              <option value="archived">مؤرشف</option>
              <option value="in_review">قيد المراجعة</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">كل الفئات</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">كل المؤلفين</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">كل المقالات</option>
              <option value="true">مميز</option>
              <option value="false">غير مميز</option>
            </select>
          </div>
        )}

        {/* الإجراءات الجماعية */}
        {showBulkActions && selectedArticles.length > 0 && (
          <div className="mt-4 flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-sm text-gray-600">إجراءات جماعية:</span>
            <button
              onClick={() => handleBulkAction('publish')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              نشر
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              أرشفة
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              حذف
            </button>
          </div>
        )}
      </div>

      {/* جدول المقالات */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right rtl:text-left">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === articles.length && articles.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                العنوان
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الفئة
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                المؤلف
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإحصائيات
              </th>
              <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="mr-2 rtl:ml-2">جاري التحميل...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  لا توجد مقالات
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => toggleArticleSelection(article.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {article.featured && (
                        <Star className="w-4 h-4 text-yellow-500 ml-2 rtl:mr-2" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                        {article.summary && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {article.summary}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {article.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 ml-1 rtl:mr-1" />
                      <span className="text-sm text-gray-900">
                        {article.author.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(article.created_at)}
                    </div>
                    {article.published_at && (
                      <div className="text-xs text-gray-500">
                        نُشر: {formatDate(article.published_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>{article.view_count.toLocaleString('ar-SA')} مشاهدة</div>
                      <div className="text-xs text-gray-500">
                        {article.stats.likes} إعجاب • {article.stats.comments} تعليق
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="عرض"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-green-600 hover:text-green-800"
                        title="تحرير"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-800"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ترقيم الصفحات */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, totalCount)} من {totalCount.toLocaleString('ar-SA')} مقال
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              السابق
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 