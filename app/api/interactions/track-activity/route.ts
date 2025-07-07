import { NextRequest, NextResponse } from 'next/server';
import { handleOptions, corsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return corsResponse({
      success: true,
      message: 'تم تسجيل النشاط بنجاح - مبسط',
      data: body
    });
  } catch (error) {
    return corsResponse({
      success: false,
      error: 'فشل في تسجيل النشاط'
    }, 500);
  }
} 