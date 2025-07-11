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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Get current user information
export async function GET(request: NextRequest) {
  try {
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

    // Find user and session
    const session = await prisma.session.findUnique({
      where: { session_token: token },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'الجلسة غير موجودة أو منتهية الصلاحية' },
        { status: 401 }
      );
    }

    // Update session last used
    await prisma.session.update({
      where: { id: session.id },
      data: { started_at: new Date() } // Using existing field
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        is_verified: session.user.is_verified,
        avatar_url: session.user.avatar_url,
        bio: session.user.bio,
        last_login: session.user.last_login,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at
      },
      session: {
        id: session.id,
        created_at: session.started_at,
        ip_address: session.ip_address
      }
    });

    // Add security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Get user error:', error);
    
    return NextResponse.json(
      { error: 'خطأ في استرجاع بيانات المستخدم' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
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

    // Find user and session
    const session = await prisma.session.findUnique({
      where: { session_token: token },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'الجلسة غير موجودة أو منتهية الصلاحية' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate and sanitize input
    const allowedFields = ['name', 'bio', 'avatar_url'];
    const updateData: any = {};

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'name' || field === 'bio') {
          updateData[field] = RequestSecurity.sanitizeInput(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    });

    // Validate name length
    if (updateData.name && (updateData.name.length < 2 || updateData.name.length > 100)) {
      return NextResponse.json(
        { error: 'الاسم يجب أن يكون بين 2 و 100 حرف' },
        { status: 400 }
      );
    }

    // Validate bio length
    if (updateData.bio && updateData.bio.length > 500) {
      return NextResponse.json(
        { error: 'النبذة الشخصية يجب أن تكون أقل من 500 حرف' },
        { status: 400 }
      );
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...updateData,
        updated_at: new Date()
      }
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        is_verified: updatedUser.is_verified,
        avatar_url: updatedUser.avatar_url,
        bio: updatedUser.bio,
        last_login: updatedUser.last_login,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });

    // Add security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Update user error:', error);
    
    return NextResponse.json(
      { error: 'خطأ في تحديث الملف الشخصي' },
      { status: 500 }
    );
  }
} 