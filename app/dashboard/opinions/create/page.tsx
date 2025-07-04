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
  CheckCircle,
  Newspaper,
  BarChart3,
  Edit,
  Clock,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

  // مكون بطاقة الإحصائية
  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgGradient,
    iconColor
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgGradient: string;
    iconColor: string;
  }) => (
    <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xs sm:text-sm mb-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className={`text-lg sm:text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{value}</span>
            <span className={`text-xs sm:text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إنشاء مقال رأي جديد</h1>
        <p className={`text-sm sm:text-base transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>اكتب مقال رأي أو تحليل من وجهة نظر أحد كتّاب الرأي المميزين</p>
      </div>

      {/* قسم النظام التحريري */}
      <div className="mb-6 sm:mb-8">
        <div className={`rounded-2xl p-4 sm:p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-700' 
            : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <PenTool className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>محرر مقالات الرأي</h2>
                <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>أدوات متقدمة لكتابة وتحرير مقالات الرأي والتحليلات الصحفية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link 
                href="/dashboard/opinions"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>عرض المقالات</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <StatsCard
          title="كتّاب الرأي"
          value={authors.length}
          subtitle="كاتب نشط"
          icon={User}
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-white"
        />
        <StatsCard
          title="مقالات اليوم"
          value="0"
          subtitle="مقال جديد"
          icon={Edit}
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconColor="text-white"
        />
        <StatsCard
          title="في الانتظار"
          value="0"
          subtitle="مقال"
          icon={Clock}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-600"
          iconColor="text-white"
        />
        <StatsCard
          title="مقالات عاجلة"
          value="0"
          subtitle="مقال"
          icon={Zap}
          bgGradient="bg-gradient-to-br from-red-500 to-pink-600"
          iconColor="text-white"
        />
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              عنوان المقال
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان مقال الرأي..."
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:bg-gray-600' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg`}
            />
          </div>

          {/* Content Editor */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                محتوى المقال
              </label>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                {previewMode ? 'تحرير' : 'معاينة'}
              </button>
            </div>
            
            {previewMode ? (
              <div 
                className={`prose prose-lg max-w-none min-h-[400px] ${
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
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              مقتطف من المقال
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="اكتب ملخصاً قصيراً للمقال..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:bg-gray-600' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none`}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Selection */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <User className="w-4 h-4 inline ml-1" />
              كاتب المقال
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            >
              <option value="">اختر الكاتب</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name} {author.title && `- ${author.title}`}
                </option>
              ))}
            </select>
            
            {selectedAuthorData && (
              <div className={`mt-4 p-4 rounded-xl transition-colors duration-300 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedAuthorData.avatar ? (
                    <img
                      src={selectedAuthorData.avatar}
                      alt={selectedAuthorData.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <p className={`font-medium transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedAuthorData.name}
                    </p>
                    {selectedAuthorData.title && (
                      <p className={`text-sm transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {selectedAuthorData.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opinion Type */}
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <FileText className="w-4 h-4 inline ml-1" />
              نوع المقال
            </label>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                opinionType === 'short'
                  ? darkMode
                    ? 'bg-indigo-900/30 border-indigo-600'
                    : 'bg-indigo-50 border-indigo-300'
                  : darkMode
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
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
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                opinionType === 'extended'
                  ? darkMode
                    ? 'bg-indigo-900/30 border-indigo-600'
                    : 'bg-indigo-50 border-indigo-300'
                  : darkMode
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
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
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
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
                className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm`}
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
              >
                إضافة
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  #{tag}
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
          <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <label className={`block text-sm font-medium mb-3 transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <Calendar className="w-4 h-4 inline ml-1" />
              خيارات النشر
            </label>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                publishNow
                  ? darkMode
                    ? 'bg-green-900/30 border-green-600'
                    : 'bg-green-50 border-green-300'
                  : darkMode
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <input
                  type="radio"
                  checked={publishNow}
                  onChange={() => setPublishNow(true)}
                  className="text-green-600"
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  نشر فوري
                </span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                !publishNow
                  ? darkMode
                    ? 'bg-purple-900/30 border-purple-600'
                    : 'bg-purple-50 border-purple-300'
                  : darkMode
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}>
                <input
                  type="radio"
                  checked={!publishNow}
                  onChange={() => setPublishNow(false)}
                  className="text-purple-600"
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
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => handleSubmit('published')}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
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
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
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
  );
} 