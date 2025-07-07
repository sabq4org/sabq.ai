import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // جلب التصنيفات المحفوظة من ملف JSON
    try {
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      const preferencesFile = path.join(process.cwd(), 'data', 'user_preferences.json');
      
      // التأكد من وجود الملف
      try {
        await fs.access(preferencesFile);
        const fileContent = await fs.readFile(preferencesFile, 'utf-8');
        const preferences = JSON.parse(fileContent);
        
        if (Array.isArray(preferences)) {
          // البحث عن تفضيلات المستخدم
          const userPrefs = preferences.filter((pref: any) => pref.user_id === userId);
          
          if (userPrefs.length > 0) {
            const categoryIds = userPrefs.map((pref: any) => pref.category_id);
            return NextResponse.json({ 
              success: true,
              categoryIds,
              source: 'json_file'
            });
          }
        }
      } catch (fileError) {
        console.log('ملف التفضيلات غير موجود أو فارغ');
      }
      
      // إذا لم نجد في الملف، نحاول localStorage simulation
      // إرجاع مصفوفة فارغة بدلاً من تصنيفات افتراضية
      return NextResponse.json({ 
        success: true,
        categoryIds: [],
        source: 'none'
      });
      
    } catch (error) {
      console.error('خطأ في قراءة التفضيلات:', error);
      return NextResponse.json({ 
        success: true,
        categoryIds: [],
        source: 'error'
      });
    }

  } catch (error) {
    console.error('Error fetching saved categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved categories' },
      { status: 500 }
    );
  }
} 