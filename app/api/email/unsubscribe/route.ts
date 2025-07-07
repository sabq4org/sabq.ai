import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subscriberId = searchParams.get('id');

    if (!subscriberId) {
      return NextResponse.json(
        { success: false, error: 'معرف المشترك مطلوب' },
        { status: 400 }
      );
    }

    // تحديث حالة المشترك
    const subscriber = await prisma.subscriber.update({
      where: { id: subscriberId },
      data: { status: 'unsubscribed' }
    });

    // تحديث سجلات البريد المرتبطة
    await prisma.emailLog.updateMany({
      where: { 
        subscriber_id: subscriberId,
        unsubscribed_at: null 
      },
      data: {
        status: 'unsubscribed',
        unsubscribed_at: new Date()
      }
    });

    // إرجاع صفحة تأكيد إلغاء الاشتراك
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>إلغاء الاشتراك - سبق</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            margin: 20px;
          }
          h1 {
            color: #2563eb;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .email {
            font-weight: bold;
            color: #333;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>تم إلغاء الاشتراك بنجاح</h1>
          <p>
            تم إلغاء اشتراك البريد الإلكتروني 
            <span class="email">${subscriber.email}</span>
            من القائمة البريدية لصحيفة سبق.
          </p>
          <p>
            نأسف لرؤيتك تغادر. إذا كان هذا خطأ أو إذا غيرت رأيك، 
            يمكنك دائماً إعادة الاشتراك من خلال موقعنا.
          </p>
          <a href="/" class="button">العودة إلى الموقع</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    
    // صفحة خطأ
    const errorHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>خطأ - سبق</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            margin: 20px;
          }
          h1 {
            color: #dc2626;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>حدث خطأ</h1>
          <p>عذراً، حدث خطأ أثناء محاولة إلغاء الاشتراك. يرجى المحاولة مرة أخرى لاحقاً.</p>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
} 