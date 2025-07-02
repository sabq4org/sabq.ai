import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await props.params;
    
    // جلب التفاعلات من قاعدة البيانات
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // حساب الإحصائيات
    const stats = {
      articlesRead: interactions.filter(i => 
        i.type === 'read' || i.type === 'view'
      ).length,
      interactions: interactions.filter(i => 
        ['like', 'comment', 'save', 'bookmark'].includes(i.type)
      ).length,
      shares: interactions.filter(i => 
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