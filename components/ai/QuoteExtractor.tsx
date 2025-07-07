'use client';

import React, { useState } from 'react';
import { Quote, Share2, Download, Copy, Sparkles, Heart } from 'lucide-react';

interface ExtractedQuote {
  id: string;
  text: string;
  context: string;
  author: string;
  importance: number;
  category: 'wisdom' | 'insight' | 'analysis' | 'opinion';
  keywords: string[];
}

interface QuoteExtractorProps {
  articleId: string;
  articleTitle: string;
  articleContent: string;
  authorName: string;
  onQuoteSelect?: (quote: ExtractedQuote) => void;
}

export default function QuoteExtractor({ 
  articleId, 
  articleTitle, 
  articleContent, 
  authorName,
  onQuoteSelect 
}: QuoteExtractorProps) {
  const [extractedQuotes, setExtractedQuotes] = useState<ExtractedQuote[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<ExtractedQuote | null>(null);
  const [showQuoteCard, setShowQuoteCard] = useState(false);

  // استخراج الاقتباسات الذكية
  const extractQuotes = async () => {
    setIsExtracting(true);
    
    try {
      // محاكاة AI لاستخراج الاقتباسات
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // اقتباسات وهمية - يمكن استبدالها بـ AI حقيقي
      const mockQuotes: ExtractedQuote[] = [
        {
          id: '1',
          text: 'الذكاء الاصطناعي ليس مجرد تقنية، بل ثورة حقيقية ستغير وجه المستقبل',
          context: 'في معرض الحديث عن تأثير التقنية على المجتمع',
          author: authorName,
          importance: 9,
          category: 'insight',
          keywords: ['ذكاء اصطناعي', 'مستقبل', 'ثورة']
        },
        {
          id: '2', 
          text: 'النجاح لا يقاس بالسرعة، بل بالثبات على الطريق الصحيح',
          context: 'عند مناقشة استراتيجيات النمو المستدام',
          author: authorName,
          importance: 8,
          category: 'wisdom',
          keywords: ['نجاح', 'ثبات', 'استدامة']
        },
        {
          id: '3',
          text: 'رؤية 2030 ليست مجرد خطة، بل خارطة طريق لتحويل الأحلام إلى حقائق',
          context: 'في سياق التحدث عن التطوير والتنمية',
          author: authorName,
          importance: 8.5,
          category: 'analysis',
          keywords: ['رؤية 2030', 'تطوير', 'أحلام']
        }
      ];

      setExtractedQuotes(mockQuotes);
    } catch (error) {
      console.error('خطأ في استخراج الاقتباسات:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  // مشاركة الاقتباس
  const shareQuote = (quote: ExtractedQuote) => {
    const shareText = `"${quote.text}"\n\n- ${quote.author}\n\nمن مقال: ${articleTitle}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'اقتباس مميز',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('تم نسخ الاقتباس إلى الحافظة!');
    }
  };

  // نسخ الاقتباس
  const copyQuote = (quote: ExtractedQuote) => {
    const quoteText = `"${quote.text}" - ${quote.author}`;
    navigator.clipboard.writeText(quoteText);
    alert('تم نسخ الاقتباس!');
  };

  // إنشاء بطاقة اقتباس للمشاركة
  const createQuoteCard = (quote: ExtractedQuote) => {
    setSelectedQuote(quote);
    setShowQuoteCard(true);
  };

  // تحديد لون الفئة
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'wisdom': return 'from-purple-500 to-pink-500';
      case 'insight': return 'from-blue-500 to-cyan-500';
      case 'analysis': return 'from-green-500 to-teal-500';
      case 'opinion': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'wisdom': return 'حكمة';
      case 'insight': return 'رؤية';
      case 'analysis': return 'تحليل';
      case 'opinion': return 'رأي';
      default: return 'عام';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              استخراج الاقتباسات الذكية
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              اكتشف أهم الأفكار والحكم من المقال
            </p>
          </div>
        </div>

        {!extractedQuotes.length && (
          <button
            onClick={extractQuotes}
            disabled={isExtracting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جاري الاستخراج...
              </>
            ) : (
              <>
                <Quote className="w-4 h-4" />
                استخراج الاقتباسات
              </>
            )}
          </button>
        )}
      </div>

      {/* المحتوى */}
      {extractedQuotes.length > 0 ? (
        <div className="space-y-4">
          {extractedQuotes.map((quote) => (
            <div
              key={quote.id}
              className="group relative bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-md transition-all duration-300"
            >
              {/* شارة الفئة */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 bg-gradient-to-r ${getCategoryColor(quote.category)} text-white text-xs font-medium rounded-full`}>
                  {getCategoryLabel(quote.category)}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Heart className="w-3 h-3" />
                  <span>{quote.importance}/10</span>
                </div>
              </div>

              {/* النص */}
              <blockquote className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed mb-4 relative">
                <Quote className="absolute -top-2 -right-2 w-6 h-6 text-gray-300 dark:text-gray-600" />
                <div className="pr-8">
                  "{quote.text}"
                </div>
              </blockquote>

              {/* السياق */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                السياق: {quote.context}
              </p>

              {/* الكلمات المفتاحية */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quote.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyQuote(quote)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
                >
                  <Copy className="w-3 h-3" />
                  نسخ
                </button>
                
                <button
                  onClick={() => shareQuote(quote)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm"
                >
                  <Share2 className="w-3 h-3" />
                  مشاركة
                </button>
                
                <button
                  onClick={() => createQuoteCard(quote)}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm"
                >
                  <Download className="w-3 h-3" />
                  بطاقة
                </button>
              </div>
            </div>
          ))}

          {/* إعادة الاستخراج */}
          <div className="text-center pt-4">
            <button
              onClick={extractQuotes}
              disabled={isExtracting}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              استخراج اقتباسات أخرى
            </button>
          </div>
        </div>
      ) : !isExtracting && (
        <div className="text-center py-8">
          <Quote className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            لم يتم استخراج أي اقتباسات بعد
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            اضغط على "استخراج الاقتباسات" للبدء
          </p>
        </div>
      )}

      {/* نافذة بطاقة الاقتباس */}
      {showQuoteCard && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                بطاقة الاقتباس
              </h4>
              
              {/* معاينة البطاقة */}
              <div className={`bg-gradient-to-br ${getCategoryColor(selectedQuote.category)} p-6 rounded-xl text-white mb-6`}>
                <Quote className="w-8 h-8 mx-auto mb-4 opacity-70" />
                <blockquote className="text-lg leading-relaxed mb-4">
                  "{selectedQuote.text}"
                </blockquote>
                <cite className="text-sm opacity-90">
                  — {selectedQuote.author}
                </cite>
                <div className="mt-4 text-xs opacity-70">
                  من مقال: {articleTitle}
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // محاكاة تحميل البطاقة
                    alert('سيتم تحميل البطاقة قريباً!');
                  }}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  تحميل البطاقة
                </button>
                <button
                  onClick={() => setShowQuoteCard(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 