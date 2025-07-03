'use client';

import React, { useState, useEffect } from 'react';
import { 
  PenTool,
  Save,
  Eye,
  X,
  User,
  Hash,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import dynamic from 'next/dynamic';

// استيراد محرر TipTap بشكل ديناميكي
const Editor = dynamic(() => import('@/components/Editor/Editor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
});

interface OpinionAuthor {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
}

export default function CreateOpinionPage() {
  const router = useRouter();
  const { darkMode } = useDarkModeContext();
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<OpinionAuthor[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  // حقول المقال
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [opinionType, setOpinionType] = useState<'short' | 'extended'>('short');
  const [publishNow, setPublishNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    fetchOpinionAuthors();
  }, []);

  const fetchOpinionAuthors = async () => {
    try {
      const response = await fetch('/api/opinion-authors?active=true');
      const data = await response.json();
      if (data.success) {
        setAuthors(data.authors);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      toast.error('فشل في جلب قائمة الكتّاب');
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('يرجى إدخال عنوان المقال');
      return false;
    }
    if (!content.trim() || content === '<p></p>') {
      toast.error('يرجى كتابة محتوى المقال');
      return false;
    }
    if (!selectedAuthor) {
      toast.error('يرجى اختيار كاتب المقال');
      return false;
    }
    if (!excerpt.trim()) {
      toast.error('يرجى كتابة مقتطف من المقال');
      return false;
    }
    return true;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const articleData = {
        title,
        content,
        excerpt,
        type: 'OPINION',
        opinionAuthorId: selectedAuthor,
        status,
        tags,
        metadata: {
          opinionType,
          ...(status === 'published' && !publishNow && {
            scheduledFor: new Date(scheduledDate).toISOString()
          })
        }
      };

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          status === 'draft' 
            ? 'تم حفظ المسودة بنجاح' 
            : 'تم نشر مقال الرأي بنجاح'
        );
        router.push('/dashboard/opinions');
      } else {
        throw new Error('Failed to create article');
      }
    } catch (error) {
      console.error('Error creating opinion article:', error);
      toast.error('حدث خطأ في حفظ المقال');
    } finally {
      setLoading(false);
    }
  };

  const selectedAuthorData = authors.find(a => a.id === selectedAuthor);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${
              darkMode ? 'bg-indigo-600' : 'bg-indigo-500'
            }`}>
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              إنشاء مقال رأي جديد
            </h1>
          </div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            اكتب مقال رأي أو تحليل من وجهة نظر أحد كتّاب الرأي
          </p>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                عنوان المقال
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان مقال الرأي..."
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg`}
              />
            </div>

            {/* Content Editor */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between mb-4">
                <label className={`text-sm font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  محتوى المقال
                </label>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } transition-colors`}
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'تحرير' : 'معاينة'}
                </button>
              </div>
              
              {previewMode ? (
                <div 
                  className={`prose prose-lg max-w-none ${
                    darkMode ? 'prose-invert' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <Editor
                  content={content}
                  onChange={setContent}
                  placeholder="اكتب محتوى مقال الرأي هنا..."
                />
              )}
            </div>

            {/* Excerpt */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                مقتطف من المقال
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="اكتب ملخصاً قصيراً للمقال..."
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Selection */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <label className={`block text-sm font-medium mb-3 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <User className="w-4 h-4 inline ml-1" />
                كاتب المقال
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="">اختر الكاتب</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>
                    {author.name} {author.title && `- ${author.title}`}
                  </option>
                ))}
              </select>
              
              {selectedAuthorData && (
                <div className={`mt-3 p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    {selectedAuthorData.avatar ? (
                      <img
                        src={selectedAuthorData.avatar}
                        alt={selectedAuthorData.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}>
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedAuthorData.name}
                      </p>
                      {selectedAuthorData.title && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedAuthorData.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Opinion Type */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <label className={`block text-sm font-medium mb-3 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <FileText className="w-4 h-4 inline ml-1" />
                نوع المقال
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="short"
                    checked={opinionType === 'short'}
                    onChange={(e) => setOpinionType(e.target.value as 'short' | 'extended')}
                    className="text-indigo-600"
                  />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    مقالة قصيرة
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="extended"
                    checked={opinionType === 'extended'}
                    onChange={(e) => setOpinionType(e.target.value as 'short' | 'extended')}
                    className="text-indigo-600"
                  />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    تحليل رأي موسع
                  </span>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <label className={`block text-sm font-medium mb-3 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Hash className="w-4 h-4 inline ml-1" />
                الوسوم
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="أضف وسم..."
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  إضافة
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Publishing Options */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <label className={`block text-sm font-medium mb-3 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <Calendar className="w-4 h-4 inline ml-1" />
                خيارات النشر
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={publishNow}
                    onChange={() => setPublishNow(true)}
                    className="text-indigo-600"
                  />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    نشر فوري
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={!publishNow}
                    onChange={() => setPublishNow(false)}
                    className="text-indigo-600"
                  />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    جدولة للنشر
                  </span>
                </label>
                {!publishNow && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    نشر المقال
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <Save className="w-5 h-5" />
                حفظ كمسودة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 