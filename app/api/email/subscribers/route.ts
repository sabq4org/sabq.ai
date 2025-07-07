import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();
import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

// مخطط التحقق من بيانات المشترك
const subscriberSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  name: z.string().optional(),
  status: z.enum(['active', 'inactive', 'unsubscribed']).optional(),
  preferences: z.object({
    categories: z.array(z.string()).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional()
  }).optional()
});

// GET: جلب المشتركين مع التصفية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // بناء شروط التصفية
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.preferences = {
        path: '$.categories',
        array_contains: category
      };
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } }
      ];
    }
    
    // جلب المشتركين
    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.subscriber.count({ where })
    ]);
    
    // جلب عدد سجلات البريد لكل مشترك
    const subscriberIds = subscribers.map((s: { id: string }) => s.id);
    const logsCounts = subscriberIds.length > 0 ? await prisma.emailLog.groupBy({
      by: ['subscriber_id'],
      where: { subscriber_id: { in: subscriberIds } },
      _count: { subscriber_id: true }
    }) : [];
    const logsCountMap = new Map(logsCounts.map((lc: { subscriber_id: string; _count: { subscriber_id: number } }) => [lc.subscriber_id, lc._count.subscriber_id]));
    const subscribersWithCounts = subscribers.map((s: { id: string }) => ({
      ...s,
      emailLogsCount: logsCountMap.get(s.id) || 0
    }));
    
    return NextResponse.json({
      success: true,
      data: subscribersWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المشتركين:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في جلب المشتركين',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: إضافة مشترك جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من البيانات
    const validatedData = subscriberSchema.parse(body);
    
    // التحقق من عدم وجود المشترك مسبقاً
    const existing = await prisma.subscriber.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existing) {
      // تحديث حالة المشترك إذا كان موجوداً
      if (existing.status === 'unsubscribed') {
        const updated = await prisma.subscriber.update({
          where: { id: existing.id },
          data: {
            status: 'active',
            name: validatedData.name || existing.name,
            preferences: validatedData.preferences || existing.preferences || undefined
          }
        });
        
        return NextResponse.json({
          success: true,
          data: updated,
          message: 'تم إعادة تفعيل الاشتراك'
        });
      }
      
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مسجل مسبقاً' },
        { status: 400 }
      );
    }
    
    // إنشاء مشترك جديد
    const subscriber = await prisma.subscriber.create({
      data: {
        id: crypto.randomUUID(),
        email: validatedData.email,
        name: validatedData.name,
        status: validatedData.status || 'active',
        preferences: validatedData.preferences || undefined,
        updated_at: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      data: subscriber,
      message: 'تم إضافة المشترك بنجاح'
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('خطأ في إضافة المشترك:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة المشترك' },
      { status: 500 }
    );
  }
}

// PUT: استيراد مشتركين من CSV
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'لم يتم رفع ملف' },
        { status: 400 }
      );
    }
    
    // قراءة محتوى الملف
    const text = await file.text();
    
    // تحليل CSV
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // معالجة كل سطر
    for (const record of records) {
      try {
        const email = record.email || record.Email || record.EMAIL;
        const name = record.name || record.Name || record.NAME || '';
        
        if (!email || !z.string().email().safeParse(email).success) {
          errors++;
          continue;
        }
        
        // التحقق من وجود المشترك
        const existing = await prisma.subscriber.findUnique({
          where: { email }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // إضافة المشترك
        await prisma.subscriber.create({
          data: {
            id: crypto.randomUUID(),
            email,
            name,
            status: 'active',
            metadata: { source: 'csv_import' },
            updated_at: new Date()
          }
        });
        
        imported++;
      } catch (error) {
        errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `تم استيراد ${imported} مشترك`,
      stats: {
        imported,
        skipped,
        errors,
        total: records.length
      }
    });
    
  } catch (error) {
    console.error('خطأ في استيراد CSV:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في استيراد الملف' },
      { status: 500 }
    );
  }
} 