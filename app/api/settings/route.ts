import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleOptions, corsResponse } from '@/lib/cors';

// معالجة طلبات OPTIONS للـ CORS
export async function OPTIONS() {
  return handleOptions();
}

export const runtime = 'nodejs';

// GET - جلب الإعدادات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const section = searchParams.get('section'); // identity, seo, social, ai, security, backup
    
    if (section) {
      // جلب إعدادات قسم محدد
      const settings = await prisma.siteSettings.findFirst({
        where: { section }
      });
      
      return corsResponse({
        success: true,
        data: settings?.data || {}
      });
    } else {
      // جلب جميع الإعدادات
      const allSettings = await prisma.siteSettings.findMany();
      
      const settingsMap: any = {};
      allSettings.forEach(setting => {
        settingsMap[setting.section] = setting.data;
      });
      
      return corsResponse({
        success: true,
        data: settingsMap
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return corsResponse({
      success: false,
      error: 'فشل في جلب الإعدادات'
    }, 500);
  }
}

// POST - حفظ الإعدادات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;
    
    if (!section || !data) {
      return corsResponse({
        success: false,
        error: 'يجب تحديد القسم والبيانات'
      }, 400);
    }
    
    // حفظ أو تحديث الإعدادات
    const settings = await prisma.siteSettings.upsert({
      where: { section },
      update: { 
        data,
        updatedAt: new Date()
      },
      create: {
        section,
        data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return corsResponse({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح',
      data: settings
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return corsResponse({
      success: false,
      error: 'فشل في حفظ الإعدادات'
    }, 500);
  }
} 