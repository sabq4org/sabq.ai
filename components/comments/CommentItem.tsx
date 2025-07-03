'use client';

import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  Flag, 
  MoreVertical,
  Edit,
  Trash2,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { useAuth } from '@/hooks/useAuth';
import CommentForm from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CommentItemProps {
  comment: {
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
    replies: any[];
    reportsCount: number;
    metadata?: any;
  };
  onReply: (content: string) => void;
  onReaction: (commentId: string, type: string) => void;
  onReport: (commentId: string, reason: string, description?: string) => void;
  depth: number;
}

export default function CommentItem({ 
  comment, 
  onReply, 
  onReaction, 
  onReport, 
  depth 
}: CommentItemProps) {
  const { darkMode } = useDarkModeContext();
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const isOwner = user && comment.user.id === user.id;
  const maxDepth = 3; // الحد الأقصى لعمق الردود

  const handleReplySubmit = (content: string) => {
    onReply(content);
    setShowReplyForm(false);
  };

  const handleReport = () => {
    if (!reportReason) {
      alert('الرجاء اختيار سبب البلاغ');
      return;
    }
    onReport(comment.id, reportReason, reportDescription);
    setShowReportDialog(false);
    setReportReason('');
    setReportDescription('');
  };

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

  return (
    <div className={`${depth > 0 ? 'mr-8' : ''}`}>
      <div className={`${
        darkMode ? 'bg-gray-700' : 'bg-white'
      } rounded-lg p-4 shadow-sm transition-all hover:shadow-md`}>
        
        {/* رأس التعليق */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* صورة المستخدم */}
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={comment.user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <User className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {comment.user.name}
                </span>
                {comment.status === 'pending' && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    قيد المراجعة
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3 h-3" />
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {formatDate(comment.createdAt)}
                </span>
                {comment.metadata?.editedAt && (
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    (معدل)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* قائمة الخيارات */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showOptions && (
              <div className={`absolute left-0 mt-2 w-48 rounded-lg shadow-lg ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'
              } z-10`}>
                {isOwner && (
                  <>
                    <button className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      تعديل
                    </button>
                    <button className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600">
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </>
                )}
                <button 
                  onClick={() => {
                    setShowReportDialog(true);
                    setShowOptions(false);
                  }}
                  className="w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  إبلاغ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* محتوى التعليق */}
        <div className={`mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {comment.content}
        </div>

        {/* أزرار التفاعل */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* زر الإعجاب */}
            <button
              onClick={() => {
                console.log('Like button clicked for comment:', comment.id);
                onReaction(comment.id, 'like');
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                comment.reactions.userReaction === 'like'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{comment.reactions.likes}</span>
            </button>

            {/* زر عدم الإعجاب */}
            <button
              onClick={() => {
                console.log('Dislike button clicked for comment:', comment.id);
                onReaction(comment.id, 'dislike');
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
                comment.reactions.userReaction === 'dislike'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm">{comment.reactions.dislikes}</span>
            </button>

            {/* زر الرد */}
            {depth < maxDepth && (
              <button
                onClick={() => {
                  console.log('Reply button clicked for comment:', comment.id);
                  setShowReplyForm(!showReplyForm);
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
              >
                <Reply className="w-4 h-4" />
                <span className="text-sm">رد</span>
              </button>
            )}
          </div>

          {/* عدد البلاغات */}
          {comment.reportsCount > 0 && user?.isAdmin && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{comment.reportsCount} بلاغ</span>
            </div>
          )}
        </div>

        {/* نموذج الرد */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyForm(false)}
              placeholder="اكتب ردك..."
              submitText="إرسال الرد"
            />
          </div>
        )}
      </div>

      {/* الردود */}
      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onReaction={onReaction}
              onReport={onReport}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* نافذة البلاغ */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-lg p-6 max-w-md w-full mx-4`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              الإبلاغ عن التعليق
            </h3>

            <div className="space-y-3 mb-4">
              {['spam', 'offensive', 'misleading', 'harassment', 'other'].map((reason) => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                    {reason === 'spam' && 'رسالة غير مرغوب فيها'}
                    {reason === 'offensive' && 'محتوى مسيء'}
                    {reason === 'misleading' && 'معلومات مضللة'}
                    {reason === 'harassment' && 'تحرش أو تنمر'}
                    {reason === 'other' && 'سبب آخر'}
                  </span>
                </label>
              ))}
            </div>

            {reportReason === 'other' && (
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="اشرح سبب البلاغ..."
                className={`w-full p-3 rounded-lg border mb-4 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300'
                }`}
                rows={3}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReport}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                إرسال البلاغ
              </button>
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 