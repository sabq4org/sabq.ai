'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, FileText, Award, TrendingUp, Eye, Heart, Clock, Twitter, Linkedin, Mail, User, Loader2, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '@/components/Footer';
import { formatDateOnly } from '@/lib/date-utils';
import './author-styles.css';

interface Author {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar?: string;
  joinDate?: string;
  articlesCount?: number;
  viewsCount?: number;
  likesCount?: number;
  specialization?: string[];
  awards?: string[];
  social?: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

interface Article {
  id: string;
  title: string;
  summary?: string;
  category: string;
  category_id?: number;
  date: string;
  image?: string;
  views?: number;
  likes?: number;
  comments?: number;
  readTime?: string;
  is_breaking?: boolean;
  is_featured?: boolean;
}

export default function AuthorPage() {
  const params = useParams();
  const [author, setAuthor] = useState<Author | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    if (params?.id) {
      fetchAuthorData();
    }
  }, [params?.id]);

  const fetchAuthorData = async () => {
    try {
      const authorId = params?.id as string;
      
      // جلب بيانات المؤلف من API
      const response = await fetch(`/api/authors/${authorId}`);
      
      if (!response.ok) {
        throw new Error('Author not found');
      }
      
      const data = await response.json();
      
      setAuthor(data.author);
      setArticles(data.articles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching author data:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // توليد صورة بديلة
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
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.8">
          ${title.substring(0, 20)}
        </text>
      </svg>
    `)}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400">جاري تحميل بيانات المراسل...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!author) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
              <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">عذراً، لم نتمكن من العثور على المراسل</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">تحقق من الرابط وحاول مرة أخرى</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              العودة للرئيسية
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const sortedArticles = activeTab === 'popular' 
    ? [...articles].sort((a, b) => (b.views || 0) - (a.views || 0))
    : articles;

  // بطاقة المقال - نفس تصميم صفحة الأخبار
  const ArticleCard = ({ article }: { article: Article }) => (
    <Link href={`/article/${article.id}`}>
      <div className="group h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 hover:shadow-2xl dark:hover:shadow-gray-900/70 transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-transparent transform hover:-translate-y-1">
        {/* صورة المقال */}
        <div className="relative overflow-hidden h-56">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
          <img
            src={article.image || generatePlaceholderImage(article.title)}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* شارات */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {article.is_breaking && (
              <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                عاجل
              </div>
            )}
            {article.is_featured && (
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                مميز
              </div>
            )}
          </div>

          {/* التصنيف */}
          <div className="absolute bottom-4 right-4 z-20">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
              <BookOpen className="w-3 h-3" />
              {typeof article.category === 'string' ? article.category : ((article.category as any)?.name_ar || (article.category as any)?.name || 'عام')}
            </span>
          </div>
        </div>

        {/* محتوى المقال */}
        <div className="p-6">
          {/* العنوان */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
            {article.title}
          </h3>

          {/* الملخص */}
          {article.summary && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}

          {/* معلومات إضافية */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDateOnly(article.date)}</span>
              </div>
              {article.readTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTime}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(article.views || 0)}</span>
              </div>
              {article.likes && (
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{formatNumber(article.likes)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section - تصميم بسيط وأنيق مثل صفحة الأخبار */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* صورة المؤلف */}
              <div className="flex-shrink-0">
                {author.avatar ? (
                  <img 
                    src={author.avatar} 
                    alt={author.name}
                    className="w-32 h-32 rounded-full object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl">
                    <span className="text-4xl font-bold text-white">
                      {author.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* معلومات المؤلف */}
              <div className="flex-1 text-center md:text-right">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{author.name}</h1>
                {author.title && (
                  <p className="text-lg text-blue-600 dark:text-blue-400 mb-3">{author.title}</p>
                )}
                {author.bio && (
                  <p className="text-gray-600 dark:text-gray-400 max-w-3xl mb-4 leading-relaxed">
                    {author.bio}
                  </p>
                )}
                
                {/* وسائل التواصل */}
                {author.social && (
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                    {author.social.twitter && (
                      <a 
                        href={author.social.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      >
                        <Twitter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </a>
                    )}
                    {author.social.linkedin && (
                      <a 
                        href={author.social.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      >
                        <Linkedin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </a>
                    )}
                    {author.social.email && (
                      <a 
                        href={`mailto:${author.social.email}`} 
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                      >
                        <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {/* الإحصائيات */}
              <div className="flex flex-row md:flex-col gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{author.articlesCount}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">مقال</div>
                </div>
                <div className="w-px md:w-full h-10 md:h-px bg-gray-300 dark:bg-gray-600" />
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(author.viewsCount || 0)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">مشاهدة</div>
                </div>
                <div className="w-px md:w-full h-10 md:h-px bg-gray-300 dark:bg-gray-600" />
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(author.likesCount || 0)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">إعجاب</div>
                </div>
              </div>
            </div>
            
            {/* التخصصات والجوائز */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-8">
                {author.specialization && author.specialization.length > 0 && (
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">التخصصات</h3>
                    <div className="flex flex-wrap gap-2">
                      {author.specialization.map((spec, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {author.awards && author.awards.length > 0 && (
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      الجوائز والإنجازات
                    </h3>
                    <div className="space-y-2">
                      {author.awards.map((award, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>{award}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* قسم المقالات */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* العنوان والتبويبات */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">المواد التحريرية</h2>
            
            {/* التبويبات */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('latest')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'latest' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                الأحدث
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'popular' 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                الأكثر قراءة
              </button>
            </div>
          </div>
          
          {/* شبكة المقالات */}
          {sortedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مقالات متاحة</h3>
              <p className="text-gray-500 dark:text-gray-400">لم يتم نشر أي مقالات بعد</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
} 