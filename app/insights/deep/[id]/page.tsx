'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Brain, 
  Eye, 
  Clock, 
  Share2, 
  Bookmark, 
  Download, 
  Printer, 
  Heart,
  Calendar,
  User,
  Star,
  ChevronRight,
  Sparkles,
  FileText,
  Hash,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import toast from 'react-hot-toast';

interface DeepAnalysisPageProps {
  id: string;
  title: string;
  lead: string;
  contentHtml: string;
  tags: string[];
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  publishedAt: string;
  publishedAtHijri?: string;
  readTime: number;
  views: number;
  likes: number;
  shares: number;
  rating: number;
  category: string;
  categorySlug?: string;
  aiSummary?: string;
  aiQuestions?: string[];
  relatedArticles?: RelatedArticle[];
  featuredImage?: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  summary: string;
  readTime: number;
  category: string;
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  wordCount?: number;
}

// دالة debounce محلية
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function DeepAnalysisPage() {
  const params = useParams();
  const { darkMode: contextDarkMode } = useDarkModeContext();
  const [darkMode, setDarkMode] = useState(false);
  const [analysis, setAnalysis] = useState<DeepAnalysisPageProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileToc, setShowMobileToc] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLDivElement>(null);

  // تحديث dark mode بعد التحميل لتجنب مشكلة Hydration
  useEffect(() => {
    setDarkMode(contextDarkMode);
  }, [contextDarkMode]);

  useEffect(() => {
    fetchAnalysisDetails();
  }, [params?.id]);

  useEffect(() => {
    if (analysis?.contentHtml) {
      generateTableOfContents();
    }
  }, [analysis?.contentHtml]);

  useEffect(() => {
    const handleScroll = () => {
      // تحديث زر العودة للأعلى
      setShowScrollTop(window.pageYOffset > 300);
      
      // حساب نسبة التقدم في القراءة
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.pageYOffset;
      const progress = (scrollTop / documentHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
      
      // تحديث القسم النشط في الفهرس
      if (tableOfContents.length > 0) {
        const scrollPosition = window.scrollY + 150; // إضافة offset للدقة
        
        // البحث عن القسم الحالي
        let currentSection = '';
        
        for (let i = tableOfContents.length - 1; i >= 0; i--) {
          const section = document.getElementById(tableOfContents[i].id);
          if (section && section.offsetTop <= scrollPosition) {
            currentSection = tableOfContents[i].id;
            break;
          }
        }
        
        // تحديث القسم النشط فقط إذا تغير
        if (currentSection && currentSection !== activeSection) {
          setActiveSection(currentSection);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // حفظ واستعادة موضع القراءة
  useEffect(() => {
    if (analysis?.id) {
      const savedPosition = localStorage.getItem(`reading-position-${analysis.id}`);
      if (savedPosition) {
        const position = parseInt(savedPosition);
        if (position > 100) {
          // إظهار رسالة للمستخدم
          toast(`مرحباً بعودتك! كنت عند ${Math.round((position / document.documentElement.scrollHeight) * 100)}% من المقال`, {
            duration: 3000,
            position: 'bottom-center',
            icon: '📖'
          });
          
          // العودة لموضع القراءة بعد تحميل الصفحة
          setTimeout(() => {
            window.scrollTo({ top: position, behavior: 'smooth' });
          }, 500);
        }
      }
    }
  }, [analysis?.id]);

  // حفظ موضع القراءة عند التمرير
  useEffect(() => {
    const savePosition = () => {
      if (analysis?.id) {
        localStorage.setItem(`reading-position-${analysis.id}`, window.scrollY.toString());
      }
    };

    const debouncedSave = debounce(savePosition, 1000);
    window.addEventListener('scroll', debouncedSave);

    return () => {
      window.removeEventListener('scroll', debouncedSave);
      savePosition(); // حفظ الموضع عند مغادرة الصفحة
    };
  }, [analysis?.id]);

  const fetchAnalysisDetails = async () => {
    try {
      const response = await fetch(`/api/deep-analyses/${params?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const data = await response.json();
      console.log('Fetched data:', data); // للتحقق من البيانات
      
      // تحويل البيانات للعرض
      const analysisData: DeepAnalysisPageProps = {
        id: data.id,
        title: data.title,
        lead: data.summary,
        contentHtml: data.rawContent || formatContentToHtml(data.content),
        tags: data.tags || [],
        author: data.authorName || 'فريق التحرير',
        authorRole: data.sourceType === 'gpt' ? 'محلل بالذكاء الاصطناعي' : 'محرر',
        authorAvatar: data.authorAvatar,
        publishedAt: new Date(data.createdAt).toLocaleDateString('ar-SA'),
        publishedAtHijri: new Date(data.createdAt).toLocaleDateString('ar-SA-u-ca-islamic'),
        readTime: data.readingTime || 5,
        views: data.views || 0,
        likes: data.likes || 0,
        shares: data.shares || 0,
        rating: data.qualityScore ? (data.qualityScore / 20) : 4.5,
        category: data.categories?.[0] || 'تحليل عميق',
        categorySlug: data.categories?.[0]?.toLowerCase().replace(/\s+/g, '-'),
        aiSummary: data.content?.summary,
        aiQuestions: data.content?.questions,
        relatedArticles: data.relatedArticles || [],
        featuredImage: data.featuredImage || '/images/deep-analysis-default.svg'
      };
      
      console.log('Transformed analysis:', analysisData); // للتحقق من البيانات المحولة
      setAnalysis(analysisData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('حدث خطأ في تحميل التحليل');
      setLoading(false);
    }
  };

  const formatContentToHtml = (content: any): string => {
    if (typeof content === 'string') return content;
    if (!content) return '';
    
    let html = '';
    
    // إضافة الأقسام
    if (content.sections) {
      content.sections.forEach((section: any) => {
        if (section.title) {
          html += `<h2>${section.title}</h2>`;
        }
        if (section.content) {
          const paragraphs = section.content.split('\n\n');
          paragraphs.forEach((paragraph: string) => {
            if (paragraph.trim()) {
              html += `<p>${paragraph.trim()}</p>`;
            }
          });
        }
      });
    }
    
    return html;
  };

  const generateTableOfContents = () => {
    if (!contentRef.current) return;
    
    const headings = contentRef.current.querySelectorAll('h2, h3');
    const toc: TableOfContentsItem[] = [];
    
    headings.forEach((heading, index) => {
      // إنشاء ID فريد لكل عنوان
      const id = `section-${index}`;
      heading.id = id;
      
      // إضافة class للتمييز البصري
      heading.classList.add('scroll-mt-20'); // لترك مساحة عند التمرير
      
      // حساب عدد الكلمات في القسم
      let wordCount = 0;
      let nextElement = heading.nextElementSibling;
      while (nextElement && !['H2', 'H3'].includes(nextElement.tagName)) {
        const text = nextElement.textContent || '';
        wordCount += text.trim().split(/\s+/).filter(word => word.length > 0).length;
        nextElement = nextElement.nextElementSibling;
      }
      
      toc.push({
        id,
        title: heading.textContent || '',
        level: parseInt(heading.tagName.charAt(1)),
        wordCount
      });
    });
    
    setTableOfContents(toc);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // مساحة للهيدر الثابت
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setShowMobileToc(false);
      
      // تحديث القسم النشط مباشرة
      setActiveSection(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: analysis?.title,
          text: analysis?.lead,
          url: window.location.href,
        });
        if (analysis) {
          setAnalysis({ ...analysis, shares: analysis.shares + 1 });
        }
        toast.success('تم المشاركة بنجاح');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ الرابط');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(saved ? 'تم إزالة من المحفوظات' : 'تم الحفظ في المحفوظات');
  };

  const handleLike = () => {
    setLiked(!liked);
    if (analysis) {
      setAnalysis({
        ...analysis,
        likes: liked ? analysis.likes - 1 : analysis.likes + 1
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('جاري تحضير ملف PDF...', { id: 'pdf-download' });
      
      // محاكاة تحضير PDF (يمكن استبدالها بـ API حقيقي لاحقاً)
      setTimeout(() => {
        // إنشاء محتوى PDF
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <html dir="rtl">
              <head>
                <title>${analysis?.title || 'تحليل عميق'}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; }
                  h1 { color: #1a202c; margin-bottom: 20px; }
                  h2 { color: #2d3748; margin-top: 30px; margin-bottom: 15px; }
                  p { margin-bottom: 15px; color: #4a5568; }
                  .meta { color: #718096; font-size: 14px; margin-bottom: 30px; }
                  @media print {
                    body { padding: 20px; }
                  }
                </style>
              </head>
              <body>
                <h1>${analysis?.title || ''}</h1>
                <div class="meta">
                  <p>الكاتب: ${analysis?.author || ''} | التاريخ: ${analysis?.publishedAt || ''}</p>
                </div>
                <div>${analysis?.contentHtml || ''}</div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        toast.success('تم تحضير ملف PDF بنجاح!', { id: 'pdf-download' });
      }, 1500);
    } catch (error) {
      toast.error('حدث خطأ في تحضير ملف PDF', { id: 'pdf-download' });
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              جاري تحميل التحليل...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              لم يتم العثور على التحليل
            </p>
            <Link 
              href="/" 
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* شريط التقدم في القراءة */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header Section */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb & Badge */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <Link href="/" className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}>
              الرئيسية
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/categories/${analysis.categorySlug}`} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}>
              {analysis.category}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
              <Brain className="w-3 h-3" />
              تحليل عميق
            </span>
          </div>

          {/* Title */}
          <h1 className={`text-3xl md:text-5xl font-bold leading-tight mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {analysis.title}
          </h1>

          {/* Lead */}
          <p className={`text-lg md:text-xl leading-relaxed mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {analysis.lead}
          </p>

          {/* Featured Image */}
          {analysis.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img 
                src={analysis.featuredImage} 
                alt={analysis.title}
                className="w-full h-auto object-cover"
                style={{ maxHeight: '500px' }}
              />
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{analysis.author}</span>
              {analysis.authorRole && (
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({analysis.authorRole})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{analysis.publishedAt}</span>
              {analysis.publishedAtHijri && (
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ({analysis.publishedAtHijri})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{analysis.readTime} دقائق قراءة</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{analysis.views.toLocaleString()} مشاهدة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Right Sidebar - Table of Contents */}
          <aside className="lg:col-span-3">
            {/* Desktop TOC */}
            <div className={`hidden lg:block sticky top-8 space-y-6`}>
              {/* الفهرس */}
              {tableOfContents.length > 0 && (
                <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    فهرس المحتويات
                  </h3>
                  <div className="text-xs text-gray-500 mb-3">
                    {Math.round(readingProgress)}% مكتمل
                  </div>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-right py-2 px-3 rounded-lg transition-all relative overflow-hidden ${
                          activeSection === item.id
                            ? darkMode 
                              ? 'bg-blue-900/30 text-blue-400 border-r-4 border-blue-400' 
                              : 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                            : darkMode
                              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        } ${item.level === 3 ? 'mr-4 text-sm' : ''}`}
                      >
                        {/* مؤشر القسم النشط */}
                        {activeSection === item.id && (
                          <div className="absolute inset-y-0 right-0 w-1 bg-blue-500 animate-pulse" />
                        )}
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-xs opacity-60">
                            {item.wordCount ? `${item.wordCount} كلمة` : ''}
                          </span>
                          <span>{item.title}</span>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              )}

              {/* الإحصائيات */}
              <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                <h3 className="font-bold text-lg mb-4">الإحصائيات</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      الوقت المتبقي
                    </span>
                    <span className="font-bold">
                      {Math.ceil((analysis.readTime * (100 - readingProgress)) / 100)} دقيقة
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      المشاهدات
                    </span>
                    <span className="font-bold">{analysis.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      الإعجابات
                    </span>
                    <span className="font-bold">{analysis.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      المشاركات
                    </span>
                    <span className="font-bold">{analysis.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      التقييم
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(analysis.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : darkMode
                                ? 'text-gray-600'
                                : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm mr-1">
                        ({Math.round(analysis.rating * 20)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* زاوية التحليل */}
              <div className={`rounded-lg p-6 ${darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'} border`}>
                <h3 className="font-bold text-lg mb-2">زاوية التحليل</h3>
                <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                  مقال يعتمد على تحليل معمّق للبيانات والتحولات الرقمية
                </p>
                {analysis.author && (
                  <div className="mt-4 flex items-center gap-3">
                    {analysis.authorAvatar ? (
                      <img 
                        src={analysis.authorAvatar} 
                        alt={analysis.author}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-purple-800' : 'bg-purple-200'}`}>
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{analysis.author}</p>
                      {analysis.authorRole && (
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {analysis.authorRole}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile TOC Button */}
            <button
              onClick={() => setShowMobileToc(!showMobileToc)}
              className={`lg:hidden fixed bottom-20 left-4 z-40 p-3 rounded-full shadow-lg ${
                darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              {showMobileToc ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile TOC Modal */}
            {showMobileToc && (
              <div className="lg:hidden fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileToc(false)} />
                <div className={`relative min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                  <div className="sticky top-0 p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">فهرس المحتويات</h3>
                      <button onClick={() => setShowMobileToc(false)}>
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  <nav className="p-4 space-y-2">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-right py-3 px-4 rounded-lg ${
                          activeSection === item.id
                            ? darkMode 
                              ? 'bg-blue-900/30 text-blue-400' 
                              : 'bg-blue-50 text-blue-600'
                            : darkMode
                              ? 'text-gray-300'
                              : 'text-gray-700'
                        } ${item.level === 3 ? 'mr-4 text-sm' : ''}`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}
          </aside>

          {/* Main Article Content */}
          <main className="lg:col-span-9">
            <article 
              ref={contentRef}
              className={`prose prose-lg max-w-none ${
                darkMode ? 'prose-invert' : ''
              } prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-p:mb-4 prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:pr-4 prose-blockquote:italic prose-ul:list-disc prose-ul:mr-6 prose-li:mb-2`}
              dangerouslySetInnerHTML={{ __html: analysis.contentHtml }}
            />

            {/* AI Section */}
            {(analysis.aiSummary || analysis.aiQuestions) && (
              <div className={`mt-12 p-6 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  زاوية الذكاء الاصطناعي
                </h2>
                
                {analysis.aiSummary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">ملخص آلي للمقال</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {analysis.aiSummary}
                    </p>
                  </div>
                )}

                {analysis.aiQuestions && analysis.aiQuestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">أسئلة مثارة من الخوارزميات</h3>
                    <ul className="space-y-2">
                      {analysis.aiQuestions.map((question, index) => (
                        <li key={index} className={`flex items-start gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="text-purple-500 mt-1">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`px-3 py-1 rounded-full text-sm ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Hash className="w-3 h-3 inline ml-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  liked
                    ? 'bg-red-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                {liked ? 'تم الإعجاب' : 'أعجبني'} ({analysis.likes})
              </button>

              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Share2 className="w-5 h-5" />
                مشاركة
              </button>

              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                {saved ? 'تم الحفظ' : 'حفظ'}
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                تحميل PDF
              </button>

              <button
                onClick={handlePrint}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <Printer className="w-5 h-5" />
                طباعة
              </button>
            </div>

            {/* Related Articles */}
            {analysis.relatedArticles && analysis.relatedArticles.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">مقالات ذات صلة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/insights/deep/${article.id}`}
                      className={`block p-6 rounded-lg border transition-all hover:shadow-lg ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {article.summary}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {article.readTime} دقائق قراءة
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {article.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 left-8 z-40 p-3 rounded-full shadow-lg transition-all ${
            darkMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          main, main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          aside, button, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
} 