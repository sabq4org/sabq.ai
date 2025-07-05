import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logId = searchParams.get('id');
    const targetUrl = searchParams.get('url');

    if (!logId || !targetUrl) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // تحديث سجل البريد
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'clicked',
        clickedAt: new Date(),
        meta: {
          clickedUrl: targetUrl,
          clickedAt: new Date().toISOString()
        }
      },
    }).catch(err => {
      console.error('Error updating email log:', err);
    });

    // إعادة التوجيه إلى الرابط الأصلي
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('Error tracking email click:', error);
    
    // في حالة الخطأ، إعادة التوجيه إلى الصفحة الرئيسية
    return NextResponse.redirect(new URL('/', request.url));
  }
} 