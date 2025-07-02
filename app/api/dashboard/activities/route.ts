import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const LOGS_FILE = path.join(process.cwd(), 'data', 'admin_activity_logs.json');

interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  email: string;
  role: string;
  action_type: string;
  details: string;
  target_id?: string;
  target_type?: string;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  severity: 'info' | 'warning' | 'critical';
}

export async function GET(request: NextRequest) {
  try {
    // قراءة السجلات من الملف
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    const logsData = JSON.parse(data);
    const activities: Activity[] = logsData.logs || [];

    // حساب الإحصائيات
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = activities.filter((activity: Activity) => 
      new Date(activity.created_at) >= today
    );

    const publishedCount = activities.filter((activity: Activity) => 
      activity.action_type === 'publish'
    ).length;

    const activeUsers = new Set(activities.map((activity: Activity) => activity.user_id)).size;

    const editsCount = activities.filter((activity: Activity) => 
      activity.action_type === 'update' || activity.action_type === 'edit'
    ).length;

    // تحويل البيانات لتتناسب مع واجهة المستخدم
    const formattedActivities = activities.map((activity: Activity) => {
      // تحديد نوع النشاط
      let type = activity.action_type;
      let category = 'عام';
      
      if (activity.target_type === 'article' || activity.target_type === 'news') {
        category = 'مقالات';
      } else if (activity.target_type === 'user') {
        category = 'مستخدمين';
      } else if (activity.target_type === 'media' || activity.action_type === 'upload') {
        category = 'وسائط';
      } else if (activity.target_type === 'settings') {
        category = 'إعدادات';
      }

      // تحويل action_type إلى نص عربي
      const actionTextMap: { [key: string]: string } = {
        'login': 'تسجيل دخول',
        'logout': 'تسجيل خروج',
        'create': 'إنشاء',
        'update': 'تحديث',
        'edit': 'تعديل',
        'delete': 'حذف',
        'publish': 'نشر',
        'unpublish': 'إلغاء نشر',
        'upload': 'رفع ملف',
        'download': 'تحميل',
        'export': 'تصدير',
        'import': 'استيراد',
        'approve': 'موافقة',
        'reject': 'رفض',
        'review': 'مراجعة',
        'role_change': 'تغيير صلاحية',
        'settings_update': 'تحديث إعدادات',
        'user_add': 'إضافة مستخدم'
      };
      
      const actionText = actionTextMap[activity.action_type] || activity.action_type;

      // حساب الوقت النسبي
      const timeAgo = getTimeAgo(new Date(activity.created_at));

      return {
        id: activity.id,
        user: activity.user_name || 'مستخدم غير معروف',
        email: activity.email,
        action: actionText,
        target: activity.details || activity.target_id || '-',
        time: timeAgo,
        type: type,
        category: category,
        severity: activity.severity || 'info',
        created_at: activity.created_at
      };
    });

    // ترتيب حسب الأحدث
    formattedActivities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // أخذ آخر 100 نشاط فقط
    const recentActivities = formattedActivities.slice(0, 100);

    // إحصائيات حسب الفئات
    const categoriesStats = {
      articles: recentActivities.filter(a => a.category === 'مقالات').length,
      users: recentActivities.filter(a => a.category === 'مستخدمين').length,
      media: recentActivities.filter(a => a.category === 'وسائط').length,
      settings: recentActivities.filter(a => a.category === 'إعدادات').length
    };

    return NextResponse.json({
      success: true,
      data: {
        activities: recentActivities,
        stats: {
          total: todayActivities.length,
          published: publishedCount,
          activeUsers: activeUsers,
          edits: editsCount
        },
        categoriesStats
      }
    });

  } catch (error) {
    console.error('Error in activities API:', error);
    
    // إذا كان الملف غير موجود، أنشئ ملف فارغ
    if ((error as any).code === 'ENOENT') {
      const dir = path.dirname(LOGS_FILE);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(LOGS_FILE, JSON.stringify({ logs: [] }, null, 2));
      
      return NextResponse.json({
        success: true,
        data: {
          activities: [],
          stats: {
            total: 0,
            published: 0,
            activeUsers: 0,
            edits: 0
          },
          categoriesStats: {
            articles: 0,
            users: 0,
            media: 0,
            settings: 0
          }
        }
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// دالة لحساب الوقت النسبي
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'منذ لحظات';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتين' : minutes <= 10 ? 'دقائق' : 'دقيقة'}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `منذ ${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : hours <= 10 ? 'ساعات' : 'ساعة'}`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `منذ ${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومين' : days <= 10 ? 'أيام' : 'يوم'}`;
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : weeks === 2 ? 'أسبوعين' : weeks <= 10 ? 'أسابيع' : 'أسبوع'}`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `منذ ${months} ${months === 1 ? 'شهر' : months === 2 ? 'شهرين' : months <= 10 ? 'أشهر' : 'شهر'}`;
  }
} 