'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Check, 
  X, 
  Clock, 
  Flag, 
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Shield,
  UserX,
  Archive,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Brain
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { TabsEnhanced } from '@/components/ui/tabs-enhanced';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'reported' | 'archived' | 'ai-flagged';
  createdAt: string;
  article: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  guestName?: string;
  metadata?: any;
  _count?: {
    reports: number;
    replies: number;
  };
  reports?: any[];
  aiScore?: number;
  aiClassification?: string;
  aiAnalysis?: {
    score: number;
    classification: string;
    suggestedAction: string;
    flaggedWords?: string[];
    categories?: {
      toxicity?: number;
      threat?: number;
      harassment?: number;
      spam?: number;
      hate?: number;
    };
  };
}

export default function CommentsManagementPage() {
  const { darkMode } = useDarkModeContext();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    reported: 0,
    archived: 0,
    aiFlagged: 0,
    aiAccuracy: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'ai-flagged'>('all');

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [filter]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      let url = '/api/comments?include=user,article,aiAnalysis';
      
      if (filter === 'ai-flagged') {
        url += '&aiScore[lt]=50';
      } else if (filter === 'all') {
        url += '&status=all';
      } else {
        url += `&status=${filter}`;
      }
      
      console.log('Fetching comments with URL:', url);
      console.log('Current filter:', filter);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Received comments:', data.comments?.length || 0);
        console.log('Comments data:', data);
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/comments/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (commentId: string, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchComments();
      } else {
        alert(data.error || 'حدث خطأ في تحديث حالة التعليق');
      }
    } catch (error) {
      console.error('Error updating comment status:', error);
      alert('حدث خطأ في تحديث حالة التعليق');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const filteredComments = comments.filter(comment => {
    const searchLower = searchTerm.toLowerCase();
    return comment.content.toLowerCase().includes(searchLower) ||
      comment.article.title.toLowerCase().includes(searchLower) ||
      (comment.user?.name || comment.guestName || comment.metadata?.guestName || '').toLowerCase().includes(searchLower);
  });

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: ar 
      });
    } catch {
      return date;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected': return <X className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'reported': return <Flag className="w-4 h-4 text-orange-600" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-600" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (comment: Comment) => {
    const status = comment.status;
    const aiScore = comment.aiScore;
    
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          معتمد
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          مرفوض
        </span>
      );
    } else if (aiScore && aiScore < 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3" />
          مشبوه ({aiScore}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <MessageCircle className="w-3 h-3" />
          قيد المراجعة
        </span>
      );
    }
  };

  const getAIBadge = (classification?: string) => {
    if (!classification) return null;
    
    const badges: Record<string, { color: string; label: string }> = {
      safe: { color: 'bg-green-100 text-green-800', label: 'آمن' },
      toxic: { color: 'bg-red-100 text-red-800', label: 'مسيء' },
      spam: { color: 'bg-purple-100 text-purple-800', label: 'بريد عشوائي' },
      suspicious: { color: 'bg-yellow-100 text-yellow-800', label: 'مشكوك فيه' }
    };
    
    const badge = badges[classification] || { color: 'bg-gray-100 text-gray-800', label: classification };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Brain className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className={`p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : ''}`}>
      {/* عنوان الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>إدارة التعليقات الذكية</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>مراجعة وإدارة التعليقات بمساعدة الذكاء الاصطناعي</p>
      </div>

      {/* بطاقة نظام إدارة التعليقات */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام إدارة التعليقات الذكي</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>مراقبة وإدارة التعليقات مع نظام الإبلاغات والفلترة التلقائية</p>
            </div>
            <div className="mr-auto">
              <button
                onClick={fetchComments}
                className={`p-2 rounded-lg shadow-sm transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* التابات للفلترة */}
      <TabsEnhanced
                  tabs={[
            { id: 'all', name: 'الكل', icon: MessageCircle, count: stats.total },
            { id: 'pending', name: 'مراجعة', icon: AlertTriangle, count: stats.pending },
            { id: 'approved', name: 'معتمد', icon: CheckCircle, count: stats.approved },
            { id: 'rejected', name: 'مرفوض', icon: XCircle, count: stats.rejected },
            { id: 'reported', name: 'مبلغ', icon: Flag, count: stats.reported },
            { id: 'archived', name: 'مؤرشف', icon: Archive, count: stats.archived },
            { id: 'ai-flagged', name: 'مشبوه بـAI', icon: Shield, count: stats.aiFlagged }
          ]}
        activeTab={filter}
        onTabChange={(tabId) => {
          setFilter(tabId as any);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
      />

      {/* شريط البحث */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="البحث في التعليقات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>إجمالي التعليقات</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>قيد المراجعة</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.pending}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>معتمد</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>مرفوض</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>دقة الذكاء الاصطناعي</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.aiAccuracy}%</p>
            </div>
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

             {/* فلاتر */}
       <div className="flex gap-2 mb-6 flex-wrap">
         {[
           { value: 'all', label: 'الكل', icon: MessageCircle },
           { value: 'pending', label: 'مراجعة', icon: AlertTriangle },
           { value: 'ai-flagged', label: 'مشبوه بـAI', icon: Shield },
           { value: 'approved', label: 'معتمد', icon: CheckCircle },
           { value: 'rejected', label: 'مرفوض', icon: XCircle }
         ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filter === value
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* قائمة التعليقات */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      } overflow-hidden transition-colors duration-300`}>
        
        {/* رأس الجدول */}
        <div 
          style={{ 
            backgroundColor: darkMode ? '#1e3a5f' : '#f0fdff',
            borderBottom: darkMode ? '2px solid #2563eb' : '2px solid #dde9fc'
          }}
        >
          <div className="grid grid-cols-12 gap-4 px-6 py-4">
            <div className={`col-span-4 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                التعليق
              </div>
            </div>
            <div className={`col-span-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                المستخدم
              </div>
            </div>
            <div className={`col-span-3 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                المقال
              </div>
            </div>
            <div className={`col-span-1 text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              الحالة
            </div>
            <div className={`col-span-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                التاريخ
              </div>
            </div>
            <div className={`col-span-1 text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              الإجراءات
            </div>
          </div>
        </div>

        {/* محتوى الجدول */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                جارٍ تحميل التعليقات...
              </p>
            </div>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              لا توجد تعليقات
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: darkMode ? '#374151' : '#f4f8fe' }}>
            {filteredComments.map((comment, index) => (
              <div 
                key={comment.id} 
                className={`grid grid-cols-12 gap-4 px-6 py-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'} transition-colors duration-300`}
              >
                {/* محتوى التعليق */}
                <div className="col-span-4">
                  <p className={`text-sm mb-2 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    {comment._count?.replies && comment._count.replies > 0 && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <MessageCircle className="w-3 h-3" />
                        {comment._count.replies} رد
                      </span>
                    )}
                    {((comment._count?.reports && comment._count.reports > 0) || (comment.reports && comment.reports.length > 0)) && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="w-3 h-3" />
                        {comment._count?.reports || comment.reports?.length || 0} بلاغ
                      </span>
                    )}
                  </div>
                </div>

                {/* المستخدم */}
                <div className="col-span-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {comment.user?.name || comment.guestName || comment.metadata?.guestName || 'مستخدم مجهول'}
                    </p>
                    {comment.user?.email && (
                      <p className="text-xs text-gray-500">{comment.user.email}</p>
                    )}
                  </div>
                </div>

                {/* المقال */}
                <div className="col-span-3">
                  <a
                    href={`/article/${comment.article.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    {comment.article.title}
                  </a>
                </div>

                {/* الحالة */}
                <div className="col-span-1 text-center">
                  {getStatusBadge(comment)}
                </div>

                {/* التاريخ */}
                <div className="col-span-1">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                {/* الإجراءات */}
                <div className="col-span-1 flex items-center justify-center gap-1">
                  {comment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(comment.id, 'approved')}
                        className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-all"
                        title="اعتماد التعليق"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('سبب الرفض:');
                          if (reason) handleStatusChange(comment.id, 'rejected', reason);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                        title="رفض التعليق"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {comment.status === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'archived')}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                      title="نقل إلى الأرشيف"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  
                  {comment.status === 'reported' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(comment.id, 'approved')}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-all"
                        title="تجاهل البلاغات والموافقة على التعليق"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(comment.id, 'rejected', 'مخالف لسياسة الموقع')}
                        className="p-1.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-all"
                        title="حظر التعليق لمخالفته سياسة الموقع"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {comment.status === 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'approved')}
                      className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-all"
                      title="إعادة النظر والموافقة على التعليق"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  
                  {comment.status === 'archived' && (
                    <button
                      onClick={() => handleStatusChange(comment.id, 'approved')}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-all"
                      title="إعادة التعليق من الأرشيف"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* زر الحذف - متاح دائماً */}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                    title="حذف التعليق نهائياً"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* التصفح */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t" style={{ borderColor: darkMode ? '#374151' : '#f4f8fe' }}>
            <div className="flex items-center justify-between">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className={`px-3 py-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 