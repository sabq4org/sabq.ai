import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/activities - الحصول على سجل النشاطات
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission('system.logs.view');
    
    // معالجة معاملات الاستعلام
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const targetType = searchParams.get('target_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // هنا نرجع بيانات تجريبية
    const activities = [
      {
        id: 1,
        user: {
          id: '1',
          name: 'أحمد الشمري',
          email: 'editor@sabq.org',
          avatar_url: null
        },
        action: 'CREATE_ARTICLE',
        target_type: 'article',
        target_id: '123',
        target_title: 'رؤية 2030 تحقق إنجازات جديدة في قطاع التقنية',
        metadata: {
          section: 'تقنية',
          category: 'أخبار محلية'
        },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        user: {
          id: '2',
          name: 'فاطمة العتيبي',
          email: 'deputy@sabq.org',
          avatar_url: null
        },
        action: 'PUBLISH_ARTICLE',
        target_type: 'article',
        target_id: '123',
        target_title: 'رؤية 2030 تحقق إنجازات جديدة في قطاع التقنية',
        metadata: {
          scheduled: false
        },
        ip_address: '192.168.1.2',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        user: {
          id: '3',
          name: 'خالد القحطاني',
          email: 'writer1@sabq.org',
          avatar_url: null
        },
        action: 'UPDATE_USER',
        target_type: 'user',
        target_id: '5',
        target_title: 'نورة الحربي',
        metadata: {
          changes: ['phone', 'bio']
        },
        ip_address: '192.168.1.3',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        user: {
          id: '1',
          name: 'أحمد الشمري',
          email: 'editor@sabq.org',
          avatar_url: null
        },
        action: 'SUSPEND_USER',
        target_type: 'user',
        target_id: '8',
        target_title: 'متعاون خارجي',
        metadata: {
          reason: 'مخالفة سياسات النشر'
        },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        user: {
          id: '4',
          name: 'عبدالله الدوسري',
          email: 'sports_editor@sabq.org',
          avatar_url: null
        },
        action: 'DELETE_ARTICLE',
        target_type: 'article',
        target_id: '456',
        target_title: 'خبر رياضي قديم',
        metadata: {
          reason: 'محتوى مكرر'
        },
        ip_address: '192.168.1.4',
        user_agent: 'Mozilla/5.0',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ];
    
    // فلترة النتائج حسب المعاملات
    let filteredActivities = [...activities];
    
    if (userId) {
      filteredActivities = filteredActivities.filter(a => a.user.id === userId);
    }
    
    if (action) {
      filteredActivities = filteredActivities.filter(a => a.action === action);
    }
    
    if (targetType) {
      filteredActivities = filteredActivities.filter(a => a.target_type === targetType);
    }
    
    // حساب الصفحات
    const total = filteredActivities.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedActivities = filteredActivities.slice(start, end);
    
    return NextResponse.json({
      success: true,
      data: paginatedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 403 }
    );
  }
}

// أنواع الإجراءات المتاحة (محلية - لا يتم تصديرها)
const ACTIVITY_ACTIONS = {
  // إجراءات المقالات
  CREATE_ARTICLE: 'إنشاء مقال',
  UPDATE_ARTICLE: 'تحديث مقال',
  DELETE_ARTICLE: 'حذف مقال',
  PUBLISH_ARTICLE: 'نشر مقال',
  ARCHIVE_ARTICLE: 'أرشفة مقال',
  PIN_ARTICLE: 'تثبيت مقال',
  FEATURE_ARTICLE: 'إبراز مقال',
  
  // إجراءات المستخدمين
  CREATE_USER: 'إنشاء مستخدم',
  UPDATE_USER: 'تحديث مستخدم',
  DELETE_USER: 'حذف مستخدم',
  SUSPEND_USER: 'تعليق مستخدم',
  ACTIVATE_USER: 'تفعيل مستخدم',
  INVITE_USER: 'دعوة مستخدم',
  
  // إجراءات الأدوار
  CREATE_ROLE: 'إنشاء دور',
  UPDATE_ROLE: 'تحديث دور',
  DELETE_ROLE: 'حذف دور',
  
  // إجراءات التصنيفات
  CREATE_CATEGORY: 'إنشاء تصنيف',
  UPDATE_CATEGORY: 'تحديث تصنيف',
  DELETE_CATEGORY: 'حذف تصنيف',
  
  // إجراءات النظام
  UPDATE_SETTINGS: 'تحديث الإعدادات',
  SEND_NOTIFICATION: 'إرسال إشعار',
  LOGIN: 'تسجيل دخول',
  LOGOUT: 'تسجيل خروج'
}; 