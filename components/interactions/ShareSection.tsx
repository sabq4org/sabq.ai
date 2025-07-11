'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ShareSectionProps {
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  className?: string;
}

interface ShareStats {
  total_shares: number;
  shares_by_platform: Record<string, number>;
  share_links: Record<string, string>;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLinks: Record<string, string>;
  onShare: (platform: string) => void;
}

const SHARE_PLATFORMS = [
  {
    key: 'facebook',
    name: 'فيسبوك',
    icon: '📘',
    color: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-white'
  },
  {
    key: 'twitter',
    name: 'تويتر',
    icon: '🐦',
    color: 'bg-blue-400 hover:bg-blue-500',
    textColor: 'text-white'
  },
  {
    key: 'whatsapp',
    name: 'واتساب',
    icon: '💬',
    color: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white'
  },
  {
    key: 'linkedin',
    name: 'لينكدإن',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    textColor: 'text-white'
  },
  {
    key: 'telegram',
    name: 'تلغرام',
    icon: '✈️',
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-white'
  },
  {
    key: 'email',
    name: 'البريد الإلكتروني',
    icon: '📧',
    color: 'bg-gray-600 hover:bg-gray-700',
    textColor: 'text-white'
  },
  {
    key: 'copy',
    name: 'نسخ الرابط',
    icon: '📋',
    color: 'bg-gray-500 hover:bg-gray-600',
    textColor: 'text-white'
  }
];

function ShareModal({ isOpen, onClose, shareLinks, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handlePlatformShare = (platform: string) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(shareLinks.copy || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      const url = shareLinks[platform];
      if (url) {
        window.open(url, '_blank', 'width=600,height=400');
      }
    }
    onShare(platform);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="مشاركة المقال">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          اختر المنصة التي تريد مشاركة المقال عليها:
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {SHARE_PLATFORMS.map((platform) => (
            <Button
              key={platform.key}
              onClick={() => handlePlatformShare(platform.key)}
              className={`
                ${platform.color} ${platform.textColor}
                flex items-center justify-center gap-2 p-3 rounded-lg
                transition-all duration-200 hover:scale-105
              `}
            >
              <span className="text-lg">{platform.icon}</span>
              <span className="text-sm font-medium">{platform.name}</span>
            </Button>
          ))}
        </div>

        {copied && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-800">تم نسخ الرابط بنجاح!</span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ShareSection({ articleId, articleTitle, articleSlug, className = '' }: ShareSectionProps) {
  const { user } = useAuth();
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // جلب إحصائيات المشاركة
  useEffect(() => {
    fetchShareStats();
  }, [articleId]);

  const fetchShareStats = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShareStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching share stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // تسجيل المشاركة
  const handleShare = async (platform: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform })
      });

      if (response.ok) {
        // تحديث الإحصائيات
        setShareStats(prev => prev ? {
          ...prev,
          total_shares: prev.total_shares + 1,
          shares_by_platform: {
            ...prev.shares_by_platform,
            [platform]: (prev.shares_by_platform[platform] || 0) + 1
          }
        } : null);
      }
    } catch (error) {
      console.error('Error recording share:', error);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              مشاركة
            </Button>

            {/* أزرار المشاركة السريعة */}
            <div className="flex items-center gap-2">
              {SHARE_PLATFORMS.slice(0, 3).map((platform) => (
                <Button
                  key={platform.key}
                  onClick={() => {
                    if (shareStats?.share_links[platform.key]) {
                      if (platform.key === 'copy') {
                        navigator.clipboard.writeText(shareStats.share_links.copy);
                      } else {
                        window.open(shareStats.share_links[platform.key], '_blank', 'width=600,height=400');
                      }
                      handleShare(platform.key);
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                  title={`مشاركة عبر ${platform.name}`}
                >
                  <span className="text-lg">{platform.icon}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* إحصائيات المشاركة */}
          {shareStats && shareStats.total_shares > 0 && (
            <div className="text-sm text-gray-600">
              <span>{shareStats.total_shares} مشاركة</span>
            </div>
          )}
        </div>

        {/* تفاصيل المشاركة حسب المنصة */}
        {shareStats && shareStats.total_shares > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-2">
              {Object.entries(shareStats.shares_by_platform).map(([platform, count]) => {
                const platformInfo = SHARE_PLATFORMS.find(p => p.key === platform);
                if (!platformInfo || count === 0) return null;
                
                return (
                  <div
                    key={platform}
                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs"
                  >
                    <span>{platformInfo.icon}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shareLinks={shareStats?.share_links || {}}
        onShare={handleShare}
      />
    </>
  );
} 