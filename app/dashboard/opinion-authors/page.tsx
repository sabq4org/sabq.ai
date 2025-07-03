'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  User,
  Mail,
  Twitter,
  Linkedin,
  FileText,
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface OpinionAuthor {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  title?: string;
  email?: string;
  twitter?: string;
  linkedin?: string;
  specialties?: string[];
  isActive: boolean;
  displayOrder: number;
  articlesCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function OpinionAuthorsPage() {
  const { darkMode } = useDarkModeContext();
  const [authors, setAuthors] = useState<OpinionAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/opinion-authors');
      const data = await response.json();
      if (data.success) {
        setAuthors(data.authors);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      toast.error('فشل في جلب كتّاب الرأي');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthorStatus = async (authorId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/opinion-authors/${authorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        toast.success(currentStatus ? 'تم إلغاء تفعيل الكاتب' : 'تم تفعيل الكاتب');
        fetchAuthors();
      }
    } catch (error) {
      toast.error('حدث خطأ في تحديث حالة الكاتب');
    }
  };

  const deleteAuthor = async (authorId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكاتب؟')) return;

    try {
      const response = await fetch(`/api/opinion-authors/${authorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('تم حذف الكاتب بنجاح');
        fetchAuthors();
      }
    } catch (error) {
      toast.error('حدث خطأ في حذف الكاتب');
    }
  };

  const updateDisplayOrder = async (authorId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/opinion-authors/${authorId}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });

      if (response.ok) {
        fetchAuthors();
      }
    } catch (error) {
      toast.error('حدث خطأ في تحديث الترتيب');
    }
  };

  const filteredAuthors = authors.filter(author => {
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         author.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive || author.isActive;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            إدارة كتّاب الرأي
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            إدارة كتّاب مقالات الرأي والمحللين
          </p>
        </div>

        {/* Actions Bar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="البحث عن كاتب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pr-10 pl-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  عرض غير المفعلين
                </span>
              </label>

              <Link
                href="/dashboard/opinion-authors/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                إضافة كاتب جديد
              </Link>
            </div>
          </div>
        </div>

        {/* Authors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredAuthors.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            لا يوجد كتّاب مطابقين للبحث
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuthors.map((author, index) => (
              <div
                key={author.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg`}
              >
                {/* Author Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {author.avatar ? (
                        <img
                          src={author.avatar}
                          alt={author.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <User className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        </div>
                      )}
                      <div>
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {author.name}
                        </h3>
                        {author.title && (
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {author.title}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Order Controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => updateDisplayOrder(author.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateDisplayOrder(author.id, 'down')}
                        disabled={index === filteredAuthors.length - 1}
                        className={`p-1 rounded ${
                          index === filteredAuthors.length - 1
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  {author.bio && (
                    <p className={`text-sm mb-4 line-clamp-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {author.bio}
                    </p>
                  )}

                  {/* Stats & Social */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {author.articlesCount} مقال
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {author.email && (
                        <a
                          href={`mailto:${author.email}`}
                          className={`p-1.5 rounded-lg ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {author.twitter && (
                        <a
                          href={`https://twitter.com/${author.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {author.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${author.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      author.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {author.isActive ? 'مفعّل' : 'غير مفعّل'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/opinion-authors/${author.id}/edit`}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      } transition-colors`}
                    >
                      <Edit2 className="w-4 h-4" />
                      تعديل
                    </Link>
                    
                    <button
                      onClick={() => toggleAuthorStatus(author.id, author.isActive)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        author.isActive
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } transition-colors`}
                    >
                      {author.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => deleteAuthor(author.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 