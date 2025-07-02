'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDarkMode } from '@/hooks/useDarkMode';
import { 
  Mail,
  Archive,
  Trash2,
  Search,
  Eye,
  Reply,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Download,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Flag,
  MessageCircle,
  Heart,
  MessageSquare,
  X,
  Loader2,
  TrendingUp,
  Database,
  HelpCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'suggestion' | 'complaint' | 'feedback' | 'appreciation' | 'inquiry' | 'other';
  subject: string;
  message: string;
  email: string;
  file_url?: string;
  status: 'new' | 'read' | 'processed' | 'archived';
  created_at: string;
  updated_at?: string;
  response?: string;
  responded_at?: string;
  responded_by?: string;
}

// أيقونات وألوان أنواع الرسائل
const messageTypeConfig = {
  suggestion: { icon: Lightbulb, color: 'blue', label: 'اقتراح', bgLight: 'bg-blue-100', bgDark: 'bg-blue-900/30', textLight: 'text-blue-700', textDark: 'text-blue-400' },
  complaint: { icon: Flag, color: 'red', label: 'بلاغ', bgLight: 'bg-red-100', bgDark: 'bg-red-900/30', textLight: 'text-red-700', textDark: 'text-red-400' },
  inquiry: { icon: HelpCircle, color: 'purple', label: 'استفسار', bgLight: 'bg-purple-100', bgDark: 'bg-purple-900/30', textLight: 'text-purple-700', textDark: 'text-purple-400' },
  feedback: { icon: MessageCircle, color: 'yellow', label: 'ملاحظة', bgLight: 'bg-yellow-100', bgDark: 'bg-yellow-900/30', textLight: 'text-yellow-700', textDark: 'text-yellow-400' },
  appreciation: { icon: Heart, color: 'pink', label: 'شكر وتقدير', bgLight: 'bg-pink-100', bgDark: 'bg-pink-900/30', textLight: 'text-pink-700', textDark: 'text-pink-400' },
  other: { icon: MessageSquare, color: 'gray', label: 'أخرى', bgLight: 'bg-gray-100', bgDark: 'bg-gray-900/30', textLight: 'text-gray-700', textDark: 'text-gray-400' }
};

// حالات الرسائل
const statusConfig = {
  new: { label: 'جديد', color: 'blue', icon: AlertCircle },
  read: { label: 'مقروء', color: 'gray', icon: Eye },
  processed: { label: 'تمت المعالجة', color: 'green', icon: CheckCircle },
  archived: { label: 'مؤرشف', color: 'yellow', icon: Archive }
};

function MessagesContent() {
  const { darkMode } = useDarkMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams?.get('type') || 'all');
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    processed: 0,
    mostFrequentType: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // جلب الرسائل
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (activeTab !== 'all') params.append('type', activeTab);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/messages?${params}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        setPagination(data.pagination);
        
        // حساب الإحصائيات
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // حساب الإحصائيات
  const calculateStats = (messagesData: Message[]) => {
    const allMessages = messagesData;
    const newMessages = allMessages.filter(m => m.status === 'new');
    const processedMessages = allMessages.filter(m => m.status === 'processed');
    
    // حساب النوع الأكثر تكراراً
    const typeCounts: Record<string, number> = {};
    allMessages.forEach(msg => {
      typeCounts[msg.type] = (typeCounts[msg.type] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0]] > typeCounts[b[0]] ? a : b, ['', 0]
    )[0];

    setStats({
      total: pagination.total || allMessages.length,
      new: newMessages.length,
      processed: processedMessages.length,
      mostFrequentType: mostFrequent
    });
  };

  useEffect(() => {
    fetchMessages();
  }, [filters, pagination.page, activeTab]);

  // تحديث URL عند تغيير التبويب
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams || '');
    if (tab === 'all') {
      params.delete('type');
    } else {
      params.set('type', tab);
    }
    router.push(`?${params.toString()}`);
    setPagination({ ...pagination, page: 1 });
  };

  // تحديث حالة الرسالة
  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId, status })
      });

      if (response.ok) {
        fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, status: status as any });
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // إرسال رد
  const sendReply = async () => {
    if (!selectedMessage || !replyText) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedMessage.id,
          status: 'processed',
          response: replyText,
          responded_by: 'Admin'
        })
      });

      if (response.ok) {
        setShowReplyModal(false);
        setReplyText('');
        fetchMessages();
        alert('تم إرسال الرد بنجاح');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  // حذف رسالة
  const deleteMessage = async (messageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    try {
      const response = await fetch(`/api/messages?id=${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMessages();
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // تصفية الرسائل محلياً بحسب البحث
  const filteredMessages = messages.filter(msg => 
    !filters.search || 
    msg.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
    msg.email.toLowerCase().includes(filters.search.toLowerCase()) ||
    msg.message.toLowerCase().includes(filters.search.toLowerCase())
  );

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'منذ أقل من ساعة';
    } else if (diffInHours < 24) {
      return `منذ ${Math.floor(diffInHours)} ساعة`;
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  };

  // تصدير CSV
  const exportToCSV = () => {
    // التحقق من أن الكود يعمل في المتصفح فقط
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("Export CSV is only available in browser environment");
      return;
    }

    const headers = ['التاريخ', 'البريد الإلكتروني', 'النوع', 'الموضوع', 'الرسالة', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...filteredMessages.map(msg => [
        new Date(msg.created_at).toLocaleString('ar-SA'),
        msg.email,
        messageTypeConfig[msg.type].label,
        msg.subject,
        `"${msg.message.replace(/"/g, '""')}"`,
        statusConfig[msg.status].label
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `messages_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // مكون بطاقة الإحصائية
  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgColor,
    iconColor
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm mb-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{loading ? '...' : value}</span>
            {subtitle && (
              <span className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{subtitle}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // مكون أزرار التنقل (التبويبات)
  const NavigationTabs = () => {
    const tabs = [
      { id: 'all', name: 'الكل', icon: Database, count: stats.total },
      { id: 'suggestion', name: 'اقتراح', icon: Lightbulb, count: 0 },
      { id: 'complaint', name: 'بلاغ', icon: Flag, count: 0 },
      { id: 'inquiry', name: 'استفسار', icon: HelpCircle, count: 0 },
      { id: 'appreciation', name: 'شكر وتقدير', icon: Heart, count: 0 },
      { id: 'other', name: 'أخرى', icon: MessageSquare, count: 0 }
    ];

    // حساب عدد الرسائل لكل نوع
    messages.forEach(msg => {
      const tab = tabs.find(t => t.id === msg.type);
      if (tab) tab.count++;
    });

    return (
      <div className={`rounded-2xl p-2 shadow-sm border mb-8 w-full transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 justify-start pr-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const config = tab.id !== 'all' ? messageTypeConfig[tab.id as keyof typeof messageTypeConfig] : null;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`min-w-[150px] flex flex-col items-center justify-center gap-2 py-4 pb-3 px-3 rounded-xl font-medium text-sm transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {/* خط سفلي للتاب النشط */}
                {isActive && (
                  <div className="absolute bottom-0 left-6 right-6 h-1 bg-white/30 rounded-full" />
                )}
                
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className={isActive ? 'font-semibold' : ''}>{tab.name}</span>
                {tab.count > 0 && (
                  <span className={`absolute -top-1 -right-1 px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-md'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>صندوق الرسائل</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>إدارة وتتبع جميع رسائل واستفسارات المستخدمين</p>
      </div>

      {/* قسم نظام الرسائل */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام إدارة الرسائل</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>تصفح وإدارة جميع الرسائل الواردة من المستخدمين بكفاءة</p>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="عدد الرسائل الكلي"
          value={stats.total}
          subtitle="رسالة"
          icon={Database}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="الرسائل الجديدة"
          value={stats.new}
          subtitle="رسالة جديدة"
          icon={AlertCircle}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="الرسائل المعالجة"
          value={stats.processed}
          subtitle="تمت معالجتها"
          icon={CheckCircle}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="أكثر نوع متكرر"
          value={stats.mostFrequentType ? messageTypeConfig[stats.mostFrequentType as keyof typeof messageTypeConfig]?.label || '' : '-'}
          icon={TrendingUp}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* أزرار التنقل (التبويبات) */}
      <NavigationTabs />

      {/* أدوات الفلترة والتصدير */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="بحث في الرسائل..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <option value="">جميع الحالات</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>

          <button
            onClick={() => setFilters({ status: '', search: '' })}
            className={`px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            مسح الفلاتر
          </button>
        </div>
      </div>

      {/* Split View: قائمة الرسائل وتفاصيل الرسالة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className={`lg:col-span-1 rounded-2xl shadow-sm overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              قائمة الرسائل ({filteredMessages.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredMessages.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredMessages.map((message) => {
                const typeConfig = messageTypeConfig[message.type];
                const TypeIcon = typeConfig.icon;
                const statusConf = statusConfig[message.status];
                const StatusIcon = statusConf.icon;

                return (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id
                        ? darkMode ? 'bg-gray-700' : 'bg-blue-50'
                        : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? typeConfig.bgDark : typeConfig.bgLight}`}>
                        <TypeIcon className={`w-4 h-4 ${darkMode ? typeConfig.textDark : typeConfig.textLight}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium truncate ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {message.subject}
                          </h3>
                          <StatusIcon className={`w-4 h-4 text-${statusConf.color}-500`} />
                        </div>
                        <p className={`text-sm truncate ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {message.email}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {formatDate(message.created_at)}
                          </span>
                          {message.file_url && (
                            <Paperclip className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className={`w-12 h-12 mx-auto mb-3 ${
                darkMode ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                لا توجد رسائل
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Details */}
        <div className={`lg:col-span-2 rounded-2xl shadow-sm ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        من: {selectedMessage.email}
                      </span>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {new Date(selectedMessage.created_at).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Message Type Badge */}
                    {(() => {
                      const typeConfig = messageTypeConfig[selectedMessage.type];
                      const TypeIcon = typeConfig.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          darkMode ? `${typeConfig.bgDark} ${typeConfig.textDark}` : `${typeConfig.bgLight} ${typeConfig.textLight}`
                        }`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeConfig.label}
                        </span>
                      );
                    })()}

                    {/* Status Badge */}
                    {(() => {
                      const statusConf = statusConfig[selectedMessage.status];
                      const StatusIcon = statusConf.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${statusConf.color}-100 text-${statusConf.color}-700 dark:bg-${statusConf.color}-900/30 dark:text-${statusConf.color}-400`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConf.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {selectedMessage.status === 'new' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4 ml-1 inline-block" />
                      تعيين كمقروء
                    </button>
                  )}
                  
                  {selectedMessage.status !== 'processed' && (
                    <button
                      onClick={() => setShowReplyModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Reply className="w-4 h-4 ml-1 inline-block" />
                      رد
                    </button>
                  )}

                  {selectedMessage.status !== 'archived' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Archive className="w-4 h-4 ml-1 inline-block" />
                      أرشفة
                    </button>
                  )}

                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 ml-1 inline-block" />
                    حذف
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-6">
                <div className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    نص الرسالة:
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>

                {/* Attachment */}
                {selectedMessage.file_url && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      المرفقات:
                    </h3>
                    <a
                      href={selectedMessage.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
                    >
                      <Paperclip className="w-4 h-4" />
                      عرض الملف المرفق
                    </a>
                  </div>
                )}

                {/* Response */}
                {selectedMessage.response && (
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-green-900/20' : 'bg-green-50'
                  }`}>
                    <h3 className={`font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                      الرد:
                    </h3>
                    <p className={`whitespace-pre-wrap ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedMessage.response}
                    </p>
                    {selectedMessage.responded_at && (
                      <p className={`text-sm mt-2 ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        تم الرد بواسطة {selectedMessage.responded_by} في{' '}
                        {new Date(selectedMessage.responded_at).toLocaleString('ar-SA')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-32">
              <div className="text-center">
                <Mail className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  اختر رسالة لعرض التفاصيل
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-2xl w-full rounded-xl shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  الرد على الرسالة
                </h3>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className={`mb-4 p-4 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  الرد على: {selectedMessage.email}
                </p>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  بخصوص: {selectedMessage.subject}
                </p>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك هنا..."
                rows={6}
                className={`w-full px-4 py-3 rounded-lg border resize-none ${
                  darkMode
                    ? 'bg-gray-900 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              />
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  إرسال الرد
                </button>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">جارٍ التحميل...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
} 