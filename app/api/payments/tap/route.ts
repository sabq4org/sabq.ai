import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { validateRequest } from '@/lib/validation';

// Schema للتحقق من صحة البيانات
const TapChargeSchema = z.object({
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.string().length(3, 'رمز العملة يجب أن يكون 3 أحرف').default('SAR'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  customer_id: z.string().optional(),
  redirect_url: z.string().url().optional(),
  source: z.object({
    id: z.string().optional(),
    type: z.enum(['card', 'knet', 'benefit', 'sadad']).default('card')
  }).optional()
});

const TapRefundSchema = z.object({
  charge_id: z.string().min(1, 'معرف الدفعة مطلوب'),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * POST /api/payments/tap/charges
 * إنشاء دفعة جديدة
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(TapChargeSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      const { amount, currency, description, metadata, customer_id, redirect_url, source } = validation.data;

      // الحصول على إعدادات Tap
      const tapProvider = await prisma.paymentProvider.findFirst({
        where: { 
          name: 'Tap Payment',
          type: 'TAP',
          status: 'ACTIVE'
        }
      });

      if (!tapProvider) {
        return NextResponse.json(
          { success: false, error: 'تكامل Tap غير متوفر' },
          { status: 503 }
        );
      }

      // إنشاء الدفعة عبر Tap API
      const tapCharge = await createTapCharge({
        amount,
        currency,
        description: description || `دفعة من ${user.name}`,
        metadata: {
          ...metadata,
          user_id: user.id,
          created_by: 'sabq-ai-cms'
        },
        customer_id,
        redirect_url: redirect_url || `${process.env.NEXT_PUBLIC_BASE_URL}/payments/success`,
        source
      }, tapProvider.config);

      // حفظ معاملة الدفع في قاعدة البيانات
      const transaction = await prisma.paymentTransaction.create({
        data: {
          providerId: tapProvider.id,
          externalId: tapCharge.id,
          amount,
          currency,
          status: 'PENDING',
          paymentMethod: source?.type || 'card',
          metadata: {
            tap_charge_id: tapCharge.id,
            user_id: user.id,
            original_request: validation.data
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          transaction_id: transaction.id,
          charge_id: tapCharge.id,
          amount: tapCharge.amount,
          currency: tapCharge.currency,
          status: tapCharge.status,
          transaction_url: tapCharge.transaction?.url,
          redirect_url: tapCharge.redirect?.url
        }
      });

    } catch (error) {
      console.error('خطأ في إنشاء دفعة Tap:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء الدفعة' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/payments/tap/charges/[id]
 * جلب تفاصيل الدفعة
 */
export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const chargeId = pathname.split('/').pop();
    
    if (!chargeId) {
      return NextResponse.json(
        { success: false, error: 'معرف الدفعة مطلوب' },
        { status: 400 }
      );
    }

    // البحث عن المعاملة في قاعدة البيانات
    const transaction = await prisma.paymentTransaction.findFirst({
      where: { externalId: chargeId },
      include: { provider: true }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'المعاملة غير موجودة' },
        { status: 404 }
      );
    }

    // جلب تفاصيل الدفعة من Tap
    const tapCharge = await retrieveTapCharge(chargeId, transaction.provider.config);

    // تحديث حالة المعاملة إذا تغيرت
    if (tapCharge.status !== transaction.status) {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { 
          status: mapTapStatusToLocal(tapCharge.status),
          metadata: {
            ...transaction.metadata,
            last_updated: new Date().toISOString(),
            tap_response: tapCharge
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        charge_id: tapCharge.id,
        amount: tapCharge.amount,
        currency: tapCharge.currency,
        status: tapCharge.status,
        description: tapCharge.description,
        created_at: tapCharge.created,
        paid_at: tapCharge.paid_at,
        customer: tapCharge.customer,
        source: tapCharge.source,
        receipt: tapCharge.receipt
      }
    });

  } catch (error) {
    console.error('خطأ في جلب تفاصيل الدفعة:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب تفاصيل الدفعة' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/tap/refunds
 * استرداد دفعة
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const validation = validateRequest(TapRefundSchema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 }
        );
      }

      const { charge_id, amount, reason, metadata } = validation.data;

      // البحث عن المعاملة
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { externalId: charge_id },
        include: { provider: true }
      });

      if (!transaction) {
        return NextResponse.json(
          { success: false, error: 'المعاملة غير موجودة' },
          { status: 404 }
        );
      }

      // إنشاء الاسترداد عبر Tap API
      const tapRefund = await createTapRefund({
        charge_id,
        amount: amount || transaction.amount,
        reason: reason || 'استرداد من العميل',
        metadata: {
          ...metadata,
          refunded_by: user.id,
          original_transaction: transaction.id
        }
      }, transaction.provider.config);

      // تحديث حالة المعاملة
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'REFUNDED',
          metadata: {
            ...transaction.metadata,
            refund_id: tapRefund.id,
            refund_amount: tapRefund.amount,
            refunded_at: new Date().toISOString(),
            refunded_by: user.id
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          refund_id: tapRefund.id,
          charge_id: tapRefund.charge_id,
          amount: tapRefund.amount,
          currency: tapRefund.currency,
          status: tapRefund.status,
          created_at: tapRefund.created
        }
      });

    } catch (error) {
      console.error('خطأ في استرداد الدفعة:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في استرداد الدفعة' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * إنشاء دفعة عبر Tap API
 */
async function createTapCharge(data: any, config: any) {
  const response = await fetch('https://api.tap.company/v2/charges', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Tap API Error: ${error.message || 'فشل في إنشاء الدفعة'}`);
  }

  return await response.json();
}

/**
 * جلب تفاصيل الدفعة من Tap API
 */
async function retrieveTapCharge(chargeId: string, config: any) {
  const response = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
    headers: {
      'Authorization': `Bearer ${config.secretKey}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Tap API Error: ${error.message || 'فشل في جلب تفاصيل الدفعة'}`);
  }

  return await response.json();
}

/**
 * إنشاء استرداد عبر Tap API
 */
async function createTapRefund(data: any, config: any) {
  const response = await fetch('https://api.tap.company/v2/refunds', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Tap API Error: ${error.message || 'فشل في إنشاء الاسترداد'}`);
  }

  return await response.json();
}

/**
 * تحويل حالة Tap إلى الحالة المحلية
 */
function mapTapStatusToLocal(tapStatus: string): string {
  const statusMap: Record<string, string> = {
    'INITIATED': 'PENDING',
    'ABANDONED': 'FAILED',
    'CANCELLED': 'CANCELLED',
    'FAILED': 'FAILED',
    'DECLINED': 'FAILED',
    'RESTRICTED': 'FAILED',
    'CAPTURED': 'COMPLETED',
    'VOID': 'CANCELLED',
    'TIMEDOUT': 'FAILED',
    'UNKNOWN': 'PROCESSING'
  };

  return statusMap[tapStatus] || 'PROCESSING';
} 