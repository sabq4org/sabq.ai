import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني مطلوب'
      }, { status: 400 });
    }
    
    const result = await sendWelcomeEmail(email, 'مستخدم تجريبي');
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `تم إرسال بريد الترحيب بنجاح إلى ${email}`,
        details: {
          email,
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
    console.error('Error sending test welcome email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 