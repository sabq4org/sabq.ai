'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface LikeButtonProps {
  commentId?: string;
  articleId?: string;
  liked: boolean;
  likeCount: number;
  onLikeChange: (liked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  commentId,
  articleId,
  liked,
  likeCount,
  onLikeChange,
  size = 'sm',
  showCount = true,
  className = ''
}: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('يجب تسجيل الدخول للإعجاب');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const endpoint = commentId 
        ? `/api/comments/${commentId}/like`
        : `/api/articles/${articleId}/like`;

      const response = await fetch(endpoint, {
        method: liked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث الإعجاب');
      }

      const data = await response.json();
      const newCount = commentId 
        ? data.data.comment.like_count
        : data.data.article.like_count;

      onLikeChange(!liked, newCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في تحديث الإعجاب');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleLike}
      disabled={isLoading}
      className={`
        flex items-center gap-2 transition-all duration-200
        ${liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-red-500'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* أيقونة القلب */}
      <svg 
        className={`${iconSize[size]} transition-transform duration-200 ${liked ? 'scale-110' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={liked ? 0 : 2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>

      {/* عدد الإعجابات */}
      {showCount && (
        <span className={`${sizeClasses[size]} transition-colors duration-200`}>
          {likeCount}
        </span>
      )}

      {/* نص الإعجاب */}
      <span className="sr-only">
        {liked ? 'إلغاء الإعجاب' : 'إعجاب'}
      </span>
    </Button>
  );
} 