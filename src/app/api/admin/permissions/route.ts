import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/permissions
 * جلب قائمة الصلاحيات (تجريبي)
 */
export async function GET(request: NextRequest) {
  try {
    // بيانات تجريبية للصلاحيات
    const mockPermissions = [
      {
        id: '1',
        code: 'manage:users',
        name: 'إدارة المستخدمين',
        name_ar: 'إدارة المستخدمين',
        category: 'users',
        resource: 'user',
        action: 'manage',
        is_dangerous: true,
        is_system: true,
        is_active: true
      },
      {
        id: '2',
        code: 'create:articles',
        name: 'إنشاء مقالات',
        name_ar: 'إنشاء مقالات',
        category: 'content',
        resource: 'article',
        action: 'create',
        is_dangerous: false,
        is_system: true,
        is_active: true
      },
      {
        id: '3',
        code: 'moderate:comments',
        name: 'إشراف التعليقات',
        name_ar: 'إشراف التعليقات',
        category: 'moderation',
        resource: 'comment',
        action: 'moderate',
        is_dangerous: false,
        is_system: true,
        is_active: true
      }
    ];

    // تجميع الصلاحيات حسب الفئة
    const groupedPermissions = mockPermissions.reduce((groups: any, permission: any) => {
      const category = permission.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
      return groups;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        permissions: mockPermissions,
        grouped: groupedPermissions,
        stats: {
          total: mockPermissions.length,
          by_category: Object.keys(groupedPermissions).map(cat => ({
            category: cat,
            count: groupedPermissions[cat].length
          }))
        }
      },
      message: 'تم جلب الصلاحيات بنجاح'
    });

  } catch (error) {
    console.error('خطأ في جلب الصلاحيات:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الصلاحيات' },
      { status: 500 }
    );
  }
} 