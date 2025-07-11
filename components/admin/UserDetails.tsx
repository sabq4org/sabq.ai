'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  KeyIcon,
  PowerIcon,
  PencilIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface UserDetailsProps {
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  failed_login_attempts: number;
  isLocked: boolean;
  locked_until?: string;
  sessionsCount: number;
  activityCount: number;
  sessions: Session[];
  audit_logs: AuditLog[];
}

interface Session {
  id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  success: boolean;
}

interface UserStats {
  byAction: Record<string, number>;
  activity: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    lastActivity: string | null;
  };
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'activity'>('overview');
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('فشل في جلب تفاصيل المستخدم');
      }

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleUserOperation = async (operation: string, data?: any) => {
    try {
      let response;
      
      switch (operation) {
        case 'change_password':
          response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              action: 'change_password',
              ...data,
            }),
          });
          break;
          
        case 'unlock_account':
          response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              action: 'unlock_account',
            }),
          });
          break;
          
        case 'terminate_sessions':
          response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              action: 'terminate_sessions',
            }),
          });
          break;
          
        default:
          return;
      }

      if (!response.ok) {
        throw new Error('فشل في تنفيذ العملية');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh user details
        fetchUserDetails();
        alert(result.message || 'تم تنفيذ العملية بنجاح');
      } else {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      'reader': 'قارئ',
      'editor': 'محرر',
      'admin': 'مشرف',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'banned': 'محظور',
      'pending': 'معلق',
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'banned': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const getActionDisplay = (action: string) => {
    const actionMap = {
      'LOGIN': 'تسجيل دخول',
      'LOGOUT': 'تسجيل خروج',
      'PASSWORD_CHANGED': 'تغيير كلمة المرور',
      'PROFILE_UPDATED': 'تحديث الملف الشخصي',
      'FAILED_LOGIN': 'محاولة دخول فاشلة',
      'ACCOUNT_LOCKED': 'قفل الحساب',
      'ACCOUNT_UNLOCKED': 'إلغاء قفل الحساب',
      'SESSION_TERMINATED': 'إنهاء الجلسة',
      'USER_UPDATED': 'تحديث المستخدم',
      'USER_DELETED': 'حذف المستخدم',
      'PASSWORD_CHANGED_BY_ADMIN': 'تغيير كلمة المرور من قبل المشرف',
      'ACCOUNT_UNLOCKED_BY_ADMIN': 'إلغاء قفل الحساب من قبل المشرف',
      'SESSIONS_TERMINATED_BY_ADMIN': 'إنهاء الجلسات من قبل المشرف',
    };
    return actionMap[action as keyof typeof actionMap] || action;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل المستخدم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600 ml-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">خطأ في تحميل البيانات</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={fetchUserDetails}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">المستخدم غير موجود</h3>
        <p className="mt-1 text-sm text-gray-500">
          لم يتم العثور على المستخدم المطلوب
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تفاصيل المستخدم</h1>
            <p className="text-sm text-gray-600 mt-1">
              آخر تحديث: {new Date(user.updated_at).toLocaleString('ar-SA')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showSensitiveInfo ? (
              <EyeSlashIcon className="w-4 h-4 ml-1" />
            ) : (
              <EyeIcon className="w-4 h-4 ml-1" />
            )}
            {showSensitiveInfo ? 'إخفاء' : 'إظهار'} المعلومات الحساسة
          </button>
          <button
            onClick={() => router.push(`/admin/users/${userId}/edit`)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="w-4 h-4 ml-2" />
            تعديل المستخدم
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-gray-500" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                {getStatusDisplay(user.status)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getRoleDisplay(user.role)}
              </span>
              {user.is_verified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="w-3 h-3 ml-1" />
                  محقق
                </span>
              )}
              {user.isLocked && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <LockClosedIcon className="w-3 h-3 ml-1" />
                  مقفل
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">البريد الإلكتروني:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">تاريخ الإنشاء:</span>
                <span className="font-medium">{new Date(user.created_at).toLocaleString('ar-SA')}</span>
              </div>
              
              {user.last_login && (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">آخر دخول:</span>
                  <span className="font-medium">{new Date(user.last_login).toLocaleString('ar-SA')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Info */}
        {showSensitiveInfo && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الأمان</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">محاولات الدخول الفاشلة</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{user.failed_login_attempts}</span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ComputerDesktopIcon className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">الجلسات النشطة</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{user.sessionsCount}</span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                  <span className="font-medium">سجل الأحداث</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{user.activityCount}</span>
              </div>
            </div>
            
            {user.locked_until && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <LockClosedIcon className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    الحساب مقفل حتى: {new Date(user.locked_until).toLocaleString('ar-SA')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">العمليات السريعة</h3>
          <div className="flex flex-wrap gap-2">
            {user.isLocked && (
              <button
                onClick={() => handleUserOperation('unlock_account')}
                className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <LockClosedIcon className="w-4 h-4 ml-2" />
                إلغاء قفل الحساب
              </button>
            )}
            
            <button
              onClick={() => {
                const newPassword = prompt('كلمة المرور الجديدة:');
                if (newPassword) {
                  handleUserOperation('change_password', {
                    newPassword,
                    forceChange: true,
                  });
                }
              }}
              className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <KeyIcon className="w-4 h-4 ml-2" />
              تغيير كلمة المرور
            </button>
            
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من إنهاء جميع جلسات المستخدم؟')) {
                  handleUserOperation('terminate_sessions');
                }
              }}
              className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <PowerIcon className="w-4 h-4 ml-2" />
              إنهاء جميع الجلسات
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الأحداث</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activity.totalActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">أحداث ناجحة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activity.successfulActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">أحداث فاشلة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activity.failedActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">آخر نشاط</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.activity.lastActivity 
                    ? new Date(stats.activity.lastActivity).toLocaleDateString('ar-SA')
                    : 'لا يوجد'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الجلسات ({user.sessionsCount})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              سجل النشاط ({user.activityCount})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">الأحداث حسب النوع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.byAction).map(([action, count]) => (
                    <div key={action} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {getActionDisplay(action)}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">الجلسات النشطة</h3>
              {user.sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد جلسات نشطة</p>
              ) : (
                <div className="space-y-3">
                  {user.sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ComputerDesktopIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {session.device_info || 'جهاز غير معروف'}
                            </p>
                            <p className="text-xs text-gray-500">
                              IP: {showSensitiveInfo ? session.ip_address : '***.***.***.**'}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">
                            آخر نشاط: {new Date(session.last_activity).toLocaleString('ar-SA')}
                          </p>
                          <p className="text-xs text-gray-500">
                            بدأت: {new Date(session.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">سجل النشاط</h3>
              {user.audit_logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا يوجد نشاط مسجل</p>
              ) : (
                <div className="space-y-3">
                  {user.audit_logs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            log.success ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getActionDisplay(log.action)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.resource && `المورد: ${log.resource}`}
                            </p>
                            {showSensitiveInfo && (
                              <p className="text-xs text-gray-500">
                                IP: {log.ip_address} | User Agent: {log.user_agent}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.success ? 'نجح' : 'فشل'}
                          </span>
                        </div>
                      </div>
                      {log.details && showSensitiveInfo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap text-gray-700">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails; 