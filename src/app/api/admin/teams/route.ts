import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/teams
 * جلب قائمة الفرق والمجموعات (تجريبي)
 */
export async function GET(request: NextRequest) {
  try {
    // بيانات تجريبية للفرق
    const mockTeams = [
      {
        id: '1',
        name: 'editorial_team',
        name_ar: 'فريق التحرير',
        description: 'فريق تحرير المحتوى الإخباري',
        description_ar: 'فريق تحرير المحتوى الإخباري',
        color: '#059669',
        icon: '📝',
        type: 'editorial',
        is_active: true,
        member_count: 5,
        roles: [
          { id: '2', name: 'editor', name_ar: 'محرر' },
          { id: '3', name: 'author', name_ar: 'كاتب' }
        ]
      },
      {
        id: '2',
        name: 'moderation_team',
        name_ar: 'فريق الإشراف',
        description: 'فريق إشراف المحتوى والتعليقات',
        description_ar: 'فريق إشراف المحتوى والتعليقات',
        color: '#EA580C',
        icon: '🛡️',
        type: 'moderation',
        is_active: true,
        member_count: 3,
        roles: [
          { id: '4', name: 'moderator', name_ar: 'مراقب' }
        ]
      },
      {
        id: '3',
        name: 'analytics_team',
        name_ar: 'فريق التحليلات',
        description: 'فريق تحليل البيانات والإحصائيات',
        description_ar: 'فريق تحليل البيانات والإحصائيات',
        color: '#9333EA',
        icon: '📊',
        type: 'analytics',
        is_active: true,
        member_count: 2,
        roles: [
          { id: '5', name: 'analyst', name_ar: 'محلل' }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        teams: mockTeams,
        stats: {
          total: mockTeams.length,
          active: mockTeams.filter(t => t.is_active).length,
          inactive: mockTeams.filter(t => !t.is_active).length,
          total_members: mockTeams.reduce((sum, t) => sum + t.member_count, 0),
          by_type: mockTeams.reduce((types: any, team) => {
            types[team.type] = (types[team.type] || 0) + 1;
            return types;
          }, {})
        }
      },
      message: 'تم جلب الفرق بنجاح'
    });

  } catch (error) {
    console.error('خطأ في جلب الفرق:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الفرق' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/teams
 * إنشاء فريق جديد (تجريبي)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // محاكاة إنشاء فريق جديد
    const newTeam = {
      id: Date.now().toString(),
      name: body.name || 'new_team',
      name_ar: body.name_ar || 'فريق جديد',
      description: body.description || '',
      description_ar: body.description_ar || '',
      color: body.color || '#3B82F6',
      icon: body.icon || '👥',
      type: body.type || 'department',
      is_active: true,
      member_count: 0,
      roles: body.role_ids ? body.role_ids.map((id: string) => ({ 
        id, 
        name: `role_${id}`, 
        name_ar: `دور_${id}` 
      })) : []
    };

    return NextResponse.json({
      success: true,
      data: { team: newTeam },
      message: 'تم إنشاء الفريق بنجاح',
    }, { status: 201 });

  } catch (error) {
    console.error('خطأ في إنشاء الفريق:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الفريق' },
      { status: 500 }
    );
  }
} 