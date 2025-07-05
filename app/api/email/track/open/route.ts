import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// بكسل شفاف 1x1
const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logId = searchParams.get('id');

    if (!logId) {
      return new NextResponse(TRANSPARENT_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // تحديث سجل البريد
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: 'opened',
        openedAt: new Date(),
      },
    }).catch(err => {
      console.error('Error updating email log:', err);
    });

    // إرجاع البكسل الشفاف
    return new NextResponse(TRANSPARENT_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    
    // إرجاع البكسل حتى في حالة الخطأ
    return new NextResponse(TRANSPARENT_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
} 