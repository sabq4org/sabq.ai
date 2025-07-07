import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

interface UserPreference {
  id: string;
  user_id: string;
  category_id: number;
  source: 'manual' | 'implicit';
  created_at: string;
  updated_at: string;
}

const preferencesFilePath = path.join(process.cwd(), 'data', 'user_preferences.json');
const interactionsFilePath = path.join(process.cwd(), 'data', 'user_article_interactions.json');

// تأكد من وجود ملف التفضيلات
async function ensurePreferencesFile() {
  try {
    await fs.access(preferencesFilePath);
  } catch {
    await fs.mkdir(path.dirname(preferencesFilePath), { recursive: true });
    await fs.writeFile(preferencesFilePath, JSON.stringify([]));
  }
}

// تأكد من وجود ملف التفاعلات
async function ensureInteractionsFile() {
  try {
    await fs.access(interactionsFilePath);
  } catch {
    await fs.mkdir(path.dirname(interactionsFilePath), { recursive: true });
    await fs.writeFile(interactionsFilePath, JSON.stringify({ interactions: [] }));
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // قراءة ملف التفضيلات
    await ensurePreferencesFile();
    const fileContent = await fs.readFile(preferencesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // التأكد من وجود مصفوفة
    if (!Array.isArray(data)) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // الحصول على تفضيلات المستخدم
    const userPreferences = data.filter(
      (pref: UserPreference) => pref.user_id === userId
    );

    return NextResponse.json({
      success: true,
      data: userPreferences
    });

  } catch (error) {
    console.error('خطأ في جلب التفضيلات:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب التفضيلات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, categoryIds, source = 'manual' } = body;

    if (!userId || !categoryIds || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      );
    }

    // تحويل categoryIds إلى strings
    const categoryIdsAsStrings = categoryIds.map(id => id.toString());
    
    // جلب التصنيفات - مبسط
    const categories = await prisma.categories.findMany({
      where: { id: { in: categoryIdsAsStrings } },
      select: { id: true, name: true, slug: true }
    });

    if (categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'التصنيفات المختارة غير صحيحة' },
        { status: 400 }
      );
    }

    // حفظ في قاعدة البيانات معطل مؤقتاً - سنحفظ في ملف JSON فقط
    // await prisma.userPreference.deleteMany({ ... });
    
    const newPreferences = { count: categories.length };

    // تسجيل النشاط معطل مؤقتاً
    // await prisma.activityLog.create({ ... });

    // حفظ تفضيلات إضافية معطل مؤقتاً
    // await prisma.userPreference.upsert({ ... });

    // حفظ في ملف JSON أيضاً
    try {
      await ensurePreferencesFile();
      const fileContent = await fs.readFile(preferencesFilePath, 'utf-8');
      let data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        data = [];
      }

      // حذف التفضيلات القديمة للمستخدم
      data = data.filter((pref: any) => pref.user_id !== userId);

      // إضافة التفضيلات الجديدة
      categoryIds.forEach((categoryId: any) => {
        data.push({
          user_id: userId,
          category_id: categoryId.toString(),
          source: source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

      await fs.writeFile(preferencesFilePath, JSON.stringify(data, null, 2));
    } catch (fileError) {
      console.error('خطأ في حفظ التفضيلات في الملف:', fileError);
      // لا نوقف العملية إذا فشل حفظ الملف
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ التفضيلات بنجاح',
      data: {
        count: newPreferences.count,
        interests: categories.map((c: { slug: string }) => c.slug)
      }
    });

  } catch (error) {
    console.error('خطأ في حفظ التفضيلات:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في حفظ التفضيلات' },
      { status: 500 }
    );
  }
} 