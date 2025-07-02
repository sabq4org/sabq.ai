import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    console.log('🔍 جلب تفضيلات المستخدم:', userId);

    // جلب تفضيلات المستخدم من قاعدة البيانات
    // UserPreference في Prisma يحتوي على key/value pairs
    const userPreferences = await prisma.userPreference.findMany({
      where: { 
        userId: userId,
        key: 'categories' // البحث عن تفضيلات التصنيفات
      }
    });

    console.log('📊 عدد سجلات التفضيلات:', userPreferences.length);

    // محاولة استخراج البيانات من value
    let preferences: any[] = [];
    
    if (userPreferences.length > 0 && userPreferences[0].value) {
      try {
        // value قد يكون JSON string أو object
        const value = userPreferences[0].value;
        const categoriesData = typeof value === 'string' ? JSON.parse(value) : value;
        
        // جلب معلومات التصنيفات من قاعدة البيانات
        if (Array.isArray(categoriesData)) {
          const categoryIds = categoriesData.map((id: any) => id.toString());
          const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } }
          });
          
          preferences = categories.map(cat => ({
            category_id: cat.id,
            category_name: cat.name,
            category_icon: cat.icon || '📌',
            category_color: cat.color || '#6B7280'
          }));
        }
      } catch (parseError) {
        console.error('❌ خطأ في تحليل بيانات التفضيلات:', parseError);
      }
    }

    // إذا لم نجد تفضيلات في قاعدة البيانات، جرب من الملف
    if (preferences.length === 0) {
      console.log('📄 محاولة جلب التفضيلات من الملف...');
      
      try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'data', 'user_preferences.json');
        
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          const allPreferences = JSON.parse(fileData);
          const userPrefs = allPreferences.filter((p: any) => p.user_id === userId);
          
          console.log('📄 تم جلب التفضيلات من الملف:', userPrefs.length);
          
          // خريطة التصنيفات
          const categoryMap: any = {
            1: { name: 'تقنية', icon: '💻', color: '#3B82F6' },
            2: { name: 'اقتصاد', icon: '📈', color: '#10B981' },
            3: { name: 'رياضة', icon: '⚽', color: '#F97316' },
            4: { name: 'ثقافة', icon: '📚', color: '#A855F7' },
            5: { name: 'صحة', icon: '❤️', color: '#EC4899' },
            6: { name: 'دولي', icon: '🌍', color: '#6366F1' },
            7: { name: 'محلي', icon: '🏛️', color: '#14B8A6' },
            8: { name: 'سياسة', icon: '🗳️', color: '#F59E0B' }
          };
          
          preferences = userPrefs.map((pref: any) => {
            const category = categoryMap[pref.category_id] || { 
              name: 'عام', 
              icon: '📌', 
              color: '#6B7280' 
            };
            
            return {
              category_id: pref.category_id,
              category_name: category.name,
              category_icon: category.icon,
              category_color: category.color
            };
          });
        }
      } catch (fileError) {
        console.error('❌ خطأ في قراءة الملف:', fileError);
      }
    }

    return NextResponse.json({
      success: true,
      data: preferences,
      source: preferences.length > 0 ? 'success' : 'empty'
    });
  } catch (error) {
    console.error('❌ خطأ في جلب التفضيلات:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 