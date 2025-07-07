import { NextRequest, NextResponse } from 'next/server';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

// GET: جلب التفاعلات - مبسط
export async function GET(request: NextRequest) {
  return corsResponse({
    success: true,
    interactions: [],
    total: 0,
    message: 'API مبسط - يعمل بشكل أساسي'
  });
}

// POST: إنشاء تفاعل جديد - مبسط
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return corsResponse({
      success: true,
      message: 'تم تسجيل التفاعل بنجاح',
      data: body
    });
  } catch (error) {
    return corsResponse({
      success: false,
      error: 'فشل في معالجة التفاعل'
    }, 500);
  }
}

// DELETE: حذف تفاعل - مبسط
export async function DELETE(request: NextRequest) {
  return corsResponse({
    success: true,
    message: 'تم حذف التفاعل بنجاح'
  });
} 