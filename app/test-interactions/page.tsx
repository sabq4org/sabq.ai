'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Bookmark, Share2, RefreshCw, Trash2 } from 'lucide-react';

export default function TestInteractionsPage() {
  const [guestId, setGuestId] = useState<string>('');
  const [interactions, setInteractions] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);

  // تحميل البيانات
  const loadData = () => {
    const storedGuestId = localStorage.getItem('guestId') || 'لا يوجد';
    setGuestId(storedGuestId);
    
    const storedInteractions = localStorage.getItem('sabq_interactions');
    setInteractions(storedInteractions ? JSON.parse(storedInteractions) : {});
    
    const storedStats = localStorage.getItem('sabq_user_stats');
    setStats(storedStats ? JSON.parse(storedStats) : {});
    
    const storedHistory = localStorage.getItem('sabq_points_history');
    setHistory(storedHistory ? JSON.parse(storedHistory) : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // اختبار التفاعل
  const testInteraction = async (type: 'like' | 'save' | 'share') => {
    const { saveLocalInteraction } = await import('@/lib/interactions-localStorage');
    
    const testArticleId = 'test-article-123';
    const result = saveLocalInteraction(
      guestId,
      testArticleId,
      type,
      { source: 'test-page' }
    );
    
    alert(`${type} نتيجة: ${result.message}`);
    loadData();
  };

  // مسح البيانات
  const clearData = () => {
    if (confirm('هل أنت متأكد من مسح جميع البيانات المحلية؟')) {
      localStorage.removeItem('guestId');
      localStorage.removeItem('sabq_interactions');
      localStorage.removeItem('sabq_user_stats');
      localStorage.removeItem('sabq_points_history');
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-center">🧪 اختبار نظام التفاعلات المحلي</h1>
      
      {/* معلومات المستخدم */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>👤 معلومات المستخدم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>معرف الضيف:</strong> {guestId}</p>
            <p className="text-sm text-gray-500">
              {guestId && guestId !== 'لا يوجد' ? '✅ معرف ثابت موجود' : '❌ لا يوجد معرف'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الاختبار */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🎮 اختبار التفاعلات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => testInteraction('like')} className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              إعجاب
            </Button>
            <Button onClick={() => testInteraction('save')} className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              حفظ
            </Button>
            <Button onClick={() => testInteraction('share')} className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              مشاركة
            </Button>
            <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📊 الإحصائيات</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(stats).map(([userId, userStats]: [string, any]) => (
            <div key={userId} className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">{userId}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>إجمالي الإعجابات: {userStats.totalLikes || 0}</p>
                <p>إجمالي الحفظ: {userStats.totalSaves || 0}</p>
                <p>إجمالي المشاركات: {userStats.totalShares || 0}</p>
                <p>إجمالي النقاط: {userStats.totalPoints || 0}</p>
                <p>المستوى: {userStats.tier || 'bronze'}</p>
                <p>آخر نشاط: {new Date(userStats.lastActivity).toLocaleString('ar')}</p>
              </div>
            </div>
          ))}
          {Object.keys(stats).length === 0 && (
            <p className="text-gray-500">لا توجد إحصائيات بعد</p>
          )}
        </CardContent>
      </Card>

      {/* التفاعلات المحفوظة */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>💾 التفاعلات المحفوظة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {Object.entries(interactions).map(([key, interaction]: [string, any]) => (
              <div key={key} className="p-3 bg-gray-50 rounded">
                <p><strong>المفتاح:</strong> {key}</p>
                <div className="flex gap-4 mt-1">
                  <span className={interaction.liked ? 'text-green-600' : 'text-gray-400'}>
                    {interaction.liked ? '❤️ معجب' : '🤍 غير معجب'}
                  </span>
                  <span className={interaction.saved ? 'text-blue-600' : 'text-gray-400'}>
                    {interaction.saved ? '🔖 محفوظ' : '📄 غير محفوظ'}
                  </span>
                  <span className={interaction.shared ? 'text-purple-600' : 'text-gray-400'}>
                    {interaction.shared ? '📤 مشارك' : '📥 غير مشارك'}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(interactions).length === 0 && (
              <p className="text-gray-500">لا توجد تفاعلات محفوظة</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* سجل النقاط */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📜 سجل النقاط (آخر 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {history.slice(-10).reverse().map((entry, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded flex justify-between">
                <span>{entry.action} - {entry.articleId}</span>
                <span className="text-green-600">+{entry.points} نقطة</span>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-gray-500">لا يوجد سجل نقاط</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* البيانات الخام */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔍 البيانات الخام (localStorage)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs" dir="ltr">
{JSON.stringify({
  guestId,
  sabq_interactions: interactions,
  sabq_user_stats: stats,
  sabq_points_history: history
}, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* زر مسح البيانات */}
      <div className="text-center">
        <Button onClick={clearData} variant="destructive" className="flex items-center gap-2 mx-auto">
          <Trash2 className="w-4 h-4" />
          مسح جميع البيانات
        </Button>
      </div>
    </div>
  );
} 