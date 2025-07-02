import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // قراءة ملف التفضيلات
    const filePath = path.join(process.cwd(), 'data', 'user_preferences.json');
    
    let data: any[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
      
      // التأكد من أن البيانات مصفوفة
      if (!Array.isArray(data)) {
        data = [];
      }
    } catch (error) {
      // إذا لم يكن الملف موجوداً، أنشئ مصفوفة فارغة
      console.log('Creating new preferences file');
      data = [];
    }

    // حذف التفضيلات القديمة للمستخدم
    data = data.filter((pref: any) => pref.user_id !== userId);

    // إضافة التفضيلات الجديدة
    if (Array.isArray(preferences)) {
      // إذا كانت preferences مصفوفة من categoryIds
      preferences.forEach((categoryId: any) => {
        data.push({
          user_id: userId,
          category_id: categoryId.toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    } else if (typeof preferences === 'object') {
      // إذا كانت preferences كائن
      Object.entries(preferences).forEach(([key, value]) => {
        data.push({
          user_id: userId,
          key: key,
          value: value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    }

    // التأكد من وجود المجلد
    const dataDir = path.dirname(filePath);
    await fs.mkdir(dataDir, { recursive: true });

    // حفظ الملف
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      message: 'تم حفظ التفضيلات بنجاح',
      data: preferences
    });

  } catch (error) {
    console.error('خطأ في حفظ التفضيلات:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في حفظ التفضيلات' },
      { status: 500 }
    );
  }
} 