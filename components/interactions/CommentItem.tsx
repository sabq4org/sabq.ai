'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { CommentForm } from './CommentForm';
import { LikeButton } from './LikeButton';
import { ReportButton } from './ReportButton';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';

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

interface CommentItemProps {
  comment: Comment;
  articleId: string;
  currentUserId?: string;
  depth?: number;
  onReply?: (content: string) => void;
  onDelete?: () => void;
  onUpdate?: (updatedComment: Comment) => void;
  className?: string;
}

export function CommentItem({
  comment,
  articleId,
  currentUserId,
  depth = 0,
  onReply,
  onDelete,
  onUpdate,
  className = ''
}: CommentItemProps) {
  const { isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes_count);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const isOwner = currentUserId === comment.user.id;
  const canEdit = isOwner && !comment.is_edited;
  const maxDepth = 3; // الحد الأقصى لعمق التداخل

  // التحقق من حالة الإعجاب
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      checkLikeStatus();
    }
  }, [isAuthenticated, currentUserId]);

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`/api/comments/${comment.id}/like`);
      if (response.ok) {
        const data = await response.json();
        setLiked(data.data.liked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  // تحديث التعليق
  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editContent })
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const data = await response.json();
      onUpdate?.(data.data.comment);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('حدث خطأ في تحديث التعليق');
    } finally {
      setSubmitting(false);
    }
  };

  // إضافة رد
  const handleReply = async (content: string) => {
    if (!onReply) return;

    setSubmitting(true);
    try {
      await onReply(content);
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // تحميل المزيد من الردود
  const loadMoreReplies = async () => {
    if (loadingReplies) return;

    setLoadingReplies(true);
    try {
      const response = await fetch(
        `/api/comments/${comment.id}/replies?limit=5&offset=${replies.length}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReplies(prev => [...prev, ...data.data.replies]);
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ar
    });
  };

  return (
    <div className={`${className} ${depth > 0 ? 'mr-8 mt-4' : 'p-6'}`}>
      <div className="flex gap-4">
        {/* صورة المستخدم */}
        <Avatar
          src={comment.user.avatar_url}
          alt={comment.user.name}
          size="md"
          className="flex-shrink-0"
        />

        {/* محتوى التعليق */}
        <div className="flex-1 min-w-0">
          {/* معلومات المستخدم والتاريخ */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">{comment.user.name}</h4>
              <span className="text-sm text-gray-500">
                {formatDate(comment.created_at)}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  معدل
                </span>
              )}
            </div>

            {/* قائمة الخيارات */}
            {isAuthenticated && (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </Button>
                }
                items={[
                  ...(isOwner ? [
                    { label: 'تعديل', onClick: () => setIsEditing(true) },
                    { label: 'حذف', onClick: onDelete, variant: 'danger' }
                  ] : []),
                  { label: 'تبليغ', onClick: () => {} } // سيتم ربطه بمكون التبليغ
                ]}
              />
            )}
          </div>

          {/* محتوى التعليق */}
          {isEditing ? (
            <div className="mb-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="تعديل التعليق..."
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleUpdate}
                  disabled={submitting || !editContent.trim()}
                  size="sm"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
            </div>
          )}

          {/* أزرار التفاعل */}
          <div className="flex items-center gap-4 text-sm">
            <LikeButton
              commentId={comment.id}
              liked={liked}
              likeCount={likeCount}
              onLikeChange={(newLiked, newCount) => {
                setLiked(newLiked);
                setLikeCount(newCount);
              }}
            />

            {isAuthenticated && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                رد
              </Button>
            )}

            {replies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'إخفاء' : 'عرض'} الردود ({replies.length})
              </Button>
            )}

            <ReportButton
              commentId={comment.id}
              disabled={isOwner}
            />
          </div>

          {/* نموذج الرد */}
          {showReplyForm && isAuthenticated && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                submitting={submitting}
                placeholder={`رد على ${comment.user.name}...`}
                compact
              />
            </div>
          )}

          {/* الردود */}
          {showReplies && replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                  onReply={depth + 1 < maxDepth ? onReply : undefined}
                  onDelete={() => {
                    setReplies(prev => prev.filter(r => r.id !== reply.id));
                  }}
                  onUpdate={(updatedReply) => {
                    setReplies(prev => prev.map(r => 
                      r.id === reply.id ? updatedReply : r
                    ));
                  }}
                />
              ))}

              {/* تحميل المزيد من الردود */}
              {comment.has_more_replies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreReplies}
                  disabled={loadingReplies}
                  className="mr-8"
                >
                  {loadingReplies ? 'جاري التحميل...' : 'تحميل المزيد من الردود'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 