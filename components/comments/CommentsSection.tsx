'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Flag, 
  ThumbsUp, 
  ThumbsDown,
  Heart,
  Angry,
  Frown,
  Zap,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { useAuth } from '@/hooks/useAuth';

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  editedAt?: string;
  user: {
    id?: string;
    name: string;
    avatar?: string;
  };
  reactions: {
    likes: number;
    dislikes: number;
    userReaction?: string;
  };
  replies: Comment[];
  reportsCount: number;
  metadata?: any;
}

interface CommentsSectionProps {
  articleId: string;
  allowComments: boolean;
}

export default function CommentsSection({ articleId, allowComments }: CommentsSectionProps) {
  const { darkMode } = useDarkModeContext();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  useEffect(() => {
    // التحقق من حالة التعليقات من localStorage
    const checkCommentsEnabled = () => {
      const enabled = localStorage.getItem('comments_enabled');
      setCommentsEnabled(enabled !== 'false'); // افتراضياً مفعلة
    };
    
    checkCommentsEnabled();
    
    // الاستماع لتغييرات في localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'comments_enabled') {
        setCommentsEnabled(e.newValue !== 'false');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (commentsEnabled && allowComments) {
      fetchComments();
    }
  }, [articleId, sortBy, page, commentsEnabled]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/comments?article_id=${articleId}&page=${page}&limit=20&sort=${sortBy}`
      );
      const data = await response.json();

      if (data.success) {
        // تحويل البيانات لتتوافق مع الواجهة
        const transformedComments = data.comments.map((comment: any) => ({
          ...comment,
          user: {
            id: comment.user?.id || comment.userId,
            name: comment.user?.name || comment.guestName || 'مستخدم مجهول',
            avatar: comment.user?.avatar || comment.user?.avatar_url
          },
          reactions: {
            likes: comment.reactions?.likes || 0,
            dislikes: comment.reactions?.dislikes || 0,
            userReaction: comment.reactions?.userReaction
          },
          replies: comment.replies || [],
          reportsCount: comment.reportsCount || 0
        }));

        if (page === 1) {
          setComments(transformedComments);
        } else {
          setComments(prev => [...prev, ...transformedComments]);
        }
        setTotalComments(data.pagination.total);
        setHasMore(page < data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          content,
          parentId,
          guestName: !user ? prompt('الرجاء إدخال اسمك:') : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        // عرض التحذير إذا كان التعليق مشبوهاً
        if (data.aiWarning) {
          const warningMessage = `
⚠️ ${data.aiWarning.message}

📊 نسبة الأمان: ${data.aiWarning.score}%
🏷️ التصنيف: ${data.aiWarning.classification === 'suspicious' ? 'مشبوه' : 
               data.aiWarning.classification === 'questionable' ? 'مشكوك فيه' : 
               data.aiWarning.classification === 'toxic' ? 'مسيء' : 'آمن'}
${data.aiWarning.flaggedWords.length > 0 ? `🚫 كلمات مشبوهة: ${data.aiWarning.flaggedWords.join('، ')}` : ''}

${data.message}
          `.trim();
          
          alert(warningMessage);
        } else {
          // عرض رسالة النجاح العادية
          alert(data.message || 'تم إرسال تعليقك بنجاح');
        }

        if (data.comment.status === 'approved') {
          if (parentId) {
            // إضافة الرد إلى التعليق الأصلي
            setComments(prev => updateCommentReplies(prev, parentId, data.comment));
          } else {
            // إضافة التعليق الجديد في البداية
            setComments(prev => [data.comment, ...prev]);
          }
        }
        
        setShowCommentForm(false);
        
        // إعادة تحميل التعليقات إذا كان التعليق بحاجة لمراجعة
        if (data.comment.status === 'pending') {
          console.log('التعليق في انتظار المراجعة');
        }
      } else {
        // عرض رسالة الخطأ مع تفاصيل التحليل إذا كانت متاحة
        if (data.aiAnalysis) {
          const errorMessage = `
❌ ${data.error}

📊 نسبة الأمان: ${data.aiAnalysis.score}%
🏷️ التصنيف: ${data.aiAnalysis.classification === 'toxic' ? 'مسيء' : 'مشبوه'}
${data.aiAnalysis.reason ? `📝 السبب: ${data.aiAnalysis.reason}` : ''}
          `.trim();
          
          alert(errorMessage);
        } else {
          alert(data.error || 'حدث خطأ في إرسال التعليق');
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('فشل في إرسال التعليق. يرجى المحاولة مرة أخرى.');
    }
  };

  const updateCommentReplies = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, newReply]
        };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentReplies(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
  };

  const handleReaction = async (commentId: string, reactionType: string) => {
    try {
      console.log('Reacting to comment:', commentId, 'with:', reactionType);
      
      const response = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType })
      });

      const data = await response.json();
      console.log('Reaction response:', data);
      
      if (data.success) {
        // تحديث التفاعلات في الواجهة
        updateCommentReactions(commentId, data.counts);
        console.log('Updated reactions for comment:', commentId);
      } else {
        alert(data.error || 'حدث خطأ في إضافة التفاعل');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('حدث خطأ في إضافة التفاعل');
    }
  };

  const updateCommentReactions = (commentId: string, counts: any) => {
    setComments(prev => updateReactionsInComments(prev, commentId, counts));
  };

  const updateReactionsInComments = (comments: Comment[], commentId: string, counts: any): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          reactions: {
            ...comment.reactions,
            likes: counts.like || 0,
            dislikes: counts.dislike || 0
          }
        };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateReactionsInComments(comment.replies, commentId, counts)
        };
      }
      return comment;
    });
  };

  const handleReport = async (commentId: string, reason: string, description?: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      });

      const data = await response.json();
      alert(data.message || data.error);
    } catch (error) {
      console.error('Error reporting comment:', error);
      alert('حدث خطأ في إرسال البلاغ');
    }
  };

  // التحقق من حالة التعليقات
  if (!commentsEnabled) {
    return null; // لا نعرض أي شيء إذا كانت التعليقات معطلة من الإعدادات
  }

  if (!allowComments) {
    return (
      <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>التعليقات مغلقة على هذا المقال</p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6`}>
      {/* رأس قسم التعليقات */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            التعليقات ({totalComments})
          </h2>
        </div>

        {/* أزرار الترتيب */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('latest')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'latest'
                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
            }`}
          >
            الأحدث
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'popular'
                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
            }`}
          >
            الأكثر تفاعلاً
          </button>
        </div>
      </div>

      {/* زر إضافة تعليق */}
      <button
        onClick={() => setShowCommentForm(!showCommentForm)}
        className={`w-full mb-6 px-4 py-3 rounded-lg border-2 border-dashed transition-all ${
          darkMode 
            ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <Send className="w-5 h-5" />
          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            أضف تعليقك
          </span>
        </div>
      </button>

      {/* نموذج التعليق */}
      {showCommentForm && (
        <div className="mb-6">
          <CommentForm
            onSubmit={(content: string) => handleCommentSubmit(content)}
            onCancel={() => setShowCommentForm(false)}
          />
        </div>
      )}

      {/* قائمة التعليقات */}
      {loading && page === 1 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={(content: string) => handleCommentSubmit(content, comment.id)}
                onReaction={handleReaction}
                onReport={handleReport}
                depth={0}
              />
            ))}
          </div>

          {/* زر تحميل المزيد */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    جاري التحميل...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ChevronDown className="w-5 h-5" />
                    عرض المزيد من التعليقات
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 