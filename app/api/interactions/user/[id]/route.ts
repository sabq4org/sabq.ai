import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    
    // جلب التفاعلات من قاعدة البيانات - مبسط
    const interactions = await prisma.interactions.findMany({
      where: { user_id: userId },
      // include: { article: { ... } }, // معطل مؤقتاً
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