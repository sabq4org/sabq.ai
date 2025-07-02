import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// قاعدة بيانات وهمية للمستخدمين المسجلين
const registeredUsers = [
  {
    id: 1,
    name: 'عبدالله الحربي',
    email: 'abdullah.harbi@sabq.org',
    phone: '+966501234567',
    joinDate: '2023-01-15',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 2,
    name: 'عبدالله الحازمي',
    email: 'abdullah.hazmi@sabq.org', 
    phone: '+966507654321',
    joinDate: '2023-02-20',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 3,
    name: 'نورا محمد الشهري',
    email: 'nora.shehri@sabq.org',
    phone: '+966512345678',
    joinDate: '2023-03-10',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 4,
    name: 'محمد علي القحطاني',
    email: 'mohammed.qahtani@sabq.org',
    phone: '+966523456789',
    joinDate: '2023-04-05',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 5,
    name: 'رحاب أحمد الدوسري',
    email: 'rehab.dosari@sabq.org',
    phone: '+966534567890',
    joinDate: '2023-05-12',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 6,
    name: 'خالد سعد الغامدي',
    email: 'khalid.ghamdi@sabq.org',
    phone: '+966545678901',
    joinDate: '2023-06-18',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 7,
    name: 'سلمى عبدالرحمن العتيبي',
    email: 'salma.otaibi@sabq.org',
    phone: '+966556789012',
    joinDate: '2023-07-22',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 8,
    name: 'يوسف فهد الزهراني',
    email: 'yousef.zahrani@sabq.org',
    phone: '+966567890123',
    joinDate: '2023-08-30',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 9,
    name: 'هدى صالح المطيري',
    email: 'huda.mutairi@sabq.org',
    phone: '+966578901234',
    joinDate: '2023-09-14',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  {
    id: 10,
    name: 'فيصل ناصر الشمري',
    email: 'faisal.shamri@sabq.org',
    phone: '+966589012345',
    joinDate: '2023-10-08',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: false
  },
  // المستخدمين الموجودين بالفعل في الفريق (للمرجع)
  {
    id: 11,
    name: 'أحمد محمد السالم',
    email: 'ahmed.salem@sabq.org',
    phone: '+966590123456',
    joinDate: '2023-01-15',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: true // موجود بالفعل في الفريق
  },
  {
    id: 12,
    name: 'فاطمة عبدالله النور',
    email: 'fatima.noor@sabq.org',
    phone: '+966501234568',
    joinDate: '2023-03-22',
    status: 'active',
    avatar: '/api/placeholder/40/40',
    hasTeamRole: true
  }
]

export async function GET(request: NextRequest) {
  try {
    // الحصول على كلمة البحث من الاستعلام
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'يجب أن تكون كلمة البحث حرفين على الأقل',
        data: []
      })
    }

    // قراءة ملف المستخدمين
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    const fileContents = await fs.readFile(usersFilePath, 'utf8')
    const data = JSON.parse(fileContents)
    
    // التأكد من وجود مصفوفة المستخدمين
    const users = Array.isArray(data) ? data : (data.users || [])
    
    // البحث في المستخدمين
    const searchQuery = query.toLowerCase()
    const filteredUsers = users.filter((user: any) => {
      // البحث في الاسم والبريد الإلكتروني
      const nameMatch = user.name?.toLowerCase().includes(searchQuery)
      const emailMatch = user.email?.toLowerCase().includes(searchQuery)
      
      // استبعاد المستخدمين المحذوفين أو المعطلين
      const isActive = user.status === 'active' || !user.status
      
      return (nameMatch || emailMatch) && isActive
    })

    // تحديد الحقول المطلوبة فقط
    const results = filteredUsers.slice(0, 10).map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '/default-avatar.png',
      role: user.role || 'regular',
      isVerified: user.isVerified || false
    }))

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء البحث',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, role, group } = await request.json()
    const user = registeredUsers.find(u => u.id === parseInt(userId))
    
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }
    
    user.hasTeamRole = true
    
    return NextResponse.json({ 
      success: true,
      message: `تم إسناد دور "${role}" في "${group}" للمستخدم ${user.name}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        group: group,
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: 'منذ قليل',
        avatar: user.avatar
      }
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في إسناد الدور' }, { status: 500 })
  }
} 