'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DeepAnalysisCard from '@/components/deep-analysis/DeepAnalysisCard';
import { 
  Brain,
  Search,
  Grid,
  List,
  Loader2,
  SlidersHorizontal
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import toast from 'react-hot-toast';

interface DeepAnalysis {
  id: string;
  title: string;
  slug: string;
  summary: string;
  categories: string[];
  tags: string[];
  authorName: string;
  sourceType: string;
  readingTime: number;
  views: number;
  likes: number;
  qualityScore: number;
  status: string;
  createdAt: string;
  publishedAt: string;
  featuredImage?: string;
}

export default function DeepAnalysesPage() {
  const { darkMode } = useDarkModeContext();
  const [mounted, setMounted] = useState(false);
  const [analyses, setAnalyses] = useState<DeepAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<DeepAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchAnalyses();
  }, []);

  useEffect(() => {
    filterAndSortAnalyses();
  }, [analyses, searchTerm, selectedCategory, sortBy]);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/deep-analyses');
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      const data = await response.json();
      
      const analysesArray = data.analyses || data;
      
      const uniqueCategories = [...new Set(analysesArray.flatMap((a: DeepAnalysis) => a.categories || []))];
      setCategories(uniqueCategories as string[]);
      
      setAnalyses(analysesArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('حدث خطأ في تحميل التحليلات');
      setLoading(false);
    }
  };

  const filterAndSortAnalyses = () => {
    let filtered = [...analyses];

    if (searchTerm) {
      filtered = filtered.filter(analysis => 
        analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(analysis => 
        analysis.categories.includes(selectedCategory)
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'quality':
        filtered.sort((a, b) => b.qualityScore - a.qualityScore);
        break;
    }

    setFilteredAnalyses(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/20 border-amber-400/30';
    return 'text-red-400 bg-red-500/20 border-red-400/30';
  };

  const generatePlaceholderImage = (title: string) => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    const colorIndex = title.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors[colorIndex]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors[(colorIndex + 1) % colors.length]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad)"/>
        <g opacity="0.2">
          <circle cx="100" cy="100" r="40" fill="white"/>
          <circle cx="300" cy="200" r="60" fill="white"/>
          <circle cx="200" cy="250" r="30" fill="white"/>
        </g>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 20)}
        </text>
      </svg>
    `)}`;
  };

  if (!mounted || loading) {
    return (
      <>
        <Header />
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                جاري تحميل التحليلات العميقة...
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div dir="rtl" className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Hero Section محسن للجوال */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <div className="absolute inset-0 bg-black/20" />
            {/* نمط الشبكة */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full mb-6">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6">
                التحليلات العميقة
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed px-4">
                استكشف تحليلات معمقة ورؤى ثاقبة مدعومة بالذكاء الاصطناعي
              </p>
              
              {/* إحصائيات محسنة للجوال */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="text-2xl sm:text-4xl font-black text-white mb-1">
                    {analyses.length}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-white/80">تحليل</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="text-2xl sm:text-4xl font-black text-white mb-1">
                    {analyses.reduce((sum, a) => sum + a.views, 0).toLocaleString('ar-SA')}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-white/80">مشاهدة</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="text-2xl sm:text-4xl font-black text-white mb-1">
                    {Math.round(analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length)}%
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-white/80">جودة</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* شريط البحث والفلاتر - محسن للجوال */}
        <div className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            {/* البحث وأزرار التحكم */}
            <div className="flex items-center gap-3 mb-3">
              {/* حقل البحث */}
              <div className="flex-1 relative">
                <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="ابحث في التحليلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`
                    w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm
                    transition-all focus:outline-none focus:ring-2
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20'
                    }
                  `}
                />
              </div>

              {/* زر الفلاتر للجوال */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  sm:hidden p-2.5 rounded-xl border transition-all
                  ${showFilters 
                    ? darkMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-200 text-blue-600'
                    : darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }
                `}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* أزرار التحكم للشاشات الكبيرة */}
              <div className="hidden sm:flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`
                    px-4 py-2.5 rounded-xl border text-sm font-medium
                    transition-all focus:outline-none
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                    }
                  `}
                >
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="popular">الأكثر مشاهدة</option>
                  <option value="quality">الأعلى جودة</option>
                </select>

                <div className={`flex items-center rounded-xl p-1 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid' 
                        ? darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600 shadow-sm'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list' 
                        ? darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600 shadow-sm'
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* الفلاتر للجوال */}
            {showFilters && (
              <div className="sm:hidden space-y-3 pb-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`
                    w-full px-4 py-2.5 rounded-xl border text-sm font-medium
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                    }
                  `}
                >
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="popular">الأكثر مشاهدة</option>
                  <option value="quality">الأعلى جودة</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`
                      flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                      ${viewMode === 'grid' 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                      }
                    `}
                  >
                    عرض شبكي
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`
                      flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                      ${viewMode === 'list' 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                      }
                    `}
                  >
                    عرض قائمة
                  </button>
                </div>
              </div>
            )}

            {/* التصنيفات - محسنة للجوال */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all flex-shrink-0
                  ${selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                جميع التحليلات
              </button>
              
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                    transition-all flex-shrink-0
                    ${selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  {typeof category === 'string' ? category : ((category as any).name_ar || (category as any).name || 'عام')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-20">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Brain className={`w-10 h-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                لم نجد تحليلات تطابق بحثك
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                جرّب البحث بكلمات مختلفة أو اختر تصنيفاً آخر
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          ) : (
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' 
                : 'space-y-4 sm:space-y-6'
              }
            `}>
              {filteredAnalyses.map((analysis) => (
                <DeepAnalysisCard 
                  key={analysis.id} 
                  analysis={analysis} 
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
} 