'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, Clock, Calendar, Activity,
  Star, Award, Target, BarChart3, PieChart, BookOpen, Heart, Share2, MessageSquare,
  Eye, Timer, Zap, Sparkles
} from 'lucide-react';

interface UserBehavior {
  total_interactions: number;
  by_type: Record<string, number>;
  by_hour: Record<number, number>;
  by_day: Record<string, number>;
  average_duration: number;
  completion_rate: number;
}

interface UserBehaviorSummary {
  user_id: string;
  user_name: string;
  behavior: UserBehavior;
  loyalty_points: number;
  membership_level: string;
}

export default function BehaviorAnalyticsPage() {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [behavior, setBehavior] = useState<UserBehavior | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingRewards, setCalculatingRewards] = useState(false);
  const [rewardResult, setRewardResult] = useState<number | null>(null);

  // جلب قائمة المستخدمين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (data.success) {
          const usersData = data.data || data.users || [];
          setUsers(usersData);
          // اختيار أول مستخدم افتراضياً
          if (usersData.length > 0) {
            setSelectedUser(usersData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // جلب سلوك المستخدم المحدد
  useEffect(() => {
    if (!selectedUser) return;

    const fetchBehavior = async () => {
      try {
        const response = await fetch(`/api/interactions?user_id=${selectedUser}`);
        const data = await response.json();
        
        if (data.success) {
          setBehavior(data.data);
        }
      } catch (error) {
        console.error('Error fetching behavior:', error);
      }
    };

    fetchBehavior();
  }, [selectedUser]);

  // حساب المكافآت
  const calculateRewards = async () => {
    if (!selectedUser) return;

    setCalculatingRewards(true);
    try {
      const response = await fetch(`/api/interactions?user_id=${selectedUser}&action=calculate_rewards`);
      const data = await response.json();
      
      if (data.success) {
        const responseData = data.data || data;
        setRewardResult(responseData.bonus_points || 0);
        // إعادة جلب السلوك لتحديث البيانات
        const behaviorResponse = await fetch(`/api/interactions?user_id=${selectedUser}`);
        const behaviorData = await behaviorResponse.json();
        if (behaviorData.success) {
          setBehavior(behaviorData.data);
        }
      }
    } catch (error) {
      console.error('Error calculating rewards:', error);
    } finally {
      setCalculatingRewards(false);
    }
  };

  // حساب النشاط الأكثر
  const getMostActiveTime = () => {
    if (!behavior?.by_hour) return null;
    
    const entries = Object.entries(behavior.by_hour);
    if (entries.length === 0) return null;
    
    const sorted = entries.sort(([, a], [, b]) => b - a);
    const hour = parseInt(sorted[0][0]);
    
    return `${hour}:00 - ${hour + 1}:00`;
  };

  // حساب اليوم الأكثر نشاطاً
  const getMostActiveDay = () => {
    if (!behavior?.by_day) return null;
    
    const entries = Object.entries(behavior.by_day);
    if (entries.length === 0) return null;
    
    const sorted = entries.sort(([, a], [, b]) => b - a);
    return sorted[0][0];
  };

  // حساب النوع الأكثر تفاعلاً
  const getMostInteractionType = () => {
    if (!behavior?.by_type) return null;
    
    const entries = Object.entries(behavior.by_type);
    if (entries.length === 0) return null;
    
    const sorted = entries.sort(([, a], [, b]) => b - a);
    return sorted[0][0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* الرأس */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تحليل السلوك الذكي</h1>
            <p className="text-gray-600">فهم عميق لسلوك المستخدمين وتفاعلاتهم</p>
          </div>
        </div>

        {/* اختيار المستخدم */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">اختر المستخدم:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={calculateRewards}
              disabled={calculatingRewards || !selectedUser}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {calculatingRewards ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Award className="w-4 h-4" />
              )}
              حساب المكافآت
            </button>
          </div>

          {rewardResult !== null && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Sparkles className="w-5 h-5" />
                <span>تم منح المستخدم <strong>{rewardResult}</strong> نقطة مكافأة على السلوك الإيجابي!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {behavior && (
        <>
          {/* البطاقات الإحصائية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* إجمالي التفاعلات */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{behavior.total_interactions}</h3>
              <p className="text-gray-600">إجمالي التفاعلات</p>
            </div>

            {/* معدل الإكمال */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-600">
                  {behavior.completion_rate.toFixed(1)}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{behavior.completion_rate.toFixed(0)}%</h3>
              <p className="text-gray-600">معدل إكمال القراءة</p>
            </div>

            {/* متوسط المدة */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Timer className="w-6 h-6 text-purple-600" />
                </div>
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {Math.floor(behavior.average_duration / 60)} د
              </h3>
              <p className="text-gray-600">متوسط وقت القراءة</p>
            </div>

            {/* أنواع التفاعل */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-sm text-orange-600 font-medium">
                  {Object.keys(behavior.by_type).length} أنواع
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 capitalize">
                {getMostInteractionType() || 'لا يوجد'}
              </h3>
              <p className="text-gray-600">النوع الأكثر تفاعلاً</p>
            </div>
          </div>

          {/* الرسوم البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* توزيع أنواع التفاعل */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">توزيع أنواع التفاعل</h3>
              </div>

              <div className="space-y-4">
                {Object.entries(behavior.by_type).map(([type, count]) => {
                  const percentage = (count / behavior.total_interactions) * 100;
                  const icon = {
                    view: Eye,
                    read: BookOpen,
                    like: Heart,
                    share: Share2,
                    comment: MessageSquare,
                    save: Star
                  }[type] || Activity;
                  const Icon = icon;
                  const color = {
                    view: 'bg-blue-500',
                    read: 'bg-green-500',
                    like: 'bg-red-500',
                    share: 'bg-purple-500',
                    comment: 'bg-yellow-500',
                    save: 'bg-orange-500'
                  }[type] || 'bg-gray-500';

                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-700 capitalize">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <span className="text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* النشاط حسب الوقت */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">النشاط حسب ساعات اليوم</h3>
              </div>

              <div className="space-y-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const count = behavior.by_hour[hour] || 0;
                  const maxCount = Math.max(...Object.values(behavior.by_hour));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={hour} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-12 text-left">
                        {hour}:00
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-left">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>أكثر الأوقات نشاطاً:</strong> {getMostActiveTime() || 'لا توجد بيانات'}
                </p>
              </div>
            </div>

            {/* النشاط حسب الأيام */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">النشاط حسب أيام الأسبوع</h3>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => {
                  const count = behavior.by_day[day] || 0;
                  const maxCount = Math.max(...Object.values(behavior.by_day));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const isActive = day === getMostActiveDay();

                  return (
                    <div key={day} className="text-center">
                      <div className={`relative w-full h-24 ${isActive ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg flex items-end justify-center p-2`}>
                        <div 
                          className={`w-full ${isActive ? 'bg-blue-500' : 'bg-gray-400'} rounded transition-all duration-500`}
                          style={{ height: `${percentage}%` }}
                        />
                        <span className="absolute top-2 text-xs font-medium text-gray-700">
                          {count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{day}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* الإحصائيات المتقدمة */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Star className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">رؤى متقدمة</h3>
              </div>

              <div className="space-y-4">
                {/* نوع المستخدم */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">نوع المستخدم</h4>
                  <p className="text-sm text-gray-600">
                    {behavior.completion_rate >= 80 ? (
                      <span className="text-green-600 font-medium">قارئ متفاني 📚</span>
                    ) : behavior.completion_rate >= 50 ? (
                      <span className="text-blue-600 font-medium">قارئ نشط 📖</span>
                    ) : (
                      <span className="text-orange-600 font-medium">متصفح سريع 👀</span>
                    )}
                  </p>
                </div>

                {/* مستوى التفاعل */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">مستوى التفاعل</h4>
                  <p className="text-sm text-gray-600">
                    {Object.keys(behavior.by_type).length >= 4 ? (
                      <span className="text-green-600 font-medium">متفاعل جداً 🌟</span>
                    ) : Object.keys(behavior.by_type).length >= 2 ? (
                      <span className="text-blue-600 font-medium">متفاعل 👍</span>
                    ) : (
                      <span className="text-orange-600 font-medium">قارئ صامت 🤫</span>
                    )}
                  </p>
                </div>

                {/* نصائح للتحسين */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">توصيات التخصيص</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {behavior.completion_rate < 50 && (
                      <li>• اعرض مقالات أقصر لهذا المستخدم</li>
                    )}
                    {getMostActiveTime() && (
                      <li>• أرسل الإشعارات في {getMostActiveTime()}</li>
                    )}
                    {Object.keys(behavior.by_type).length < 3 && (
                      <li>• شجع على المزيد من التفاعل (مشاركة، تعليق)</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 