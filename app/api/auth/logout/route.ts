import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  JWTSecurity, 
  RequestSecurity
} from '../../../../lib/auth-security';

const prisma = new PrismaClient();

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Security context
    const securityContext = RequestSecurity.createSecurityContext(request);
    
    // Extract JWT token
    const authHeader = request.headers.get('authorization');
    const token = JWTSecurity.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'مطلوب رمز المصادقة' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = JWTSecurity.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'رمز المصادقة غير صالح' },
        { status: 401 }
      );
    }

    // Find and invalidate session
    const session = await prisma.session.findUnique({
      where: { session_token: token },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: session.id }
    });

    // Update user's last logout time
    await prisma.user.update({
      where: { id: session.user_id || '' },
      data: {
        updated_at: new Date()
      }
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
      timestamp: new Date().toISOString()
    });

    // Add security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'خطأ في تسجيل الخروج' },
      { status: 500 }
    );
  }
}

// Logout from all devices
export async function DELETE(request: NextRequest) {
  try {
    // Security context
    const securityContext = RequestSecurity.createSecurityContext(request);
    
    // Extract JWT token
    const authHeader = request.headers.get('authorization');
    const token = JWTSecurity.extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'مطلوب رمز المصادقة' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = JWTSecurity.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'رمز المصادقة غير صالح' },
        { status: 401 }
      );
    }

    // Find current session
    const session = await prisma.session.findUnique({
      where: { session_token: token },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    // Delete all user sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { user_id: session.user_id || '' }
    });

    // Update user's last logout time
    await prisma.user.update({
      where: { id: session.user_id || '' },
      data: {
        updated_at: new Date()
      }
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
      sessionsDeleted: deletedSessions.count,
      timestamp: new Date().toISOString()
    });

    // Add security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Logout all devices error:', error);
    
    return NextResponse.json(
      { error: 'خطأ في تسجيل الخروج من جميع الأجهزة' },
      { status: 500 }
    );
  }
} 