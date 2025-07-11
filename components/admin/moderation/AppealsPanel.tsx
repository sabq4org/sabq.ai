"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Appeal {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  admin_notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  comment: {
    id: string;
    content: string;
    status: string;
    ai_category: string;
    ai_risk_score: number;
    ai_reasons: string[];
    article: {
      id: string;
      title: string;
      slug: string;
    };
    user: {
      id: string;
      name: string;
    };
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'معلق',
  accepted: 'مقبول',
  rejected: 'مرفوض'
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function AppealsPanel() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadAppeals();
  }, [currentStatus, currentPage]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: currentStatus,
        page: currentPage.toString(),
        limit: '20',
        user_id: 'current_user'
      });

      const response = await fetch(`/api/admin/moderation/appeals?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAppeals(data.data.appeals);
        setPagination(data.data.pagination);
        setStats(data.data.stats.status_counts);
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (appealId: string) => {
    const notes = prompt('ملاحظات إضافية (اختياري):');
    if (notes === null) return; // User cancelled

    setActionLoading(appealId);
    try {
      const response = await fetch(`/api/admin/moderation/appeals/${appealId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: 'current_user',
          admin_notes: notes
        })
      });

      const data = await response.json();
      if (data.success) {
        setAppeals(appeals.filter(a => a.id !== appealId));
        // Update stats
        setStats(prev => ({
          ...prev,
          pending: (prev.pending || 0) - 1,
          accepted: (prev.accepted || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error accepting appeal:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (appealId: string) => {
    const reason = prompt('سبب رفض التظلم:');
    if (!reason) return;

    const notes = prompt('ملاحظات إضافية (اختياري):');
    if (notes === null) return; // User cancelled

    setActionLoading(appealId);
    try {
      const response = await fetch(`/api/admin/moderation/appeals/${appealId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: 'current_user',
          reason,
          admin_notes: notes
        })
      });

      const data = await response.json();
      if (data.success) {
        setAppeals(appeals.filter(a => a.id !== appealId));
        // Update stats
        setStats(prev => ({
          ...prev,
          pending: (prev.pending || 0) - 1,
          rejected: (prev.rejected || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error rejecting appeal:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 0.3) return 'text-green-600';
    if (score < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة التظلمات</h1>
          <p className="text-gray-600 mt-1">مراجعة تظلمات المستخدمين على القرارات</p>
        </div>
        <Button onClick={loadAppeals} className="bg-blue-600 hover:bg-blue-700">
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">تظلمات معلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
            <p className="text-xs text-gray-500 mt-1">تحتاج مراجعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">تظلمات مقبولة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted || 0}</div>
            <p className="text-xs text-gray-500 mt-1">تم قبولها</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">تظلمات مرفوضة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected || 0}</div>
            <p className="text-xs text-gray-500 mt-1">تم رفضها</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>التصفية حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => {
                  setCurrentStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label} ({stats[status] || 0})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appeals List */}
      <Card>
        <CardHeader>
          <CardTitle>التظلمات - {STATUS_LABELS[currentStatus]}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جار تحميل التظلمات...</p>
            </div>
          ) : appeals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد تظلمات بهذا التصنيف
            </div>
          ) : (
            <div className="space-y-4">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="border rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {appeal.user.profile_image && (
                        <img
                          src={appeal.user.profile_image}
                          alt={appeal.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{appeal.user.name}</h3>
                        <p className="text-sm text-gray-500">{appeal.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[appeal.status]}`}>
                        {STATUS_LABELS[appeal.status]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(appeal.created_at).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appeal Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">تفاصيل التظلم</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>السبب:</strong> {appeal.reason || 'لم يتم تحديد سبب'}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>المقال:</strong> {appeal.comment.article.title}
                        </p>
                      </div>
                    </div>

                    {/* Original Comment */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">التعليق الأصلي</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-3">
                          {appeal.comment.content}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-gray-200 px-2 py-1 rounded">
                            فئة AI: {appeal.comment.ai_category}
                          </span>
                          <span className={`px-2 py-1 rounded ${getRiskScoreColor(appeal.comment.ai_risk_score)}`}>
                            خطر: {appeal.comment.ai_risk_score.toFixed(2)}
                          </span>
                          <span className="bg-gray-200 px-2 py-1 rounded">
                            الحالة: {appeal.comment.status}
                          </span>
                        </div>
                        {appeal.comment.ai_reasons && appeal.comment.ai_reasons.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">أسباب AI:</p>
                            <div className="flex flex-wrap gap-1">
                              {appeal.comment.ai_reasons.map((reason, idx) => (
                                <span key={idx} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {appeal.status === 'pending' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t">
                      <Button
                        onClick={() => handleAccept(appeal.id)}
                        disabled={actionLoading === appeal.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {actionLoading === appeal.id ? 'جار المعالجة...' : 'قبول التظلم'}
                      </Button>
                      <Button
                        onClick={() => handleReject(appeal.id)}
                        disabled={actionLoading === appeal.id}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        {actionLoading === appeal.id ? 'جار المعالجة...' : 'رفض التظلم'}
                      </Button>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {appeal.admin_notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>ملاحظات المشرف:</strong> {appeal.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                عرض {appeals.length} من {pagination.total} تظلم
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