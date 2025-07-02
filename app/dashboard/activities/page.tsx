'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Search, 
  Download,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  Settings,
  FileText,
  Calendar,
  Shield,
  Database,
  RefreshCw
} from 'lucide-react'
import { TabsEnhanced } from '@/components/ui/tabs-enhanced'
import { useDarkModeContext } from '@/contexts/DarkModeContext'

interface ActivityItem {
  id: string;
  user: string;
  email: string;
  action: string;
  target: string;
  time: string;
  type: string;
  category: string;
  severity?: 'info' | 'warning' | 'critical';
  created_at: string;
}

interface ActivityStats {
  total: number;
  published: number;
  activeUsers: number;
  edits: number;
}

interface CategoriesStats {
  articles: number;
  users: number;
  media: number;
  settings: number;
}

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { darkMode } = useDarkModeContext()
  const [activeTab, setActiveTab] = useState('all')
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    published: 0,
    activeUsers: 0,
    edits: 0
  })
  const [categoriesStats, setCategoriesStats] = useState<CategoriesStats>({
    articles: 0,
    users: 0,
    media: 0,
    settings: 0
  })
  
  // جلب البيانات من API
  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/activities')
      const data = await response.json()
      
      if (data.success) {
        const responseData = data.data || data;
        setActivities(responseData.activities || [])
        setStats(responseData.stats || {
          total: 0,
          published: 0,
          activeUsers: 0,
          edits: 0
        })
        setCategoriesStats(responseData.categoriesStats || {
          articles: 0,
          users: 0,
          media: 0,
          settings: 0
        })
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
    
    // تحديث تلقائي كل دقيقة
    const interval = setInterval(fetchActivities, 60000)
    return () => clearInterval(interval)
  }, [])
  
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.target.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === '' || activity.type === filterType
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'articles' && activity.category === 'مقالات') ||
      (activeTab === 'users' && activity.category === 'مستخدمين') ||
      (activeTab === 'media' && activity.category === 'وسائط')
    
    return matchesSearch && matchesType && matchesTab
  })

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'publish': return <FileText className='w-4 h-4' />
      case 'edit': 
      case 'update': return <Edit className='w-4 h-4' />
      case 'user_add': 
      case 'create': return <UserPlus className='w-4 h-4' />
      case 'review': 
      case 'approve': return <Eye className='w-4 h-4' />
      case 'upload': return <Download className='w-4 h-4' />
      case 'delete': return <Trash2 className='w-4 h-4' />
      case 'settings_update': return <Settings className='w-4 h-4' />
      case 'login': 
      case 'logout': return <Shield className='w-4 h-4' />
      default: return <Activity className='w-4 h-4' />
    }
  }

  const getSeverityBadge = (severity: string = 'info') => {
    const styles = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      critical: 'bg-red-100 text-red-700'
    };
    return styles[severity as keyof typeof styles] || styles.info;
  }

  // مكون بطاقة الإحصائية
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
    <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300 hover:shadow-md ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm mb-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{value}</span>
            <span className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const exportToCSV = () => {
    const headers = ['المستخدم', 'البريد الإلكتروني', 'النشاط', 'الهدف', 'الفئة', 'الخطورة', 'الوقت']
    const csvContent = [
      headers.join(','),
      ...filteredActivities.map(activity => [
        activity.user,
        activity.email,
        activity.action,
        activity.target,
        activity.category,
        activity.severity || 'info',
        activity.time
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `activities_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={`p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : ''
    }`} dir='rtl'>
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>سجل النشاطات</h1>
        <p className={`transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>مراقبة وتتبع جميع أنشطة النظام والمستخدمين</p>
      </div>

      {/* قسم نظام المراقبة */}
      <div className="mb-8">
        <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-green-900/30 to-teal-900/30 border-green-700' 
            : 'bg-gradient-to-r from-green-50 to-teal-50 border-green-100'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام مراقبة النشاطات</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>تتبع فوري لجميع العمليات والأنشطة في النظام</p>
            </div>
            <div className="mr-auto">
              <button
                onClick={fetchActivities}
                className={`p-2 rounded-lg shadow-sm transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="النشاطات اليوم"
          value={stats.total}
          subtitle="نشاط"
          icon={Activity}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="المقالات المنشورة"
          value={stats.published}
          subtitle="مقال"
          icon={FileText}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="المستخدمين النشطين"
          value={stats.activeUsers}
          subtitle="مستخدم"
          icon={UserPlus}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="التعديلات"
          value={stats.edits}
          subtitle="تعديل"
          icon={Edit}
          bgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* أزرار التنقل */}
      <TabsEnhanced
        tabs={[
          { id: 'all', name: 'جميع النشاطات', icon: Database, count: activities.length },
          { id: 'articles', name: 'المقالات', icon: FileText, count: categoriesStats.articles },
          { id: 'users', name: 'المستخدمين', icon: UserPlus, count: categoriesStats.users },
          { id: 'media', name: 'الوسائط', icon: Download, count: categoriesStats.media }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* أدوات الفلترة والتصدير */}
      <div className={`rounded-2xl p-6 shadow-sm border mb-8 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="البحث في النشاطات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          >
            <option value="">جميع الأنواع</option>
            <option value="publish">نشر</option>
            <option value="edit">تعديل</option>
            <option value="update">تحديث</option>
            <option value="create">إنشاء</option>
            <option value="delete">حذف</option>
            <option value="user_add">إضافة مستخدم</option>
            <option value="review">مراجعة</option>
            <option value="upload">رفع ملف</option>
            <option value="login">تسجيل دخول</option>
            <option value="logout">تسجيل خروج</option>
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* جدول النشاطات */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden transition-colors duration-300`}>
        <div className="px-6 py-4" style={{ borderBottom: darkMode ? '1px solid #374151' : '1px solid #f4f8fe' }}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
            <Activity className="w-5 h-5 text-green-600" />
            سجل النشاطات الأخيرة ({filteredActivities.length})
          </h3>
        </div>
        
        {/* رأس الجدول */}
        <div 
          style={{ 
            backgroundColor: darkMode ? '#1e3a5f' : '#f0fdff',
            borderBottom: darkMode ? '2px solid #2563eb' : '2px solid #dde9fc'
          }}
        >
          <div className="grid grid-cols-6 gap-4 px-6 py-4">
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>المستخدم</div>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>النشاط</div>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>الهدف</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>الفئة</div>
            <div className={`text-sm font-medium text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>الخطورة</div>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>الوقت</div>
          </div>
        </div>

        {/* بيانات الجدول */}
        <div style={{ borderColor: darkMode ? '#374151' : '#f4f8fe' }} className="divide-y">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  جارٍ تحميل النشاطات...
                </p>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activities.length === 0 ? 'لا توجد نشاطات مسجلة بعد' : 'لا توجد نشاطات متطابقة مع معايير البحث'}
              </p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div 
                key={activity.id} 
                className={`grid grid-cols-6 gap-4 px-6 py-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'} transition-colors duration-300`}
                style={{ borderBottom: index < filteredActivities.length - 1 ? (darkMode ? '1px solid #374151' : '1px solid #f4f8fe') : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {activity.user.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activity.user}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activity.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getActionIcon(activity.type)}
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{activity.action}</span>
                </div>
                
                <div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{activity.target}</span>
                </div>
                
                <div className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.category === 'مقالات' ? 'bg-blue-100 text-blue-700' :
                    activity.category === 'مستخدمين' ? 'bg-purple-100 text-purple-700' :
                    activity.category === 'وسائط' ? 'bg-teal-100 text-teal-700' :
                    activity.category === 'إعدادات' ? 'bg-gray-100 text-gray-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {activity.category}
                  </span>
                </div>
                
                <div className="text-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadge(activity.severity)}`}>
                    {activity.severity === 'info' ? 'معلومات' : activity.severity === 'warning' ? 'تحذير' : 'حرج'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className={`w-3 h-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activity.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
