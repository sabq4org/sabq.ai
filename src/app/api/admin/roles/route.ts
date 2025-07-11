import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/roles
 * جلب قائمة الأدوار (تجريبي)
 */
export async function GET(request: NextRequest) {
  try {
    // بيانات تجريبية للأدوار
    const mockRoles = [
      {
        id: '1',
        name: 'super_admin',
        name_ar: 'مدير عام',
        description: 'صلاحيات كاملة لإدارة النظام',
        description_ar: 'صلاحيات كاملة لإدارة النظام',
        color: '#DC2626',
        icon: '👑',
        is_system: true,
        is_active: true,
        sort_order: 1,
        user_count: 1,
        team_count: 0,
        permissions: [
          { id: '1', code: 'manage:users', name: 'إدارة المستخدمين' },
          { id: '2', code: 'create:articles', name: 'إنشاء مقالات' },
          { id: '3', code: 'moderate:comments', name: 'إشراف التعليقات' }
        ]
      },
      {
        id: '2',
        name: 'editor',
        name_ar: 'محرر',
        description: 'تحرير ونشر المقالات',
        description_ar: 'تحرير ونشر المقالات',
        color: '#0D9488',
        icon: '✏️',
        is_system: true,
        is_active: true,
        sort_order: 4,
        user_count: 1,
        team_count: 0,
        permissions: [
          { id: '2', code: 'create:articles', name: 'إنشاء مقالات' },
          { id: '3', code: 'moderate:comments', name: 'إشراف التعليقات' }
        ]
      },
      {
        id: '3',
        name: 'author',
        name_ar: 'كاتب',
        description: 'كتابة وتعديل المقالات الخاصة',
        description_ar: 'كتابة وتعديل المقالات الخاصة',
        color: '#0891B2',
        icon: '✍️',
        is_system: true,
        is_active: true,
        sort_order: 5,
        user_count: 1,
        team_count: 0,
        permissions: [
          { id: '2', code: 'create:articles', name: 'إنشاء مقالات' }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        roles: mockRoles,
        stats: {
          total: mockRoles.length,
          active: mockRoles.filter(r => r.is_active).length,
          inactive: mockRoles.filter(r => !r.is_active).length,
          system: mockRoles.filter(r => r.is_system).length,
          custom: mockRoles.filter(r => !r.is_system).length,
        }
      },
      message: 'تم جلب الأدوار بنجاح'
    });

  } catch (error) {
    console.error('خطأ في جلب الأدوار:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الأدوار' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * إنشاء دور جديد (تجريبي)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // محاكاة إنشاء دور جديد
    const newRole = {
      id: Date.now().toString(),
      name: body.name || 'new_role',
      name_ar: body.name_ar || 'دور جديد',
      description: body.description || '',
      description_ar: body.description_ar || '',
      color: body.color || '#6B7280',
      icon: body.icon || '🔑',
      is_system: false,
      is_active: true,
      sort_order: 10,
      user_count: 0,
      team_count: 0,
      permissions: []
    };

    return NextResponse.json({
      success: true,
      data: { role: newRole },
      message: 'تم إنشاء الدور بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('خطأ في إنشاء الدور:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الدور' },
      { status: 500 }
    );
  }
} 