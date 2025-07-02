'use client';

import { useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Send, 
  Mail, 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  FileVideo,
  Lightbulb,
  Flag,
  MessageCircle,
  Heart,
  HelpCircle,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Star,
  Zap
} from 'lucide-react';

// أنواع الرسائل مع ألوان محسنة ولمسات ناعمة
const messageTypes = [
  { 
    value: 'suggestion', 
    label: 'اقتراح', 
    icon: Lightbulb, 
    color: 'from-blue-400 to-blue-600', 
    bgColor: 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    hoverGradient: 'hover:from-blue-100 hover:to-sky-100 dark:hover:from-blue-900/30 dark:hover:to-sky-900/30',
    shadowColor: 'shadow-blue-200/50 dark:shadow-blue-900/50'
  },
  { 
    value: 'complaint', 
    label: 'بلاغ', 
    icon: Flag, 
    color: 'from-red-400 to-rose-600', 
    bgColor: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    hoverGradient: 'hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/30 dark:hover:to-rose-900/30',
    shadowColor: 'shadow-red-200/50 dark:shadow-red-900/50'
  },
  { 
    value: 'inquiry', 
    label: 'استفسار', 
    icon: HelpCircle, 
    color: 'from-purple-400 to-indigo-600', 
    bgColor: 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    hoverGradient: 'hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30',
    shadowColor: 'shadow-purple-200/50 dark:shadow-purple-900/50'
  },
  { 
    value: 'feedback', 
    label: 'ملاحظة', 
    icon: MessageCircle, 
    color: 'from-amber-400 to-orange-600', 
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    hoverGradient: 'hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30',
    shadowColor: 'shadow-amber-200/50 dark:shadow-amber-900/50'
  },
  { 
    value: 'appreciation', 
    label: 'شكر وتقدير', 
    icon: Heart, 
    color: 'from-pink-400 to-rose-600', 
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    hoverGradient: 'hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30',
    shadowColor: 'shadow-pink-200/50 dark:shadow-pink-900/50'
  },
  { 
    value: 'other', 
    label: 'أخرى', 
    icon: MessageSquare, 
    color: 'from-gray-400 to-slate-600', 
    bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    hoverGradient: 'hover:from-gray-100 hover:to-slate-100 dark:hover:from-gray-900/30 dark:hover:to-slate-900/30',
    shadowColor: 'shadow-gray-200/50 dark:shadow-gray-900/50'
  }
];

// معلومات التواصل
const contactInfo = [
  { icon: Phone, label: 'الهاتف', value: '+966 11 123 4567', color: 'text-green-500' },
  { icon: Mail, label: 'البريد الإلكتروني', value: 'info@sabq.org', color: 'text-blue-500' },
  { icon: MapPin, label: 'العنوان', value: 'الرياض، المملكة العربية السعودية', color: 'text-red-500' },
  { icon: Clock, label: 'ساعات العمل', value: 'الأحد - الخميس: 9 ص - 5 م', color: 'text-purple-500' }
];

// أنواع الملفات المسموح بها
const allowedFileTypes = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf'],
  video: ['video/mp4', 'video/webm', 'video/ogg']
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

export default function ContactPage() {
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    message: '',
    email: '',
    attachment: null as File | null
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // التحقق من صحة البريد الإلكتروني
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // التحقق من الملف
  const validateFile = (file: File) => {
    const allAllowedTypes = [
      ...allowedFileTypes.image,
      ...allowedFileTypes.document,
      ...allowedFileTypes.video
    ];

    if (!allAllowedTypes.includes(file.type)) {
      return 'نوع الملف غير مسموح. يُسمح فقط بالصور، PDF، والفيديوهات القصيرة';
    }

    if (file.size > maxFileSize) {
      return 'حجم الملف كبير جداً. الحد الأقصى 10MB';
    }

    return null;
  };

  // معالج رفع الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setErrors({ ...errors, attachment: error });
        return;
      }
      setFormData({ ...formData, attachment: file });
      setErrors({ ...errors, attachment: null });
    }
  };

  // إزالة الملف
  const removeFile = () => {
    setFormData({ ...formData, attachment: null });
    setErrors({ ...errors, attachment: null });
  };

  // الحصول على أيقونة الملف
  const getFileIcon = (file: File) => {
    if (allowedFileTypes.image.includes(file.type)) return ImageIcon;
    if (allowedFileTypes.document.includes(file.type)) return FileText;
    if (allowedFileTypes.video.includes(file.type)) return FileVideo;
    return FileText;
  };

  // التحقق من صحة النموذج
  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.type) {
      newErrors.type = 'يرجى اختيار نوع الرسالة';
    }

    if (!formData.subject || formData.subject.length < 5) {
      newErrors.subject = 'يرجى كتابة عنوان واضح (5 أحرف على الأقل)';
    }

    if (formData.subject.length > 100) {
      newErrors.subject = 'العنوان طويل جداً (100 حرف كحد أقصى)';
    }

    if (!formData.message || formData.message.length < 20) {
      newErrors.message = 'يرجى كتابة رسالة واضحة (20 حرف على الأقل)';
    }

    if (!formData.email) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // رفع الملف إذا وجد
      let fileUrl = null;
      if (formData.attachment) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.attachment);
        
        // محاكاة تقدم الرفع
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrl = uploadData.url;
        }
      }

      // إرسال الرسالة
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: formData.type,
          subject: formData.subject,
          message: formData.message,
          email: formData.email,
          file_url: fileUrl,
          status: 'new',
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          type: '',
          subject: '',
          message: '',
          email: '',
          attachment: null
        });
        setUploadProgress(0);
        
        // إخفاء رسالة النجاح بعد 5 ثواني
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        throw new Error('فشل إرسال الرسالة');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <Header />

      {/* Hero Section - تصميم موحد مع الصفحات الأخرى */}
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
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-xl opacity-70 animate-pulse" />
            <div className="relative bg-gradient-to-br from-green-400 to-blue-500 rounded-full p-6 shadow-2xl">
              <MessageSquare className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
            تواصل معنا
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            نسعد بسماع آرائكم واقتراحاتكم. رسالتك تهمنا وستصل إلى الفريق المختص
          </p>
          
          {/* Stats with Glass Effect */}
          <div className="relative inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 rounded-2xl px-6 sm:px-8 py-4 shadow-xl">
            {/* خلفية سوداء أكثر كثافة */}
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-md rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 rounded-2xl" />
            <div className="absolute inset-0 rounded-2xl border border-white border-opacity-20" />
            
            <div className="relative text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">24h</div>
              <div className="text-xs sm:text-sm text-white">متوسط وقت الرد</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50 relative"></div>
            <div className="relative text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">98%</div>
              <div className="text-xs sm:text-sm text-white">رضا العملاء</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white bg-opacity-50 relative"></div>
            <div className="relative text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">10k+</div>
              <div className="text-xs sm:text-sm text-white">رسالة تم الرد عليها</div>
            </div>
          </div>
        </div>
      </section>

      {/* معلومات التواصل السريعة */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 mb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {contactInfo.map((info, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-800"
            >
              <div className={`inline-flex p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-3`}>
                <info.icon className={`w-6 h-6 ${info.color}`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{info.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{info.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section - تصميم محسن */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
          {/* Success Message - محسن */}
          {success && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-800 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-800 dark:text-green-300">
                    تم إرسال رسالتك بنجاح! 🎉
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    سنقوم بمراجعتها والرد عليك في أقرب وقت ممكن
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* نوع الرسالة - لمسات ناعمة */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  نوع الرسالة <span className="text-red-400 text-sm">*</span>
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">اختر النوع المناسب لرسالتك</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {messageTypes.map((type, index) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`relative p-5 rounded-2xl border transition-all duration-500 transform group overflow-hidden ${
                        isSelected
                          ? `${type.borderColor} ${type.bgColor} scale-[1.02] shadow-lg ${type.shadowColor}`
                          : `border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md ${type.hoverGradient} hover:border-opacity-50`
                      } hover:-translate-y-1`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      {/* خلفية متحركة ناعمة */}
                      {isSelected && (
                        <div className="absolute inset-0 opacity-10">
                          <div className={`absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${type.color} rounded-full blur-3xl animate-pulse`} />
                          <div className={`absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr ${type.color} rounded-full blur-3xl animate-pulse animation-delay-2000`} />
                        </div>
                      )}
                      
                      {/* شارة الاختيار */}
                      <div className={`absolute -top-2 -right-2 transition-all duration-300 ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                      }`}>
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur animate-pulse" />
                          <div className="relative bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-1">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* الأيقونة */}
                      <div className="mb-3 relative">
                        <div className={`inline-flex p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
                          isSelected 
                            ? 'bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/30 dark:to-gray-900/10 backdrop-blur-sm shadow-inner transform rotate-3' 
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 group-hover:from-white/50 group-hover:to-white/30 group-hover:rotate-3'
                        }`}>
                          <Icon className={`w-7 h-7 transition-all duration-300 ${
                            isSelected 
                              ? `text-transparent bg-gradient-to-r ${type.color} bg-clip-text drop-shadow`
                              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                          } group-hover:drop-shadow-md`} />
                        </div>
                        {/* تأثير التوهج للأيقونة */}
                        {isSelected && (
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${type.color} opacity-20 blur-xl`} />
                        )}
                      </div>
                      
                      {/* النص */}
                      <span className={`relative z-10 text-sm font-medium block transition-all duration-300 ${
                        isSelected 
                          ? 'text-gray-800 dark:text-white font-bold tracking-wide' 
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300'
                      }`}>
                        {type.label}
                      </span>
                      
                      {/* خط سفلي متحرك */}
                      <div className={`absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r ${type.color} transition-all duration-300 ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                      }`} />
                    </button>
                  );
                })}
              </div>
              
              {/* رسالة الخطأ بتصميم ناعم */}
              {errors.type && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl animate-shake">
                  <div className="p-1 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{errors.type}</p>
                </div>
              )}
            </div>

            {/* عنوان الرسالة - محسن */}
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-200">
                عنوان الرسالة <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  maxLength={100}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    errors.subject
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                  } bg-white dark:bg-black focus:shadow-lg focus:shadow-blue-500/20`}
                  placeholder="اكتب عنواناً واضحاً لرسالتك..."
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Zap className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                {errors.subject && (
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.subject}
                  </p>
                )}
                <span className={`text-xs ${
                  formData.subject.length > 80 ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  {formData.subject.length}/100
                </span>
              </div>
            </div>

            {/* نص الرسالة - محسن */}
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-200">
                نص الرسالة <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 resize-none ${
                  errors.message
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                } bg-white dark:bg-black focus:shadow-lg focus:shadow-blue-500/20`}
                placeholder="اكتب تفاصيل رسالتك هنا..."
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.message}
                </p>
              )}
            </div>

            {/* البريد الإلكتروني - محسن */}
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-200">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-300 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                  } bg-white dark:bg-black focus:shadow-lg focus:shadow-blue-500/20`}
                  placeholder="example@email.com"
                  dir="ltr"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                سنستخدم بريدك الإلكتروني للرد على رسالتك فقط
              </p>
            </div>

            {/* المرفقات - محسن */}
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-200">
                المرفقات <span className="text-gray-500 dark:text-gray-400">(اختياري)</span>
              </label>
              
              {!formData.attachment ? (
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 group">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={[...allowedFileTypes.image, ...allowedFileTypes.document, ...allowedFileTypes.video].join(',')}
                    className="hidden"
                  />
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      اضغط لرفع ملف أو اسحب وأفلت
                    </p>
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      صور، PDF، أو فيديو (حتى 10MB)
                    </p>
                  </div>
                </label>
              ) : (
                <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-black rounded-lg">
                        {(() => {
                          const FileIcon = getFileIcon(formData.attachment);
                          return <FileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
                        })()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-700 dark:text-gray-200">
                          {formData.attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                  
                  {/* Progress Bar - محسن */}
                  {loading && uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2 text-center text-gray-500 dark:text-gray-400">
                        جاري الرفع... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {errors.attachment && (
                <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.attachment}
                </p>
              )}
            </div>

            {/* Error Message - محسن */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-800 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-700 dark:text-red-400 text-sm">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Submit Button - محسن */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري إرسال رسالتك...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Send className="w-5 h-5" />
                    <span>إرسال الرسالة</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info - محسن */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              نحترم خصوصيتك ولن نشارك معلوماتك مع أي طرف ثالث
            </p>
          </div>
          <p className="text-xs mt-4 text-gray-500 dark:text-gray-300">
            جميع الرسائل تُعامل بسرية تامة ويتم الرد عليها من قبل فريق مختص
          </p>
        </div>
      </section>

      <Footer />
      
      <style jsx>{`
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
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* تأثيرات backdrop blur للمتصفحات المختلفة */
        .backdrop-blur-sm {
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
        }
        
        /* ظلال ناعمة */
        .shadow-inner {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        }
        
        /* تأثير drop-shadow للنصوص */
        .drop-shadow {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </div>
  );
} 