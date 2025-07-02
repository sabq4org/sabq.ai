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
      <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16">
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center p-8 mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-70 animate-pulse" />
              <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-6 shadow-2xl">
                <Brain className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>
            <h1 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
              التحليلات العميقة
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
              اكتشف تحليلات معمقة ورؤى ثاقبة مدعومة بالذكاء الاصطناعي
            </p>
              
              {/* Stats with Glass Effect */}
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-black bg-opacity-20 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 shadow-xl border border-white border-opacity-20">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">{analyses.length}</div>
                  <div className="text-xs sm:text-sm text-white">تحليل عميق</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                    {analyses.reduce((sum, a) => sum + a.views, 0).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-white">مشاهدة إجمالية</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50"></div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                    {Math.round(analyses.reduce((sum, a) => sum + a.qualityScore, 0) / analyses.length)}%
                  </div>
                  <div className="text-xs sm:text-sm text-white">معدل الجودة</div>
                </div>
              </div>
            </div>
        </section>

        {/* Search Section */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-10 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في التحليلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 focus:border-transparent transition-all text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-6 py-12">
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
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-6'
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
        </section>
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
        
        /* تأثيرات backdrop blur للمتصفحات المختلفة */
        .backdrop-blur-md {
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }
        
        /* خلفية سوداء شفافة */
        .bg-black {
          background-color: rgb(0, 0, 0);
        }
        
        .bg-opacity-20 {
          --tw-bg-opacity: 0.2;
        }
        
        .bg-opacity-50 {
          --tw-bg-opacity: 0.5;
        }
        
        /* حدود بيضاء شفافة */
        .border-white {
          border-color: rgb(255, 255, 255);
        }
        
        .border-opacity-20 {
          --tw-border-opacity: 0.2;
        }
        
        /* ضمان ظهور النصوص البيضاء */
        .text-white {
          color: rgb(255, 255, 255);
        }
        
        /* تأثير الظل للنصوص */
        .drop-shadow-lg {
          filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1));
        }
        
        .shadow-xl {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
} 