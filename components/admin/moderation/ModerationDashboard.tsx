"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Comment {
  id: string;
  content: string;
  status: string;
  ai_category: string;
  ai_risk_score: number;
  ai_confidence: number;
  ai_reasons: string[];
  ai_notes: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  article: {
    id: string;
    title: string;
    slug: string;
  };
  appeals: Array<{
    id: string;
    reason: string;
    created_at: string;
  }>;
  reports: Array<{
    id: string;
    reason: string;
    created_at: string;
  }>;
  _count: {
    appeals: number;
    reports: number;
  };
}

interface ModerationStats {
  overview: {
    total_comments: number;
    pending: number;
    approved: number;
    rejected: number;
    needs_review: number;
    hidden: number;
    automation_rate: number;
    human_review_rate: number;
  };
  ai_performance: {
    total_processed: number;
    auto_approved: number;
    auto_rejected: number;
    categories_breakdown: Record<string, { count: number; avg_risk_score: number }>;
  };
  appeals_reports: {
    total_appeals: number;
    pending_appeals: number;
    total_reports: number;
    pending_reports: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'معلقة',
  needs_review: 'تحتاج مراجعة',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
  hidden: 'مخفية'
};

const CATEGORY_LABELS: Record<string, string> = {
  normal: 'عادي',
  spam: 'سبام',
  bullying: 'تنمر',
  hate: 'كراهية',
  politics: 'سياسة',
  nsfw: 'محتوى غير لائق',
  toxic: 'سام',
  inappropriate: 'غير مناسب'
};

export default function ModerationDashboard() {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filters
  const [currentStatus, setCurrentStatus] = useState('needs_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Load stats
  useEffect(() => {
    loadStats();
  }, []);

  // Load comments when filters change
  useEffect(() => {
    loadComments();
  }, [currentStatus, searchQuery, selectedCategory, currentPage, sortBy]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/stats?user_id=current_user');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: currentStatus,
        page: currentPage.toString(),
        limit: '20',
        sort: sortBy,
        user_id: 'current_user'
      });

      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`/api/admin/moderation/comments?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data.comments);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    setActionLoading(commentId);
    try {
      const response = await fetch(`/api/admin/moderation/comments/${commentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: 'current_user',
          notes: 'Approved by admin'
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments(comments.filter(c => c.id !== commentId));
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error approving comment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (commentId: string, reason?: string) => {
    setActionLoading(commentId);
    try {
      const response = await fetch(`/api/admin/moderation/comments/${commentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: 'current_user',
          reason: reason || 'Rejected by admin',
          notes: 'Rejected by admin'
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments(comments.filter(c => c.id !== commentId));
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error rejecting comment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 0.3) return 'text-green-600';
    if (score < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score < 0.3) return 'منخفض';
    if (score < 0.7) return 'متوسط';
    return 'عالي';
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جار تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة الإشراف الذكية</h1>
          <p className="text-gray-600 mt-1">إدارة التعليقات باستخدام الذكاء الاصطناعي</p>
        </div>
        <Button onClick={loadStats} className="bg-blue-600 hover:bg-blue-700">
          تحديث الإحصائيات
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي التعليقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overview.total_comments}</div>
            <p className="text-xs text-gray-500 mt-1">آخر 24 ساعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">تحتاج مراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.overview.needs_review}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.human_review_rate.toFixed(1)}% من الإجمالي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">معدل الأتمتة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.overview.automation_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">قرارات تلقائية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">التظلمات المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.appeals_reports.pending_appeals}</div>
            <p className="text-xs text-gray-500 mt-1">من {stats.appeals_reports.total_appeals} إجمالي</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance */}
      <Card>
        <CardHeader>
          <CardTitle>أداء الذكاء الاصطناعي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {stats.ai_performance.auto_approved}
              </div>
              <p className="text-sm text-gray-600">معتمد تلقائياً</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {stats.ai_performance.auto_rejected}
              </div>
              <p className="text-sm text-gray-600">مرفوض تلقائياً</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {stats.ai_performance.total_processed}
              </div>
              <p className="text-sm text-gray-600">إجمالي المعالج</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>التصفية والبحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => {
                    setCurrentStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    currentStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <Input
                placeholder="البحث في التعليقات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded-md"
              >
                <option value="all">جميع الفئات</option>
                {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                  <option key={category} value={category}>{label}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border rounded-md"
              >
                <option value="newest">الأحدث</option>
                <option value="oldest">الأقدم</option>
                <option value="risk_score">نقاط الخطر</option>
                <option value="confidence">الثقة</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>التعليقات - {STATUS_LABELS[currentStatus]}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جار تحميل التعليقات...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد تعليقات بهذا التصنيف
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">المستخدم</th>
                    <th className="text-right py-3 px-4">التعليق</th>
                    <th className="text-right py-3 px-4">AI تصنيف</th>
                    <th className="text-right py-3 px-4">نقاط الخطر</th>
                    <th className="text-right py-3 px-4">الثقة</th>
                    <th className="text-right py-3 px-4">الأسباب</th>
                    <th className="text-right py-3 px-4">التاريخ</th>
                    <th className="text-right py-3 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((comment) => (
                    <tr key={comment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {comment.user.profile_image && (
                            <img
                              src={comment.user.profile_image}
                              alt={comment.user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium">{comment.user.name}</div>
                            <div className="text-xs text-gray-500">{comment.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="line-clamp-3">{comment.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          على: {comment.article.title}
                        </div>
                        {comment._count.appeals > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {comment._count.appeals} تظلم
                          </div>
                        )}
                        {comment._count.reports > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {comment._count.reports} تبليغ
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {CATEGORY_LABELS[comment.ai_category] || comment.ai_category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${getRiskScoreColor(comment.ai_risk_score)}`}>
                          {comment.ai_risk_score.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getRiskScoreLabel(comment.ai_risk_score)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {(comment.ai_confidence * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          {comment.ai_reasons.slice(0, 2).map((reason, idx) => (
                            <div key={idx} className="mb-1 text-gray-600">
                              • {reason}
                            </div>
                          ))}
                          {comment.ai_reasons.length > 2 && (
                            <div className="text-gray-400">
                              +{comment.ai_reasons.length - 2} أكثر
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString('ar-EG')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(comment.id)}
                            disabled={actionLoading === comment.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {actionLoading === comment.id ? '...' : 'اعتماد'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(comment.id)}
                            disabled={actionLoading === comment.id}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            {actionLoading === comment.id ? '...' : 'رفض'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                عرض {comments.length} من {pagination.total} تعليق
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                  {currentPage} من {pagination.pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 