import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني مطلوب'
      }, { status: 400 });
    }
    
    // توليد رمز تحقق عشوائي للاختبار
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await sendVerificationEmail(email, 'مستخدم تجريبي', testCode);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `تم إرسال بريد التحقق بنجاح إلى ${email}`,
        details: {
          email,
          code: testCode,
          messageId: result.messageId
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'فشل إرسال البريد',
        details: { email }
      });
    }
  } catch (error) {
    console.error('Error sending test verification email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 