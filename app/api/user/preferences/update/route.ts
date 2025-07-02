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
    
    let data: Record<string, any> = {};
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (error) {
      // إذا لم يكن الملف موجوداً، أنشئ كائن فارغ
      console.log('Creating new preferences file');
    }

    // تحديث أو إضافة تفضيلات المستخدم
    data[userId] = preferences;

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