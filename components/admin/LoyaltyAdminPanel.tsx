'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface LoyaltyStats {
  totalUsers: number;
  totalPoints: number;
  totalBadges: number;
  activeUsers: number;
  topUsers: Array<{
    id: string;
    name: string;
    points: number;
    badges: number;
    level: string;
  }>;
  pointsDistribution: Record<string, number>;
  badgesDistribution: Record<string, number>;
}

interface LoyaltyRule {
  id: string;
  name: string;
  name_ar: string;
  action_type: string;
  points: number;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  is_active: boolean;
}

interface BadgeData {
  id: string;
  name: string;
  name_ar: string;
  description_ar: string;
  icon: string;
  category: string;
  tier: string;
  points_required: number;
  is_active: boolean;
  users_count: number;
}

interface LoyaltyAdminPanelProps {
  className?: string;
}

export default function LoyaltyAdminPanel({ className = '' }: LoyaltyAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'badges' | 'users' | 'settings'>('overview');
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // حالات النماذج
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [editingRule, setEditingRule] = useState<LoyaltyRule | null>(null);
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);

  // بيانات النماذج
  const [ruleForm, setRuleForm] = useState({
    name: '',
    name_ar: '',
    action_type: '',
    points: 0,
    daily_limit: '',
    weekly_limit: '',
    monthly_limit: '',
    is_active: true
  });

  const [badgeForm, setBadgeForm] = useState({
    name: '',
    name_ar: '',
    description_ar: '',
    icon: '',
    category: 'engagement',
    tier: 'bronze',
    points_required: 0,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchRules(),
        fetchBadges()
      ]);
    } catch (err) {
      setError('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const response = await fetch('/api/admin/loyalty/stats');
    const data = await response.json();
    if (data.success) {
      setStats(data.data);
    }
  };

  const fetchRules = async () => {
    const response = await fetch('/api/admin/loyalty/rules');
    const data = await response.json();
    if (data.success) {
      setRules(data.data);
    }
  };

  const fetchBadges = async () => {
    const response = await fetch('/api/admin/loyalty/badges');
    const data = await response.json();
    if (data.success) {
      setBadges(data.data);
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRule 
        ? `/api/admin/loyalty/rules/${editingRule.id}`
        : '/api/admin/loyalty/rules';
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });

      if (response.ok) {
        await fetchRules();
        setShowRuleForm(false);
        setEditingRule(null);
        resetRuleForm();
      }
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleBadgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBadge 
        ? `/api/admin/loyalty/badges/${editingBadge.id}`
        : '/api/admin/loyalty/badges';
      
      const method = editingBadge ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeForm)
      });

      if (response.ok) {
        await fetchBadges();
        setShowBadgeForm(false);
        setEditingBadge(null);
        resetBadgeForm();
      }
    } catch (error) {
      console.error('Error saving badge:', error);
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/loyalty/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error toggling rule status:', error);
    }
  };

  const toggleBadgeStatus = async (badgeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/loyalty/badges/${badgeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        await fetchBadges();
      }
    } catch (error) {
      console.error('Error toggling badge status:', error);
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      name_ar: '',
      action_type: '',
      points: 0,
      daily_limit: '',
      weekly_limit: '',
      monthly_limit: '',
      is_active: true
    });
  };

  const resetBadgeForm = () => {
    setBadgeForm({
      name: '',
      name_ar: '',
      description_ar: '',
      icon: '',
      category: 'engagement',
      tier: 'bronze',
      points_required: 0,
      is_active: true
    });
  };

  const editRule = (rule: LoyaltyRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      name_ar: rule.name_ar,
      action_type: rule.action_type,
      points: rule.points,
      daily_limit: rule.daily_limit?.toString() || '',
      weekly_limit: rule.weekly_limit?.toString() || '',
      monthly_limit: rule.monthly_limit?.toString() || '',
      is_active: rule.is_active
    });
    setShowRuleForm(true);
  };

  const editBadge = (badge: BadgeData) => {
    setEditingBadge(badge);
    setBadgeForm({
      name: badge.name,
      name_ar: badge.name_ar,
      description_ar: badge.description_ar,
      icon: badge.icon,
      category: badge.category,
      tier: badge.tier,
      points_required: badge.points_required,
      is_active: badge.is_active
    });
    setShowBadgeForm(true);
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة نظام النقاط والشارات</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowRuleForm(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            إضافة قاعدة نقاط
          </Button>
          <Button
            onClick={() => setShowBadgeForm(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            إضافة شارة
          </Button>
        </div>
      </div>

      {/* التبويبات */}
      <div className="flex space-x-4 border-b">
        {[
          { key: 'overview', label: 'نظرة عامة' },
          { key: 'rules', label: 'قواعد النقاط' },
          { key: 'badges', label: 'الشارات' },
          { key: 'users', label: 'المستخدمين' },
          { key: 'settings', label: 'الإعدادات' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* نظرة عامة */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">إجمالي المستخدمين</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalPoints.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">إجمالي النقاط</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalBadges.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">إجمالي الشارات</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.activeUsers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">المستخدمين النشطين</div>
              </CardContent>
            </Card>
          </div>

          {/* أفضل المستخدمين */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">مستوى {user.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{user.points.toLocaleString()} نقطة</div>
                      <div className="text-sm text-gray-600">{user.badges} شارة</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* قواعد النقاط */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>قواعد النقاط</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium">{rule.name_ar}</h3>
                        <Badge className={rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {rule.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {rule.action_type} - {rule.points} نقطة
                      </div>
                      {(rule.daily_limit || rule.weekly_limit || rule.monthly_limit) && (
                        <div className="text-xs text-gray-500 mt-1">
                          الحدود: 
                          {rule.daily_limit && ` يومي: ${rule.daily_limit}`}
                          {rule.weekly_limit && ` أسبوعي: ${rule.weekly_limit}`}
                          {rule.monthly_limit && ` شهري: ${rule.monthly_limit}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => editRule(rule)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
                      >
                        تحرير
                      </Button>
                      <Button
                        onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                        className={`px-3 py-1 text-sm ${
                          rule.is_active 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {rule.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* الشارات */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الشارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium">{badge.name_ar}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs bg-gray-100 text-gray-800">
                            {badge.tier}
                          </Badge>
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            {badge.category}
                          </Badge>
                          <Badge className={`text-xs ${badge.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {badge.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {badge.description_ar}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {badge.users_count} مستخدم
                      </span>
                      <span className="text-gray-500">
                        {badge.points_required} نقطة
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => editBadge(badge)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm flex-1"
                      >
                        تحرير
                      </Button>
                      <Button
                        onClick={() => toggleBadgeStatus(badge.id, badge.is_active)}
                        className={`px-3 py-1 text-sm flex-1 ${
                          badge.is_active 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {badge.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* نموذج قاعدة النقاط */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRule ? 'تحرير قاعدة النقاط' : 'إضافة قاعدة نقاط جديدة'}
            </h2>
            
            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <Input
                placeholder="اسم القاعدة"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
                required
              />
              
              <Input
                placeholder="الاسم بالعربية"
                value={ruleForm.name_ar}
                onChange={(e) => setRuleForm({...ruleForm, name_ar: e.target.value})}
                required
              />
              
              <Input
                placeholder="نوع العمل"
                value={ruleForm.action_type}
                onChange={(e) => setRuleForm({...ruleForm, action_type: e.target.value})}
                required
              />
              
              <Input
                type="number"
                placeholder="النقاط"
                value={ruleForm.points}
                onChange={(e) => setRuleForm({...ruleForm, points: parseInt(e.target.value) || 0})}
                required
              />
              
              <Input
                type="number"
                placeholder="الحد اليومي (اختياري)"
                value={ruleForm.daily_limit}
                onChange={(e) => setRuleForm({...ruleForm, daily_limit: e.target.value})}
              />
              
              <Input
                type="number"
                placeholder="الحد الأسبوعي (اختياري)"
                value={ruleForm.weekly_limit}
                onChange={(e) => setRuleForm({...ruleForm, weekly_limit: e.target.value})}
              />
              
              <Input
                type="number"
                placeholder="الحد الشهري (اختياري)"
                value={ruleForm.monthly_limit}
                onChange={(e) => setRuleForm({...ruleForm, monthly_limit: e.target.value})}
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rule-active"
                  checked={ruleForm.is_active}
                  onChange={(e) => setRuleForm({...ruleForm, is_active: e.target.checked})}
                />
                <label htmlFor="rule-active">نشط</label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 flex-1">
                  {editingRule ? 'تحديث' : 'إضافة'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowRuleForm(false);
                    setEditingRule(null);
                    resetRuleForm();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نموذج الشارة */}
      {showBadgeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingBadge ? 'تحرير الشارة' : 'إضافة شارة جديدة'}
            </h2>
            
            <form onSubmit={handleBadgeSubmit} className="space-y-4">
              <Input
                placeholder="اسم الشارة"
                value={badgeForm.name}
                onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})}
                required
              />
              
              <Input
                placeholder="الاسم بالعربية"
                value={badgeForm.name_ar}
                onChange={(e) => setBadgeForm({...badgeForm, name_ar: e.target.value})}
                required
              />
              
              <Input
                placeholder="الوصف بالعربية"
                value={badgeForm.description_ar}
                onChange={(e) => setBadgeForm({...badgeForm, description_ar: e.target.value})}
                required
              />
              
              <Input
                placeholder="الأيقونة (emoji)"
                value={badgeForm.icon}
                onChange={(e) => setBadgeForm({...badgeForm, icon: e.target.value})}
                required
              />
              
              <select
                value={badgeForm.category}
                onChange={(e) => setBadgeForm({...badgeForm, category: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="engagement">التفاعل</option>
                <option value="content">المحتوى</option>
                <option value="social">الاجتماعي</option>
                <option value="achievement">الإنجازات</option>
                <option value="special">خاص</option>
              </select>
              
              <select
                value={badgeForm.tier}
                onChange={(e) => setBadgeForm({...badgeForm, tier: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="bronze">برونزي</option>
                <option value="silver">فضي</option>
                <option value="gold">ذهبي</option>
                <option value="platinum">بلاتيني</option>
                <option value="diamond">ماسي</option>
              </select>
              
              <Input
                type="number"
                placeholder="النقاط المطلوبة"
                value={badgeForm.points_required}
                onChange={(e) => setBadgeForm({...badgeForm, points_required: parseInt(e.target.value) || 0})}
              />
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="badge-active"
                  checked={badgeForm.is_active}
                  onChange={(e) => setBadgeForm({...badgeForm, is_active: e.target.checked})}
                />
                <label htmlFor="badge-active">نشط</label>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="bg-green-500 hover:bg-green-600 flex-1">
                  {editingBadge ? 'تحديث' : 'إضافة'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowBadgeForm(false);
                    setEditingBadge(null);
                    resetBadgeForm();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 