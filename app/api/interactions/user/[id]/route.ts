import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id: userId } = context.params;
    
    // جلب التفاعلات من قاعدة البيانات
    const interactions = await prisma.interactions.findMany({
      where: { user_id: userId },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            featured_image: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });
    
    // حساب الإحصائيات
    const stats = {
      articlesRead: interactions.filter((i: any) => 
        i.type === 'view'
      ).length,
      interactions: interactions.filter((i: any) => 
        ['like', 'comment', 'save'].includes(i.type)
      ).length,
      shares: interactions.filter((i: any) => 
        i.type === 'share'
      ).length
    };
    
    return NextResponse.json({
      success: true,
      interactions: interactions,
      stats: stats,
      totalInteractions: interactions.length
    });
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user interactions' },
      { status: 500 }
    );
  }
} 