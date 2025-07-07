'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Eye, Heart, MessageCircle, Share2, Clock, PlayCircle, 
  PauseCircle, Bookmark, BookmarkCheck, TrendingUp, 
  Zap, Volume2, Headphones, ThumbsUp, ThumbsDown,
  User, Calendar, MoreHorizontal, ExternalLink
} from 'lucide-react';
import { getArticleLink } from '@/lib/utils';
import { formatDateOnly } from '@/lib/date-utils';
import { generatePlaceholderImage, getValidImageUrl } from '@/lib/cloudinary';

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  ai_summary?: string;
  featured_image?: string;
  author_name?: string;
  author_id?: string;
  author_avatar?: string;
  author_specialization?: string;
  views_count: number;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  reading_time?: number;
  created_at: string;
  published_at?: string;
  is_trending?: boolean;
  is_featured?: boolean;
  topic_tags?: string[];
  audio_url?: string;
  podcast_duration?: number;
  agree_count?: number;
  disagree_count?: number;
  engagement_score?: number;
}

interface EnhancedArticleCardProps {
  article: Article;
  relevanceScore?: number;
  isRecommended?: boolean;
  onPlay?: (id: string, audioUrl?: string, text?: string) => void;
  currentPlayingId?: string | null;
  isCompact?: boolean;
}

export default function EnhancedArticleCard({
  article,
  relevanceScore = Math.floor(Math.random() * 30) + 70,
  isRecommended = false,
  onPlay,
  currentPlayingId,
  isCompact = false
}: EnhancedArticleCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [localLikes, setLocalLikes] = useState(article?.likes_count || 0);
  const [localAgreements, setLocalAgreements] = useState(article?.agree_count || 0);
  const [localDisagreements, setLocalDisagreements] = useState(article?.disagree_count || 0);

  const isPlaying = currentPlayingId === article.id;

  // تفاعل الإعجاب
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalLikes(prev => prev + (userReaction === 'like' ? -1 : 1));
    setUserReaction(userReaction === 'like' ? null : 'like');
  };

  // تفاعل الموافقة/عدم الموافقة
  const handleAgreement = (type: 'agree' | 'disagree', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'agree') {
      setLocalAgreements(prev => prev + 1);
    } else {
      setLocalDisagreements(prev => prev + 1);
    }
  };

  // حفظ المقال
  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  // مشاركة المقال
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShare(!showShare);
  };

  // تشغيل الصوت
  const handleAudioPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPlay) {
      onPlay(article.id, article.audio_url, article.ai_summary || article.excerpt);
    }
  };

  // تنسيق العدد
  const formatCount = (count: number | undefined | null) => {
    const safeCount = count || 0;
    if (safeCount > 1000) return `${(safeCount / 1000).toFixed(1)}k`;
    return safeCount.toString();
  };

  // لون نسبة التوافق
  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (score >= 80) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  };

  if (isCompact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden opinion-card">
        <div className="flex gap-4 p-4">
          {/* صورة صغيرة */}
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={getValidImageUrl(article.featured_image) || generatePlaceholderImage(article.title)}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <Link href={getArticleLink(article)}>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                {article.title}
              </h3>
            </Link>

            <div className="flex items-center gap-2 mb-2">
              <Link href={`/author/${article.author_id}`} className="flex items-center gap-2">
                <img
                  src={article.author_avatar || generatePlaceholderImage(article.author_name || '')}
                  alt={article.author_name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600">
                  {article.author_name}
                </span>
              </Link>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {formatDateOnly(article.published_at || article.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatCount(article?.views_count)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.reading_time || 5} د
                </span>
              </div>
              
              <button 
                onClick={handleAudioPlay}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs"
              >
                {isPlaying ? <PauseCircle className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                استمع
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 opinion-card ${
      isRecommended ? 'ring-2 ring-purple-500 ai-recommendation' : ''
    }`}>
      <div className="flex flex-col md:flex-row">
        {/* صورة المقال */}
        <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
          <img
            src={getValidImageUrl(article.featured_image) || generatePlaceholderImage(article.title)}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          
          {/* شارات المقال */}
          <div className="absolute top-4 left-4 flex gap-2">
            {article.is_trending && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                ترند
              </span>
            )}
            {article.is_featured && (
              <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                مميز
              </span>
            )}
            {(article.audio_url || article.podcast_duration) && (
              <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                بودكاست
              </span>
            )}
          </div>

          {/* زر الحفظ */}
          <button
            onClick={handleBookmark}
            className="absolute top-4 right-4 w-8 h-8 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-blue-600" />
            ) : (
              <Bookmark className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* محتوى البطاقة */}
        <div className="flex-1 p-6">
          {/* معلومات الكاتب */}
          <div className="flex items-start justify-between mb-4">
            <Link href={`/author/${article.author_id}`} className="flex items-center gap-3 group">
              <img
                src={article.author_avatar || generatePlaceholderImage(article.author_name || '')}
                alt={article.author_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform"
              />
              <div>
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {article.author_name}
                </p>
                <p className="text-sm text-gray-500">
                  {article.author_specialization || 'كاتب رأي'} • {formatDateOnly(article.published_at || article.created_at)}
                </p>
              </div>
            </Link>
            
            {!isRecommended && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${getRelevanceColor(relevanceScore)}`}>
                <Zap className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {relevanceScore}% توافق
                </span>
              </div>
            )}
          </div>

          {/* عنوان المقال */}
          <Link href={getArticleLink(article)}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 transition-colors line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* الملخص الذكي */}
          {article.ai_summary && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
              {article.ai_summary}
            </p>
          )}

          {/* الوسوم */}
          {article.topic_tags && article.topic_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.topic_tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* أزرار التفاعل */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* زر الاستماع */}
              <button
                onClick={handleAudioPlay}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all interaction-button ${
                  isPlaying 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30'
                }`}
              >
                {isPlaying ? (
                  <PauseCircle className="w-5 h-5" />
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {article.podcast_duration ? `${article.podcast_duration} د` : 'استمع'}
                </span>
              </button>

              {/* أزرار التفاعل السريع */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors interaction-button ${
                    userReaction === 'like' 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/20' 
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{formatCount(localLikes)}</span>
                </button>

                <button 
                  onClick={(e) => handleAgreement('agree', e)}
                  className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors interaction-button px-2 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">{formatCount(localAgreements)}</span>
                </button>

                <button 
                  onClick={(e) => handleAgreement('disagree', e)}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors interaction-button px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">{formatCount(localDisagreements)}</span>
                </button>

                <button 
                  onClick={handleShare}
                  className="relative flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors interaction-button px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Share2 className="w-4 h-4" />
                  
                  {/* قائمة المشاركة */}
                  {showShare && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 min-w-[120px] z-10">
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm">
                        نسخ الرابط
                      </button>
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm">
                        مشاركة على تويتر
                      </button>
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm">
                        مشاركة على واتساب
                      </button>
                    </div>
                  )}
                </button>

                <Link 
                  href={`${getArticleLink(article)}#comments`}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{formatCount(article.comments_count || 0)}</span>
                </Link>
              </div>
            </div>

            {/* الإحصائيات */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatCount(article?.views_count)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.reading_time || 5} د
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 