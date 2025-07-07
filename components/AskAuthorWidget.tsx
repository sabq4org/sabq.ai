'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Send, User, Clock, Heart, Sparkles,
  ChevronDown, ChevronUp, Mic, MicOff, Volume2, X
} from 'lucide-react';
import { generatePlaceholderImage } from '@/lib/cloudinary';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  specialization?: string;
  is_online?: boolean;
  response_time?: string;
}

interface Question {
  id: string;
  text: string;
  author_name: string;
  created_at: string;
  likes: number;
  answer?: string;
  answer_date?: string;
}

interface AskAuthorWidgetProps {
  authors: Author[];
  popularQuestions?: Question[];
  className?: string;
}

export default function AskAuthorWidget({
  authors,
  popularQuestions = [],
  className = ''
}: AskAuthorWidgetProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [question, setQuestion] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // تحديث ارتفاع textarea تلقائياً
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question]);

  // إرسال السؤال
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !selectedAuthor || isSubmitting) return;

    setIsSubmitting(true);
    
    // محاكاة إرسال السؤال
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setQuestionSent(true);
    setQuestion('');
    setIsSubmitting(false);
    
    // إخفاء رسالة النجاح بعد 3 ثواني
    setTimeout(() => {
      setQuestionSent(false);
    }, 3000);
  };

  // بدء/إيقاف التسجيل الصوتي
  const toggleRecording = () => {
    if (!isRecording) {
      // بدء التسجيل
      setIsRecording(true);
      // محاكاة التسجيل
      setTimeout(() => {
        setIsRecording(false);
        setQuestion(prev => prev + (prev ? ' ' : '') + '[تم إدراج تسجيل صوتي]');
      }, 3000);
    } else {
      // إيقاف التسجيل
      setIsRecording(false);
    }
  };

  // اقتراحات الأسئلة السريعة
  const quickQuestions = [
    'ما رأيك في التطورات الحديثة؟',
    'كيف تحلل الوضع الحالي؟',
    'ما توقعاتك للمستقبل؟',
    'ما نصيحتك للشباب؟'
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* الهيدر */}
      <div
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">اسأل الكاتب</h3>
              <p className="text-blue-100 text-sm">
                {authors.filter(a => a.is_online).length} كاتب متصل الآن
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* المحتوى القابل للطي */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* اختيار الكاتب */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اختر الكاتب المراد سؤاله
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {authors.slice(0, 5).map((author) => (
                <button
                  key={author.id}
                  onClick={() => setSelectedAuthor(author)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedAuthor?.id === author.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={author.avatar || generatePlaceholderImage(author.name)}
                      alt={author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      author.is_online ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {author.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {author.specialization && (
                        <span>{author.specialization}</span>
                      )}
                      {author.is_online && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>يرد خلال {author.response_time || '1-2 ساعة'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {author.is_online && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* نموذج السؤال */}
          {selectedAuthor && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  سؤالك لـ {selectedAuthor.name}
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="اكتب سؤالك هنا... يمكنك أيضاً استخدام التسجيل الصوتي"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    maxLength={500}
                  />
                  
                  {/* أزرار التسجيل والإرسال */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`p-2 rounded-full transition-colors ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                      }`}
                      title={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل الصوتي'}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    
                    <span className="text-xs text-gray-500">
                      {question.length}/500
                    </span>
                  </div>
                </div>
              </div>

              {/* اقتراحات سريعة */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">اقتراحات سريعة:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setQuestion(q)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* زر الإرسال */}
              <button
                type="submit"
                disabled={!question.trim() || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  !question.trim() || isSubmitting
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال السؤال</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* رسالة نجاح الإرسال */}
          {questionSent && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">تم إرسال سؤالك بنجاح!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                سيتم إشعارك عند رد {selectedAuthor?.name} على سؤالك
              </p>
            </div>
          )}

          {/* الأسئلة الشائعة */}
          {popularQuestions.length > 0 && (
            <div>
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="flex items-center justify-between w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <span>الأسئلة الشائعة ({popularQuestions.length})</span>
                {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showQuestions && (
                <div className="space-y-3 mt-3 max-h-60 overflow-y-auto">
                  {popularQuestions.slice(0, 3).map((q) => (
                    <div key={q.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {q.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {q.author_name} • {q.created_at}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs ml-1">{q.likes}</span>
                        </button>
                      </div>
                      
                      {q.answer && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mt-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {q.answer}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            تم الرد في {q.answer_date}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* مؤشر النشاط */}
      {!isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {authors.filter(a => a.is_online).length} كاتب متصل
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 dark:text-green-400 text-xs">نشط</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 