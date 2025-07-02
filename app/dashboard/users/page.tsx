'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users,
  UserCheck,
  UserX,
  Ban,
  Plus,
  Search,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Award,
  Shield,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Key,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Medal,
  BadgeCheck,
  Crown,
  Database
} from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getMembershipLevel } from '@/lib/loyalty';
import { TabsEnhanced } from '@/components/ui/tabs-enhanced';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'unspecified';
  country?: string;
  city?: string;
  avatar?: string;
  isVerified?: boolean;
  status?: 'active' | 'pending' | 'banned' | 'suspended' | 'deleted';
  role?: 'regular' | 'vip' | 'media' | 'admin' | 'editor' | 'trainee';
  tags?: string[];
  loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'ambassador';
  loyaltyPoints?: number;
  lastLogin?: string;
  created_at: string;
  updated_at: string;
}

interface EditUserData {
  name: string;
  status: string;
  role: string;
  isVerified: boolean;
  newPassword?: string;
}

// خريطة أيقونات مستويات الولاء
const loyaltyIconMap: Record<string, any> = {
  'برونزي': Medal,
  'فضي': Award,
  'ذهبي': BadgeCheck,
  'سفير': Crown
};

export default function UsersPage() {
  const { darkMode } = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditUserData>({
    name: '',
    status: 'active',
    role: 'regular',
    isVerified: false,
    newPassword: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // معالجة البيانات بناءً على الشكل المُرجع من API
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Invalid users data format:', data);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      status: user.status || 'active',
      role: user.role || 'regular',
      isVerified: user.isVerified || false,
      newPassword: ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        showNotification('success', 'تم تحديث بيانات المستخدم بنجاح');
        setShowEditModal(false);
        fetchUsers();
      } else {
        throw new Error('فشل في تحديث البيانات');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ أثناء تحديث البيانات');
    }
  };

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showNotification('success', `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الحساب`);
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ أثناء تغيير حالة الحساب');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('success', 'تم حذف المستخدم نهائياً');
        setShowDeleteConfirm(false);
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ أثناء حذف المستخدم');
    }
  };

  const stats = {
    total: Array.isArray(users) ? users.length : 0,
    active: Array.isArray(users) ? users.filter(u => u.status === 'active').length : 0,
    suspended: Array.isArray(users) ? users.filter(u => u.status === 'suspended').length : 0,
    banned: Array.isArray(users) ? users.filter(u => u.status === 'banned').length : 0,
    verified: Array.isArray(users) ? users.filter(u => u.isVerified).length : 0,
    newThisWeek: Array.isArray(users) ? users.filter(u => {
      const joinDate = new Date(u.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return joinDate >= weekAgo;
    }).length : 0,
    activeNow: Array.isArray(users) ? users.filter(u => {
      if (!u.lastLogin) return false;
      const lastLoginDate = new Date(u.lastLogin);
      const hourAgo = new Date();
      hourAgo.setHours(hourAgo.getHours() - 1);
      return lastLoginDate >= hourAgo;
    }).length : 0,
    suspendedPercentage: Array.isArray(users) && users.length > 0 
      ? Math.round((users.filter(u => u.status === 'suspended' || u.status === 'banned').length / users.length) * 100)
      : 0
  };



  const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgColor,
    iconColor
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>{value}</p>
        <p className={`text-sm transition-colors duration-300 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>{subtitle}</p>
        <p className={`text-xs mt-1 transition-colors duration-300 ${
          darkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>{title}</p>
      </div>
    </div>
  );

  const getFilteredUsers = () => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.phone && user.phone.includes(searchTerm)) ||
                           (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // فلترة بناءً على التاب النشط
      let matchesTab = true;
      switch(activeTab) {
        case 'active':
          matchesTab = user.status === 'active';
          break;
        case 'suspended':
          matchesTab = user.status === 'suspended' || user.status === 'banned';
          break;
        case 'verified':
          matchesTab = user.isVerified === true;
          break;
        case 'new':
          const joinDate = new Date(user.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesTab = joinDate >= weekAgo;
          break;
        default:
          matchesTab = true;
      }
      
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      return matchesSearch && matchesTab && matchesStatus && matchesRole;
    });
  };

  const filteredUsers = getFilteredUsers();

  const UserRow = ({ user }: { user: User }) => {
    const loyaltyLevel = getMembershipLevel(user.loyaltyPoints || 0);
    const LoyaltyIcon = loyaltyIconMap[loyaltyLevel.name] || Users;
    
    const getStatusBadge = (status?: string) => {
      switch (status) {
        case 'active':
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">🟢 نشط</span>;
        case 'suspended':
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">🟡 موقوف</span>;
        case 'banned':
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">🔴 محظور</span>;
        case 'deleted':
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">🟣 محذوف</span>;
        default:
          return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">غير محدد</span>;
      }
    };

    const getRoleBadge = (role?: string) => {
      const roles: Record<string, { label: string; color: string }> = {
        admin: { label: 'مسؤول', color: 'bg-red-100 text-red-700' },
        editor: { label: 'محرر', color: 'bg-blue-100 text-blue-700' },
        media: { label: 'إعلامي', color: 'bg-purple-100 text-purple-700' },
        vip: { label: 'VIP', color: 'bg-yellow-100 text-yellow-700' },
        trainee: { label: 'متدرب', color: 'bg-green-100 text-green-700' },
        regular: { label: 'عادي', color: 'bg-gray-100 text-gray-700' }
      };
      
      const roleInfo = roles[role || 'regular'];
      return <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>;
    };

    return (
      <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}>
        <td className="px-6 py-4">
          <div className="flex items-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="mr-3">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.name}
                </p>
                {user.isVerified && (
                  <Shield className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user.email}
              </p>
            </div>
          </div>
        </td>

        <td className="px-6 py-4">
          {getStatusBadge(user.status)}
        </td>

        <td className="px-6 py-4">
          {getRoleBadge(user.role)}
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${loyaltyLevel.bgColor}`}>
              <LoyaltyIcon className={`w-4 h-4`} style={{ color: loyaltyLevel.color }} />
            </div>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {loyaltyLevel.name}
            </span>
          </div>
        </td>

        <td className="px-6 py-4">
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ar })}
          </p>
        </td>

        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(user)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={() => toggleUserStatus(user)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                user.status === 'active' ? 'text-green-600' : 'text-gray-400'
              }`}
              title={user.status === 'active' ? 'إيقاف' : 'تفعيل'}
            >
              {user.status === 'active' ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => {
                setSelectedUser(user);
                setShowDetailsModal(true);
              }}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
              title="عرض التفاصيل"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setSelectedUser(user);
                setShowDeleteConfirm(true);
              }}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>إدارة المستخدمين</h1>
          <p className={`transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>إدارة شاملة للمستخدمين المسجلين في صحيفة سبق الإلكترونية</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-300"
          >
            <Plus className="w-4 h-4" />
            إضافة مستخدم
          </button>
          <button className={`p-2 rounded-lg border transition-colors duration-300 ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
            <Upload className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded-lg border transition-colors duration-300 ${
            darkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatsCard
          title="إجمالي المستخدمين"
          value={stats.total}
          subtitle="مستخدم"
          icon={Users}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="المستخدمون النشطون"
          value={stats.active}
          subtitle="نشط"
          icon={UserCheck}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="الموقوفون مؤقتاً"
          value={stats.suspended}
          subtitle="موقوف"
          icon={UserX}
          bgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="المحظورون"
          value={stats.banned}
          subtitle="محظور"
          icon={Ban}
          bgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatsCard
          title="الحسابات الموثقة"
          value={stats.verified}
          subtitle="موثق"
          icon={Shield}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="انضموا هذا الأسبوع"
          value={stats.newThisWeek}
          subtitle="جديد"
          icon={UserPlus}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* إضافة التابات المحسنة */}
      <TabsEnhanced
        tabs={[
          { id: 'all', name: 'جميع المستخدمين', icon: Database, count: stats.total },
          { id: 'active', name: 'النشطون', icon: UserCheck, count: stats.active },
          { id: 'suspended', name: 'الموقوفون', icon: UserX, count: stats.suspended },
          { id: 'verified', name: 'الموثقون', icon: Shield, count: stats.verified },
          { id: 'new', name: 'الجدد', icon: UserPlus, count: stats.newThisWeek }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          // تحديث الفلاتر بناءً على التاب المختار
          switch(tabId) {
            case 'active':
              setSelectedStatus('active');
              break;
            case 'suspended':
              setSelectedStatus('suspended');
              break;
            case 'verified':
              // سيتم التعامل معه في getFilteredUsers
              setSelectedStatus('all');
              break;
            case 'new':
              // سيتم التعامل معه في getFilteredUsers
              setSelectedStatus('all');
              break;
            default:
              setSelectedStatus('all');
          }
        }}
      />

      <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <div className={`px-6 py-4 border-b transition-colors duration-300 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96">
                <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="البحث بالاسم، البريد، العضوية أو رقم الجوال..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 pr-10 text-sm rounded-lg border transition-colors duration-300 ${
                                          darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
                <option value="deleted">محذوف</option>
              </select>
              
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                <option value="all">جميع الأنواع</option>
                <option value="admin">مسؤول</option>
                <option value="editor">محرر</option>
                <option value="media">إعلامي</option>
                <option value="vip">VIP</option>
                <option value="trainee">متدرب</option>
                <option value="regular">عادي</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`transition-colors duration-300 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>المستخدم</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>الحالة</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>النوع</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>فئة الولاء</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>تاريخ التسجيل</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-300 ${
              darkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <UserRow key={user.id} user={user} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={`px-6 py-8 text-center transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {users.length === 0 ? 'لا يوجد مستخدمون مسجلون حتى الآن' : 'لا توجد نتائج مطابقة للبحث'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                تعديل بيانات المستخدم
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>الاسم الكامل</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className={`w-full px-4 py-2 rounded-lg border cursor-not-allowed ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-600 text-gray-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>نوع المستخدم</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="regular">عادي</option>
                  <option value="vip">VIP</option>
                  <option value="media">إعلامي</option>
                  <option value="editor">محرر</option>
                  <option value="trainee">متدرب</option>
                  <option value="admin">مسؤول</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>الحالة</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="banned">محظور</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verified"
                  checked={editFormData.isVerified}
                  onChange={(e) => setEditFormData({...editFormData, isVerified: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="verified" className={`text-sm font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>حساب موثق</label>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>كلمة المرور الجديدة (اختياري)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={editFormData.newPassword}
                    onChange={(e) => setEditFormData({...editFormData, newPassword: e.target.value})}
                    placeholder="اتركه فارغاً إذا لم ترد تغييره"
                    className={`w-full px-4 py-2 pr-10 text-sm rounded-lg border transition-colors duration-300 ${
                                          darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                  <Key className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ التعديلات
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                تأكيد حذف المستخدم
              </h3>
              
              <p className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                هل أنت متأكد من حذف العضوية نهائياً؟<br />
                <strong>{selectedUser.name}</strong><br />
                <span className="text-red-500">لا يمكن استعادة البيانات بعد الحذف!</span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف نهائياً
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                إضافة مستخدم جديد
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const newUser = {
                  id: Date.now().toString(),
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
                  role: formData.get('role') as string || 'regular',
                  status: 'active',
                  isVerified: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                setUsers([...users, newUser as User]);
                setShowAddModal(false);
                showNotification('success', 'تم إضافة المستخدم بنجاح');
                e.currentTarget.reset();
              } catch (error) {
                showNotification('error', 'فشل في إضافة المستخدم');
              }
            }} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>الاسم الكامل <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>كلمة المرور <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>نوع المستخدم</label>
                <select
                  name="role"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="regular">عادي</option>
                  <option value="vip">VIP</option>
                  <option value="media">إعلامي</option>
                  <option value="editor">محرر</option>
                  <option value="trainee">متدرب</option>
                  <option value="admin">مسؤول</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  إضافة المستخدم
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal عرض تفاصيل المستخدم */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl p-6 rounded-2xl shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                تفاصيل المستخدم
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* المعلومات الأساسية */}
              <div className="col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  {selectedUser.avatar ? (
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name} 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedUser.name}
                      </h4>
                      {selectedUser.isVerified && (
                        <Shield className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* معلومات الحساب */}
              <div className="space-y-3">
                <h5 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  معلومات الحساب
                </h5>
                
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الحالة:</span>
                  {selectedUser.status === 'active' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">🟢 نشط</span>
                  )}
                  {selectedUser.status === 'suspended' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">🟡 موقوف</span>
                  )}
                  {selectedUser.status === 'deleted' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">🔴 محذوف</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>نوع الحساب:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedUser.role === 'admin' && 'مسؤول'}
                    {selectedUser.role === 'editor' && 'محرر'}
                    {selectedUser.role === 'media' && 'إعلامي'}
                    {selectedUser.role === 'vip' && 'VIP'}
                    {selectedUser.role === 'trainee' && 'متدرب'}
                    {selectedUser.role === 'regular' && 'عادي'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>تاريخ التسجيل:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {format(new Date(selectedUser.created_at), 'dd MMMM yyyy', { locale: ar })}
                  </span>
                </div>
              </div>

              {/* معلومات الولاء */}
              <div className="space-y-3">
                <h5 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  برنامج الولاء
                </h5>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الفئة:</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const loyalty = getMembershipLevel(selectedUser.loyaltyPoints || 0);
                      const LoyaltyDetailIcon = loyaltyIconMap[loyalty.name] || Users;
                      return (
                        <>
                          <div className={`p-1.5 rounded-lg ${loyalty.bgColor}`}>
                            <LoyaltyDetailIcon className={`w-4 h-4`} style={{ color: loyalty.color }} />
                          </div>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {loyalty.name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>النقاط:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedUser.loyaltyPoints || 0} نقطة
                  </span>
                </div>

                {selectedUser.lastLogin && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>آخر دخول:</span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(selectedUser.lastLogin), 'dd MMMM yyyy', { locale: ar })}
                    </span>
                  </div>
                )}
              </div>

              {/* معلومات الاتصال */}
              {(selectedUser.phone || selectedUser.country || selectedUser.city) && (
                <div className="col-span-2 space-y-3">
                  <h5 className={`font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    معلومات الاتصال
                  </h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.phone && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>رقم الجوال:</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedUser.phone}
                        </span>
                      </div>
                    )}
                    
                    {selectedUser.country && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>الدولة:</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedUser.country}
                        </span>
                      </div>
                    )}
                    
                    {selectedUser.city && (
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>المدينة:</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedUser.city}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedUser);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                تعديل البيانات
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* الإشعارات */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
} 