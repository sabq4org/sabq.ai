/**
 * API التوصيات الذكية
 * Smart Recommendations API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // استدعاء خدمة الذكاء الاصطناعي
    const mlResponse = await fetch('http://localhost:8000/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!mlResponse.ok) {
      throw new Error('فشل في الحصول على التوصيات');
    }

    const recommendations = await mlResponse.json();

    return NextResponse.json(recommendations);

  } catch (error) {
    console.error('خطأ في API التوصيات:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في توليد التوصيات',
      recommendations: [],
      metrics: {},
      user_profile: {}
    }, { status: 500 });
  }
} 