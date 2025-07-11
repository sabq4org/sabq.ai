'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  parent_id?: string;
  status: string;
  like_count: number;
  reply_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
  likes_count: number;
  replies_count: number;
  has_more_replies?: boolean;
}

interface CommentSectionProps {
  articleId: string;
  initialComments?: Comment[];
  totalComments?: number;
  className?: string;
}

export function CommentSection({
  articleId,
  initialComments = [],
  totalComments = 0,
  className = ''
}: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showForm, setShowForm] = useState(false);
  const [total, setTotal] = useState(totalComments);

  // جلب التعليقات
  const fetchComments = useCallback(async (pageNum = 1, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/articles/${articleId}/comments?page=${pageNum}&sort=${sortBy}&limit=10`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      
      if (reset || pageNum === 1) {
        setComments(data.data.comments);
      } else {
        setComments(prev => [...prev, ...data.data.comments]);
      }
      
      setTotal(data.data.pagination.total);
      setHasMore(data.data.pagination.page < data.data.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [articleId, sortBy, loading]);

  // تحميل التعليقات عند التغيير
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments(1, true);
    }
  }, [fetchComments, initialComments.length]);

  // تحديث التعليقات عند تغيير الترتيب
  useEffect(() => {
    fetchComments(1, true);
  }, [sortBy]);

  // إضافة تعليق جديد
  const handleCommentSubmit = async (content: string, parentId?: string) => {
    if (!isAuthenticated || !user) {
      alert('يجب تسجيل الدخول للتعليق');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parent_id: parentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }

      const data = await response.json();
      const newComment = data.data.comment;

      if (parentId) {
        // إضافة الرد إلى التعليق الأب
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
              replies_count: comment.replies_count + 1
            };
          }
          return comment;
        }));
      } else {
        // إضافة تعليق جديد في المقدمة
        setComments(prev => [newComment, ...prev]);
        setTotal(prev => prev + 1);
      }

      setShowForm(false);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في إرسال التعليق');
    } finally {
      setSubmitting(false);
    }
  };

  // حذف تعليق
  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      // إزالة التعليق من القائمة
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('حدث خطأ في حذف التعليق');
    }
  };

  // تحديث تعليق
  const handleCommentUpdate = (commentId: string, updatedComment: Comment) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId ? updatedComment : comment
    ));
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* رأس قسم التعليقات */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            التعليقات ({total})
          </h3>
          
          {/* خيارات الترتيب */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="popular">الأكثر إعجاباً</option>
            </select>
          </div>
        </div>

        {/* زر إضافة تعليق */}
        {isAuthenticated ? (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full"
            variant={showForm ? "secondary" : "primary"}
          >
            {showForm ? 'إلغاء' : 'إضافة تعليق'}
          </Button>
        ) : (
          <div className="text-center py-4 text-gray-600">
            <p>يجب تسجيل الدخول للتعليق</p>
            <Button href="/login" className="mt-2">
              تسجيل الدخول
            </Button>
          </div>
        )}
      </div>

      {/* نموذج إضافة تعليق */}
      {showForm && isAuthenticated && (
        <div className="p-6 border-b bg-gray-50">
          <CommentForm
            onSubmit={(content) => handleCommentSubmit(content)}
            onCancel={() => setShowForm(false)}
            submitting={submitting}
            placeholder="اكتب تعليقك هنا..."
          />
        </div>
      )}

      {/* قائمة التعليقات */}
      <div className="divide-y">
        {comments.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            <p>لا توجد تعليقات بعد</p>
            <p className="text-sm mt-1">كن أول من يعلق على هذا المقال</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              articleId={articleId}
              currentUserId={user?.id}
              onReply={(content) => handleCommentSubmit(content, comment.id)}
              onDelete={() => handleCommentDelete(comment.id)}
              onUpdate={(updatedComment) => handleCommentUpdate(comment.id, updatedComment)}
            />
          ))
        )}
      </div>

      {/* مؤشر التحميل */}
      {loading && (
        <div className="p-6 text-center">
          <Spinner className="mx-auto" />
          <p className="mt-2 text-sm text-gray-600">جاري تحميل التعليقات...</p>
        </div>
      )}

      {/* زر تحميل المزيد */}
      {hasMore && !loading && comments.length > 0 && (
        <div className="p-6 text-center border-t">
          <Button
            onClick={() => fetchComments(page + 1)}
            variant="secondary"
            className="w-full"
          >
            تحميل المزيد من التعليقات
          </Button>
        </div>
      )}
    </div>
  );
} 