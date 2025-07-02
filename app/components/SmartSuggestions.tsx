'use client';

import { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Clock, Star, Search } from 'lucide-react';

interface SmartSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  currentSearch?: string;
  articleTitle?: string;
}

interface Suggestion {
  text: string;
  type: 'trending' | 'entity' | 'context' | 'recent';
  confidence: number;
  icon: any;
}

export default function SmartSuggestions({ 
  onSuggestionClick, 
  currentSearch, 
  articleTitle 
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // الاقتراحات الثابتة الشائعة
  const defaultSuggestions: Suggestion[] = [
    { text: 'الملك سلمان بن عبدالعزيز', type: 'entity', confidence: 0.95, icon: Star },
    { text: 'ولي العهد محمد بن سلمان', type: 'entity', confidence: 0.94, icon: Star },
    { text: 'وزارة التعليم', type: 'entity', confidence: 0.85, icon: TrendingUp },
    { text: 'الرياض', type: 'entity', confidence: 0.82, icon: TrendingUp },
    { text: 'نيوم', type: 'trending', confidence: 0.88, icon: Zap },
    { text: 'رؤية 2030', type: 'trending', confidence: 0.90, icon: Zap },
    { text: 'اليوم الوطني', type: 'trending', confidence: 0.75, icon: TrendingUp },
    { text: 'كأس العالم 2022', type: 'recent', confidence: 0.70, icon: Clock }
  ];

  // توليد اقتراحات ذكية بناءً على السياق
  const generateSmartSuggestions = async () => {
    setIsLoading(true);
    
    try {
      let contextualSuggestions: Suggestion[] = [];
      
      // تحليل عنوان المقال إذا كان متاحاً
      if (articleTitle) {
        contextualSuggestions = analyzeArticleTitle(articleTitle);
      }
      
      // تحليل البحث الحالي
      if (currentSearch && currentSearch.length > 2) {
        const searchSuggestions = analyzeCurrentSearch(currentSearch);
        contextualSuggestions = [...contextualSuggestions, ...searchSuggestions];
      }
      
      // دمج الاقتراحات مع الافتراضية
      const allSuggestions = [
        ...contextualSuggestions,
        ...defaultSuggestions.filter(def => 
          !contextualSuggestions.some(ctx => ctx.text === def.text)
        )
      ];
      
      // ترتيب حسب الثقة والأهمية
      const sortedSuggestions = allSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8);
      
      setSuggestions(sortedSuggestions);
      
    } catch (error) {
      console.error('فشل في توليد الاقتراحات:', error);
      setSuggestions(defaultSuggestions.slice(0, 6));
    } finally {
      setIsLoading(false);
    }
  };

  // تحليل عنوان المقال لاستخراج الكيانات المرتبطة
  const analyzeArticleTitle = (title: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    
    // كشف الشخصيات المهمة
    const personalities = [
      { keywords: ['الملك', 'خادم الحرمين'], suggestion: 'الملك سلمان بن عبدالعزيز' },
      { keywords: ['ولي العهد', 'الأمير محمد'], suggestion: 'ولي العهد محمد بن سلمان' },
      { keywords: ['وزير التعليم'], suggestion: 'وزارة التعليم' },
      { keywords: ['وزير الصحة'], suggestion: 'وزارة الصحة' },
      { keywords: ['وزير الداخلية'], suggestion: 'وزارة الداخلية' }
    ];
    
    personalities.forEach(({ keywords, suggestion }) => {
      if (keywords.some(keyword => title.includes(keyword))) {
        suggestions.push({
          text: suggestion,
          type: 'context',
          confidence: 0.92,
          icon: Star
        });
      }
    });
    
    // كشف المواقع
    const locations = [
      'الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'تبوك', 'نيوم', 'القدية'
    ];
    
    locations.forEach(location => {
      if (title.includes(location)) {
        suggestions.push({
          text: location,
          type: 'context',
          confidence: 0.85,
          icon: TrendingUp
        });
      }
    });
    
    // كشف الفعاليات والمشاريع
    const events = [
      { keywords: ['اليوم الوطني', 'العيد الوطني'], suggestion: 'اليوم الوطني السعودي' },
      { keywords: ['رؤية 2030'], suggestion: 'رؤية المملكة 2030' },
      { keywords: ['كأس العالم'], suggestion: 'كأس العالم 2022' },
      { keywords: ['مؤتمر', 'قمة'], suggestion: 'مؤتمرات' }
    ];
    
    events.forEach(({ keywords, suggestion }) => {
      if (keywords.some(keyword => title.includes(keyword))) {
        suggestions.push({
          text: suggestion,
          type: 'context',
          confidence: 0.80,
          icon: Zap
        });
      }
    });
    
    return suggestions;
  };

  // تحليل البحث الحالي لتقديم اقتراحات مشابهة
  const analyzeCurrentSearch = (search: string): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const searchLower = search.toLowerCase();
    
    // اقتراحات مرتبطة بالكلمات المفتاحية
    const relatedTerms: { [key: string]: string[] } = {
      'ملك': ['الملك سلمان', 'الملك عبدالعزيز', 'القصر الملكي'],
      'ولي': ['ولي العهد محمد بن سلمان', 'ولي العهد'],
      'وزارة': ['وزارة التعليم', 'وزارة الصحة', 'وزارة الداخلية'],
      'رياض': ['الرياض', 'أمانة الرياض', 'منطقة الرياض'],
      'تقنية': ['وزارة الاتصالات', 'التحول الرقمي', 'الذكاء الاصطناعي'],
      'رياضة': ['الهلال', 'النصر', 'الاتحاد', 'كأس العالم']
    };
    
    Object.entries(relatedTerms).forEach(([key, terms]) => {
      if (searchLower.includes(key)) {
        terms.forEach(term => {
          if (!term.toLowerCase().includes(searchLower)) {
            suggestions.push({
              text: term,
              type: 'context',
              confidence: 0.75,
              icon: Search
            });
          }
        });
      }
    });
    
    return suggestions;
  };

  // تحديث الاقتراحات عند تغيير المدخلات
  useEffect(() => {
    generateSmartSuggestions();
  }, [articleTitle, currentSearch]);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-medium text-gray-800">اقتراحات ذكية</h3>
        {isLoading && (
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm
                transition-all duration-200 hover:shadow-md
                ${suggestion.type === 'trending' 
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200' 
                  : suggestion.type === 'entity'
                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'
                  : suggestion.type === 'context'
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                }
              `}
            >
              <IconComponent className="w-3 h-3" />
              {suggestion.text}
              {suggestion.confidence > 0.9 && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title="ثقة عالية" />
              )}
            </button>
          );
        })}
      </div>
      
      {articleTitle && (
        <div className="mt-3 text-xs text-gray-600">
          <Brain className="w-3 h-3 inline ml-1" />
          تم تحليل عنوان المقال: "{articleTitle.slice(0, 50)}..."
        </div>
      )}
    </div>
  );
}
