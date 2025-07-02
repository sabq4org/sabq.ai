'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Crown, Star, Award, AlertTriangle, CheckCircle, 
  Search, Filter, Mail, Calendar, Eye, 
  RefreshCw, Download, UserCheck, UserX, MessageCircle,
  ChevronDown, ArrowUpDown, MoreVertical,
  Gift, Shield, Activity
} from 'lucide-react';

interface LoyaltyUser {
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  total_points: number;
  earned_points: number;
  redeemed_points: number;
  tier: string;
  role: string;
  email_verified: boolean;
  last_activity: string;
  interactions_count: number;
  status: 'active' | 'orphaned' | 'no_loyalty';
  profile_created_at: string;
  loyalty_created_at?: string;
}

const TIER_COLORS = {
  bronze: 'bg-orange-100 text-orange-800 border-orange-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200', 
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ambassador: 'bg-purple-100 text-purple-800 border-purple-200',
  new: 'bg-blue-100 text-blue-800 border-blue-200'
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  orphaned: 'bg-red-100 text-red-800 border-red-200',
  no_loyalty: 'bg-gray-100 text-gray-600 border-gray-200'
};

const TIER_ICONS = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  ambassador: Shield,
  new: Users
};

export default function LoyaltyUsersPage() {
  const [users, setUsers] = useState<LoyaltyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'date' | 'activity'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // جلب بيانات المستخدمين
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/loyalty/stats');
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المستخدمين');
      }

      const result = await response.json();
      if (result.success && result.data?.allUsers) {
        setUsers(result.data.allUsers);
      } else {
        throw new Error('بيانات غير صحيحة من الخادم');
      }
    } catch (err) {
      console.error('خطأ في جلب المستخدمين:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  // تصفية وترتيب المستخدمين
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesTier = tierFilter === 'all' || user.tier === tierFilter;

      return matchesSearch && matchesStatus && matchesTier;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'points':
          aValue = a.total_points;
          bValue = b.total_points;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.profile_created_at).getTime();
          bValue = new Date(b.profile_created_at).getTime();
          break;
        case 'activity':
          aValue = new Date(a.last_activity).getTime();
          bValue = new Date(b.last_activity).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getTierIcon = (tier: string) => {
    const IconComponent = TIER_ICONS[tier as keyof typeof TIER_ICONS] || Users;
    return IconComponent;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.ceil(diffDays / 7)} أسابيع`;
    return `منذ ${Math.ceil(diffDays / 30)} أشهر`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'orphaned': return 'معزول';
      case 'no_loyalty': return 'بدون ولاء';
      default: return status;
    }
  };

  const getTierText = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'برونزي';
      case 'silver': return 'فضي';
      case 'gold': return 'ذهبي';
      case 'ambassador': return 'سفير';
      case 'new': return 'جديد';
      default: return tier;
    }
  };

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">خطأ في تحميل البيانات</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">مستخدمو الولاء</h1>
                  <p className="text-blue-100 text-lg">إدارة شاملة لنظام الولاء والعضويات</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={fetchUsers}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all">
                  <Download className="w-4 h-4" />
                  تصدير
                </button>
              </div>
            </div>

            {/* الإحصائيات السريعة */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                    <div className="text-sm text-blue-100">إجمالي المستخدمين</div>
                  </div>
                  <Users className="w-8 h-8 text-white/80" />
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {users.filter(u => u.status === 'active').length}
                    </div>
                    <div className="text-sm text-blue-100">مستخدمون نشطون</div>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-300" />
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {users.filter(u => u.status === 'no_loyalty').length}
                    </div>
                    <div className="text-sm text-blue-100">بدون نقاط ولاء</div>
                  </div>
                  <UserX className="w-8 h-8 text-yellow-300" />
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {users.filter(u => u.status === 'orphaned').length}
                    </div>
                    <div className="text-sm text-blue-100">حسابات معزولة</div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* أدوات التصفية والبحث */}
        <div className="bg-white rounded-3xl p-6 mb-8 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* البحث */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* أزرار التصفية */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <Filter className="w-4 h-4" />
                فلاتر
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
              </button>
            </div>
          </div>

          {/* فلاتر متقدمة */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="no_loyalty">بدون ولاء</option>
                    <option value="orphaned">معزول</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المستوى</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">جميع المستويات</option>
                    <option value="new">جديد</option>
                    <option value="bronze">برونزي</option>
                    <option value="silver">فضي</option>
                    <option value="gold">ذهبي</option>
                    <option value="ambassador">سفير</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب حسب</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="points">النقاط</option>
                    <option value="name">الاسم</option>
                    <option value="date">تاريخ التسجيل</option>
                    <option value="activity">آخر نشاط</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setTierFilter('all');
                      setSortBy('points');
                      setSortOrder('desc');
                    }}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* قائمة المستخدمين */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              المستخدمون ({filteredAndSortedUsers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">المستخدم</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">النقاط</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">المستوى</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">آخر نشاط</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedUsers.map((user) => {
                  const TierIcon = getTierIcon(user.tier);
                  
                  return (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            {user.email_verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              عضو منذ {formatDate(user.profile_created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-gray-900">{user.total_points.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{user.interactions_count} تفاعل</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${TIER_COLORS[user.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze}`}>
                          <TierIcon className="w-4 h-4" />
                          {getTierText(user.tier)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[user.status as keyof typeof STATUS_COLORS]}`}>
                          {user.status === 'active' ? <Activity className="w-4 h-4" /> : 
                           user.status === 'orphaned' ? <AlertTriangle className="w-4 h-4" /> : 
                           <UserX className="w-4 h-4" />}
                          {getStatusText(user.status)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {formatTimeSince(user.last_activity)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(user.last_activity)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                            <Gift className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || tierFilter !== 'all' 
                  ? 'جرب تعديل معايير البحث أو الفلاتر'
                  : 'لا يوجد مستخدمون في النظام'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 