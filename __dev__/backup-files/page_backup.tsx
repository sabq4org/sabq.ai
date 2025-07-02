'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, Plus, Eye, Edit3, UserMinus, UserCheck, MoreVertical, TrendingUp, FileText, Clock, Zap, Award, MapPin, Calendar, Activity, Settings, UserPlus, RefreshCw, Save, Trash2 } from 'lucide-react'

interface TeamMember {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  group: string;
  status: 'نشط' | 'غائب' | 'موقوف' | 'تحت التدريب';
  location: string;
  joinDate: string;
  lastActive: string;
  performance: {
    articlesPublished: number;
    articlesApproved: number;
    articlesRejected: number;
    approvalRate: number;
    aiUsage: number;
    avgResponseTime: string;
  };
  recentActivity: Array<{
    id: number;
    action: string;
    target: string;
    time: string;
    type: 'publish' | 'edit' | 'comment' | 'ai' | 'login';
  }>;
}

interface Group {
  id: number;
  name: string;
  color: string;
  memberCount: number;
}

interface SearchUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: string;
}

// بيانات وهمية للفريق
const initialTeamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'أحمد محمد السالم',
    email: 'ahmed.salem@sabq.org',
    avatar: '/api/placeholder/40/40',
    role: 'رئيس تحرير',
    group: 'إدارة المحتوى',
    status: 'نشط',
    location: 'الرياض',
    joinDate: '2023-01-15',
    lastActive: 'منذ 5 دقائق',
    performance: {
      articlesPublished: 127,
      articlesApproved: 145,
      articlesRejected: 8,
      approvalRate: 94.8,
      aiUsage: 87,
      avgResponseTime: '1.2 ساعة'
    },
    recentActivity: [
      { id: 1, action: 'نشر مقال', target: 'أحدث التطورات التقنية', time: 'منذ 10 دقائق', type: 'publish' },
      { id: 2, action: 'استخدم AI للتلخيص', target: 'مقال الاقتصاد', time: 'منذ 25 دقيقة', type: 'ai' },
      { id: 3, action: 'راجع مقال', target: 'أخبار الرياضة', time: 'منذ ساعة', type: 'edit' },
      { id: 4, action: 'رد على تعليق', target: 'مقال السياسة', time: 'منذ ساعتين', type: 'comment' },
      { id: 5, action: 'دخول للنظام', target: 'لوحة التحكم', time: 'منذ 3 ساعات', type: 'login' }
    ]
  },
  {
    id: 2,
    name: 'فاطمة عبدالله النور',
    email: 'fatima.noor@sabq.org',
    avatar: '/api/placeholder/40/40',
    role: 'محرر أول',
    group: 'إدارة المحتوى',
    status: 'نشط',
    location: 'جدة',
    joinDate: '2023-03-22',
    lastActive: 'منذ 15 دقيقة',
    performance: {
      articlesPublished: 89,
      articlesApproved: 92,
      articlesRejected: 5,
      approvalRate: 94.8,
      aiUsage: 72,
      avgResponseTime: '45 دقيقة'
    },
    recentActivity: [
      { id: 1, action: 'تحرير مقال', target: 'أخبار المناخ', time: 'منذ 15 دقيقة', type: 'edit' },
      { id: 2, action: 'استخدم AI للترجمة', target: 'تقرير دولي', time: 'منذ ساعة', type: 'ai' },
      { id: 3, action: 'نشر مقال', target: 'التكنولوجيا الجديدة', time: 'منذ ساعتين', type: 'publish' }
    ]
  },
  {
    id: 3,
    name: 'سارة محمد الأحمد',
    email: 'sara.ahmed@sabq.org',
    avatar: '/api/placeholder/40/40',
    role: 'مسؤول مكتبة الوسائط',
    group: 'إدارة الوسائط',
    status: 'نشط',
    location: 'الدمام',
    joinDate: '2023-05-10',
    lastActive: 'منذ 30 دقيقة',
    performance: {
      articlesPublished: 45,
      articlesApproved: 156,
      articlesRejected: 3,
      approvalRate: 98.1,
      aiUsage: 95,
      avgResponseTime: '20 دقيقة'
    },
    recentActivity: [
      { id: 1, action: 'رفع صور جديدة', target: 'مكتبة الوسائط', time: 'منذ 30 دقيقة', type: 'edit' },
      { id: 2, action: 'استخدم AI لتحسين الصور', target: '15 صورة', time: 'منذ ساعة', type: 'ai' }
    ]
  },
  {
    id: 4,
    name: 'خالد عبدالرحمن الشهري',
    email: 'khalid.shehri@sabq.org',
    avatar: '/api/placeholder/40/40',
    role: 'مشرف تعليقات',
    group: 'إدارة التفاعل',
    status: 'غائب',
    location: 'أبها',
    joinDate: '2023-07-01',
    lastActive: 'منذ يومين',
    performance: {
      articlesPublished: 12,
      articlesApproved: 234,
      articlesRejected: 45,
      approvalRate: 83.9,
      aiUsage: 34,
      avgResponseTime: '2.5 ساعة'
    },
    recentActivity: [
      { id: 1, action: 'حذف تعليق غير لائق', target: 'مقال الأخبار المحلية', time: 'منذ يومين', type: 'comment' },
      { id: 2, action: 'راجع 25 تعليق', target: 'مقالات متنوعة', time: 'منذ يومين', type: 'edit' }
    ]
  },
  {
    id: 5,
    name: 'منى سعد الغامدي',
    email: 'mona.ghamdi@sabq.org',
    avatar: '/api/placeholder/40/40',
    role: 'مسؤول AI',
    group: 'الذكاء الاصطناعي',
    status: 'نشط',
    location: 'الرياض',
    joinDate: '2023-02-14',
    lastActive: 'منذ ساعة',
    performance: {
      articlesPublished: 23,
      articlesApproved: 67,
      articlesRejected: 2,
      approvalRate: 97.1,
      aiUsage: 98,
      avgResponseTime: '15 دقيقة'
    },
    recentActivity: [
      { id: 1, action: 'تحديث نموذج AI', target: 'نظام التلخيص', time: 'منذ ساعة', type: 'ai' },
      { id: 2, action: 'راجع استخدام AI', target: 'تقرير شهري', time: 'منذ 3 ساعات', type: 'edit' }
    ]
  },
  {
    id: 6,
    name: 'علي حسن المالكي',
    email: 'ali.malki@sabq.org',
    avatar: '/api/placeholder/40/40',
    role: 'محرر',
    group: 'إدارة المحتوى',
    status: 'تحت التدريب',
    location: 'مكة المكرمة',
    joinDate: '2024-01-10',
    lastActive: 'منذ ساعتين',
    performance: {
      articlesPublished: 15,
      articlesApproved: 18,
      articlesRejected: 7,
      approvalRate: 72.0,
      aiUsage: 45,
      avgResponseTime: '3 ساعات'
    },
    recentActivity: [
      { id: 1, action: 'كتب مقال جديد', target: 'أخبار محلية', time: 'منذ ساعتين', type: 'edit' },
      { id: 2, action: 'استخدم AI للمساعدة', target: 'تحسين النص', time: 'منذ 3 ساعات', type: 'ai' }
    ]
  }
]

const groups: Group[] = [
  { id: 1, name: 'إدارة المحتوى', color: 'blue', memberCount: 3 },
  { id: 2, name: 'إدارة الوسائط', color: 'purple', memberCount: 1 },
  { id: 3, name: 'إدارة التفاعل', color: 'green', memberCount: 1 },
  { id: 4, name: 'الذكاء الاصطناعي', color: 'orange', memberCount: 1 },
  { id: 5, name: 'الإدارة العامة', color: 'red', memberCount: 0 }
]

const roles = [
  'رئيس تحرير', 'محرر أول', 'محرر', 'مسؤول مكتبة الوسائط', 'مراجع وسائط', 
  'مشرف تعليقات', 'مدير مجتمع', 'مسؤول AI', 'محلل استخدام', 'مدير عام'
]

const AVAILABLE_ROLES = [
  'رئيس التحرير',
  'نائب رئيس التحرير', 
  'محرر',
  'مدقق',
  'محرر وسائط',
  'مشرف تعليقات',
  'مسوق المحتوى',
  'محلل البيانات',
  'مطور'
]

const AVAILABLE_GROUPS = [
  'إدارة المحتوى',
  'التطوير التقني',
  'التسويق والنشر',
  'إدارة التفاعل',
  'تحليل البيانات',
  'إدارة الوسائط',
  'الأمان والحماية'
]

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('الكل')
  const [selectedRole, setSelectedRole] = useState<string>('الكل')
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // بيانات النموذج الجديد
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    email: '',
    role: '',
    group: '',
    location: '',
    status: 'نشط' as 'نشط' | 'غائب' | 'موقوف' | 'تحت التدريب'
  })

  // حالات البحث والإضافة
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // البحث في المستخدمين
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data.users || [])
      } catch (error) {
        console.error('خطأ في البحث:', error)
        setSearchResults([])
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // إسناد الدور
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole || !selectedGroup) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
          group: selectedGroup
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // إضافة العضو الجديد للقائمة
        setTeamMembers(prev => [...prev, data.user])
        
        // إعادة تعيين النموذج
        setShowAddModal(false)
        setSearchQuery('')
        setSelectedUser(null)
        setSelectedRole('')
        setSelectedGroup('')
        setShowSuccess(true)
        
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        alert(data.error || 'حدث خطأ في إسناد الدور')
      }
    } catch (error) {
      console.error('خطأ في إسناد الدور:', error)
      alert('حدث خطأ في إسناد الدور')
    } finally {
      setIsLoading(false)
    }
  }

  // فلترة أعضاء الفريق
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = selectedGroup === 'الكل' || member.group === selectedGroup
    const matchesRole = selectedRole === 'الكل' || member.role === selectedRole
    const matchesStatus = selectedStatus === 'الكل' || member.status === selectedStatus
    
    return matchesSearch && matchesGroup && matchesRole && matchesStatus
  })

  // إحصائيات الفريق
  const teamStats = {
    totalMembers: teamMembers.length,
    activeMembers: teamMembers.filter(m => m.status === 'نشط').length,
    avgApprovalRate: teamMembers.reduce((sum, m) => sum + m.performance.approvalRate, 0) / teamMembers.length,
    totalArticles: teamMembers.reduce((sum, m) => sum + m.performance.articlesPublished, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'نشط': return 'bg-green-100 text-green-800'
      case 'غائب': return 'bg-yellow-100 text-yellow-800'
      case 'موقوف': return 'bg-red-100 text-red-800'
      case 'تحت التدريب': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 85) return 'text-blue-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'publish': return <FileText className="w-3 h-3" />
      case 'edit': return <Edit3 className="w-3 h-3" />
      case 'comment': return <Users className="w-3 h-3" />
      case 'ai': return <Zap className="w-3 h-3" />
      case 'login': return <Activity className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  return (
    <div className='p-6 space-y-6' dir='rtl'>
      {/* رسالة النجاح */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700 font-medium">تم إسناد الدور بنجاح!</span>
          </div>
        </div>
      )}

      {/* العنوان والإحصائيات */}
      <div className='flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>إدارة الفريق</h1>
          <p className='text-gray-600'>إدارة شاملة للفريق التحريري والإداري في صحيفة سبق</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className='w-4 h-4' />
            الفلاتر
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
          >
            <UserPlus className='w-4 h-4' />
            إضافة عضو جديد
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-lg border p-4 shadow-sm'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm text-gray-600'>إجمالي الأعضاء</p>
              <p className='text-2xl font-bold text-blue-600'>{teamStats.totalMembers}</p>
            </div>
            <Users className='w-8 h-8 text-blue-500' />
          </div>
        </div>
        
        <div className='bg-white rounded-lg border p-4 shadow-sm'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm text-gray-600'>الأعضاء النشطين</p>
              <p className='text-2xl font-bold text-green-600'>{teamStats.activeMembers}</p>
            </div>
            <UserCheck className='w-8 h-8 text-green-500' />
          </div>
        </div>
        
        <div className='bg-white rounded-lg border p-4 shadow-sm'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm text-gray-600'>معدل الاعتماد</p>
              <p className='text-2xl font-bold text-purple-600'>{teamStats.avgApprovalRate.toFixed(1)}%</p>
            </div>
            <Award className='w-8 h-8 text-purple-500' />
          </div>
        </div>
        
        <div className='bg-white rounded-lg border p-4 shadow-sm'>
          <div className='flex justify-between items-center'>
            <div>
              <p className='text-sm text-gray-600'>إجمالي المقالات</p>
              <p className='text-2xl font-bold text-orange-600'>{teamStats.totalArticles}</p>
            </div>
            <FileText className='w-8 h-8 text-orange-500' />
          </div>
        </div>
      </div>

      {/* البحث والفلاتر */}
      <div className="bg-white rounded-lg border p-4 shadow-sm space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedGroup('الكل')
              setSelectedRole('الكل')
              setSelectedStatus('الكل')
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تعيين
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المجموعة</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="الكل">جميع المجموعات</option>
                {groups.map(group => (
                  <option key={group.id} value={group.name}>{group.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="الكل">جميع الأدوار</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="الكل">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="غائب">غائب</option>
                <option value="موقوف">موقوف</option>
                <option value="تحت التدريب">تحت التدريب</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* جدول أعضاء الفريق */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            أعضاء الفريق ({filteredMembers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العضو</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدور والمجموعة</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المقالات</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">معدل الاعتماد</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">استخدام AI</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">آخر نشاط</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  {/* معلومات العضو */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          member.status === 'نشط' ? 'bg-green-500' : 
                          member.status === 'غائب' ? 'bg-yellow-500' : 
                          member.status === 'موقوف' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {member.location}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* الدور والمجموعة */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{member.role}</p>
                      <p className="text-sm text-gray-500">{member.group}</p>
                    </div>
                  </td>

                  {/* الحالة */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>

                  {/* المقالات */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">{member.performance.articlesPublished}</div>
                    <div className="text-xs text-gray-500">منشور</div>
                  </td>

                  {/* معدل الاعتماد */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className={`text-sm font-medium ${getPerformanceColor(member.performance.approvalRate)}`}>
                      {member.performance.approvalRate}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.performance.articlesApproved}/{member.performance.articlesApproved + member.performance.articlesRejected}
                    </div>
                  </td>

                  {/* استخدام AI */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-purple-600">{member.performance.aiUsage}%</div>
                    <div className="text-xs text-gray-500">استخدام</div>
                  </td>

                  {/* آخر نشاط */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{member.lastActive}</div>
                    <div className="text-xs text-gray-500">آخر دخول</div>
                  </td>

                  {/* الإجراءات */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member)
                          setShowMemberModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض الملف الكامل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedMember(member)
                          setShowEditModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="تعديل المعلومات"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف ${member.name}؟`)) {
                            setTeamMembers(teamMembers.filter(m => m.id !== member.id))
                            alert(`تم حذف ${member.name} بنجاح`)
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف العضو"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد أعضاء</h3>
              <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عضو جديد للفريق</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="ml-2 h-4 w-4" />
                  إضافة عضو جديد
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة عرض الملف الكامل */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">الملف الكامل - {selectedMember.name}</h3>
              <button 
                onClick={() => setShowMemberModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* المعلومات الأساسية */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">المعلومات الأساسية</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>الاسم:</strong> {selectedMember.name}</p>
                    <p><strong>البريد:</strong> {selectedMember.email}</p>
                    <p><strong>الدور:</strong> {selectedMember.role}</p>
                    <p><strong>المجموعة:</strong> {selectedMember.group}</p>
                    <p><strong>الموقع:</strong> {selectedMember.location}</p>
                    <p><strong>تاريخ الانضمام:</strong> {selectedMember.joinDate}</p>
                    <p><strong>آخر نشاط:</strong> {selectedMember.lastActive}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">الحالة</h4>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedMember.status)}`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>

              {/* مؤشرات الأداء */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">مؤشرات الأداء</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">المقالات المنشورة</span>
                      <span className="font-semibold">{selectedMember.performance.articlesPublished}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">المقالات المعتمدة</span>
                      <span className="font-semibold text-green-600">{selectedMember.performance.articlesApproved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">المقالات المرفوضة</span>
                      <span className="font-semibold text-red-600">{selectedMember.performance.articlesRejected}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">معدل الاعتماد</span>
                      <span className={`font-semibold ${getPerformanceColor(selectedMember.performance.approvalRate)}`}>
                        {selectedMember.performance.approvalRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">استخدام AI</span>
                      <span className="font-semibold text-purple-600">{selectedMember.performance.aiUsage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">متوسط وقت الاستجابة</span>
                      <span className="font-semibold">{selectedMember.performance.avgResponseTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* النشاط الأخير */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">النشاط الأخير</h4>
                  <div className="space-y-3">
                    {selectedMember.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-white rounded">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-sm text-gray-500 truncate">{activity.target}</p>
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setShowMemberModal(false)
                  setShowEditModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit3 className="w-4 h-4" />
                تعديل المعلومات
              </button>
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة عضو جديد */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">إضافة عضو للفريق</h2>
            
            {!selectedUser ? (
              // مرحلة البحث
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البحث عن مستخدم (الاسم أو البريد الإلكتروني)
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابدأ الكتابة للبحث..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* نتائج البحث */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="mt-2 p-3 text-center text-gray-500">
                    <p>لا توجد نتائج</p>
                    <a 
                      href="/dashboard/users/create" 
                      className="text-blue-600 hover:underline text-sm"
                    >
                      إنشاء مستخدم جديد
                    </a>
                  </div>
                )}
              </div>
            ) : (
              // مرحلة إسناد الدور
              <div>
                {/* المستخدم المختار */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-sm text-blue-600 hover:underline mt-2"
                  >
                    تغيير المستخدم
                  </button>
                </div>

                {/* اختيار الدور */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الدور الوظيفي
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر الدور</option>
                    {AVAILABLE_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* اختيار المجموعة */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المجموعة/القسم
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">اختر المجموعة</option>
                    {AVAILABLE_GROUPS.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* أزرار التحكم */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchQuery('')
                  setSelectedUser(null)
                  setSelectedRole('')
                  setSelectedGroup('')
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              {selectedUser && (
                <button
                  onClick={handleAssignRole}
                  disabled={!selectedRole || !selectedGroup || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'جاري الإسناد...' : 'إسناد الدور'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل العضو */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">تعديل معلومات العضو - {selectedMember.name}</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* المعلومات الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    defaultValue={selectedMember.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    defaultValue={selectedMember.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                  <select 
                    defaultValue={selectedMember.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المجموعة</label>
                  <select 
                    defaultValue={selectedMember.group}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {groups.map(group => (
                      <option key={group.id} value={group.name}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select 
                    defaultValue={selectedMember.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="نشط">نشط</option>
                    <option value="غائب">غائب</option>
                    <option value="موقوف">موقوف مؤقتاً</option>
                    <option value="تحت التدريب">تحت التدريب</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
                  <input
                    type="text"
                    defaultValue={selectedMember.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* إجراءات سريعة */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">إجراءات سريعة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      alert(`تم تغيير دور ${selectedMember.name} إلى دور جديد`)
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    تغيير الدور
                  </button>
                  
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => {
                      alert(`تم نقل ${selectedMember.name} إلى مجموعة جديدة`)
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    نقل المجموعة
                  </button>
                  
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من تعليق حساب ${selectedMember.name} مؤقتاً؟`)) {
                        alert(`تم تعليق حساب ${selectedMember.name} مؤقتاً`)
                      }
                    }}
                  >
                    <UserMinus className="w-4 h-4" />
                    تعليق مؤقت
                  </button>
                  
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    onClick={() => {
                      alert(`تم إرسال رسالة تذكير إلى ${selectedMember.name}`)
                    }}
                  >
                    <Activity className="w-4 h-4" />
                    إرسال تذكير
                  </button>
                </div>
              </div>

              {/* تحليل الأداء */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">تحليل الأداء</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">التقييم الحالي</p>
                    <div className={`text-2xl font-bold ${getPerformanceColor(selectedMember.performance.approvalRate)}`}>
                      {selectedMember.performance.approvalRate >= 95 ? 'ممتاز' :
                       selectedMember.performance.approvalRate >= 85 ? 'جيد جداً' :
                       selectedMember.performance.approvalRate >= 75 ? 'جيد' : 'يحتاج تحسين'}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">الإنتاجية</p>
                    <div className={`text-2xl font-bold ${
                      selectedMember.performance.articlesPublished >= 100 ? 'text-green-600' :
                      selectedMember.performance.articlesPublished >= 50 ? 'text-blue-600' :
                      selectedMember.performance.articlesPublished >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedMember.performance.articlesPublished >= 100 ? 'عالية' :
                       selectedMember.performance.articlesPublished >= 50 ? 'متوسطة' :
                       selectedMember.performance.articlesPublished >= 20 ? 'منخفضة' : 'ضعيفة'}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">استخدام AI</p>
                    <div className={`text-2xl font-bold ${
                      selectedMember.performance.aiUsage >= 80 ? 'text-purple-600' :
                      selectedMember.performance.aiUsage >= 50 ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {selectedMember.performance.aiUsage >= 80 ? 'متقدم' :
                       selectedMember.performance.aiUsage >= 50 ? 'متوسط' : 'محدود'}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">سرعة الاستجابة</p>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedMember.performance.avgResponseTime.includes('دقيقة') ? 'سريع' :
                       selectedMember.performance.avgResponseTime.includes('1') ? 'جيد' : 'بطيء'}
                    </div>
                  </div>
                </div>
              </div>

              {/* آخر الأنشطة */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">آخر الأنشطة (أحدث 3)</h4>
                <div className="space-y-2">
                  {selectedMember.recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <div className="p-1 bg-gray-100 rounded">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.target} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  alert(`تم حفظ التغييرات لـ ${selectedMember.name}`)
                  setShowEditModal(false)
                }}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف ${selectedMember.name} نهائياً؟`)) {
                    setTeamMembers(teamMembers.filter(m => m.id !== selectedMember.id))
                    setShowEditModal(false)
                    alert(`تم حذف ${selectedMember.name} من النظام`)
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-auto"
              >
                <Trash2 className="w-4 h-4" />
                حذف العضو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
