import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// توليد بصمة الجهاز
function generateDeviceFingerprint(req: NextRequest): string {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  const xForwardedFor = req.headers.get('x-forwarded-for') || '';
  
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${xForwardedFor}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
}

// بدء جلسة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    const deviceFingerprint = generateDeviceFingerprint(request);
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // إنهاء أي جلسات مفتوحة لنفس الجهاز
    const openSessions = await prisma.session.findMany({
      where: {
        deviceFingerprint,
        endedAt: null
      }
    });
    
    for (const openSession of openSessions) {
      const duration = Math.floor((new Date().getTime() - openSession.startedAt.getTime()) / 1000);
      await prisma.session.update({
        where: { id: openSession.id },
        data: {
          endedAt: new Date(),
          duration
        }
      });
    }
    
    // إنشاء جلسة جديدة
    const session = await prisma.session.create({
      data: {
        userId: userId || null,
        deviceFingerprint,
        ipAddress,
        userAgent: request.headers.get('user-agent') || null,
        referrer: request.headers.get('referer') || null,
        metadata: {
          viewport: body.viewport,
          screenResolution: body.screenResolution,
          timezone: body.timezone,
          language: body.language
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      deviceFingerprint
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// إنهاء جلسة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    if (session.endedAt) {
      return NextResponse.json({
        success: true,
        message: 'Session already ended'
      });
    }
    
    // حساب المدة بالثواني
    const duration = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);
    
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        duration
      }
    });
    
    return NextResponse.json({
      success: true,
      session: updatedSession
    });
    
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

// جلب معلومات الجلسة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          impressions: {
            include: {
              article: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              }
            }
          }
        }
      });
      
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        session
      });
    }
    
    if (userId) {
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          impressions: {
            select: {
              id: true,
              articleId: true,
              durationSeconds: true,
              scrollDepth: true
            }
          }
        }
      });
      
      return NextResponse.json({
        success: true,
        sessions
      });
    }
    
    return NextResponse.json(
      { error: 'Session ID or User ID is required' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
} 