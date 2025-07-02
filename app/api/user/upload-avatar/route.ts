import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  avatar?: string;
}

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'الملف ومعرف المستخدم مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'يجب أن يكون الملف صورة' },
        { status: 400 }
      );
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' },
        { status: 400 }
      );
    }

    // إنشاء مجلد الصور إذا لم يكن موجوداً
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // إنشاء اسم فريد للملف
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `avatar_${userId}_${Date.now()}${path.extname(file.name)}`;
    const filepath = path.join(uploadsDir, filename);

    // حفظ الملف
    await writeFile(filepath, buffer);

    // مسار URL للصورة
    const avatarUrl = `/uploads/avatars/${filename}`;

    // قراءة وتحديث بيانات المستخدم
    const usersContent = await fs.readFile(usersFilePath, 'utf-8');
    const data = JSON.parse(usersContent);

    // البحث عن المستخدم
    const userIndex = data.users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // حذف الصورة القديمة إذا كانت موجودة
    if (data.users[userIndex].avatar) {
      const oldAvatarPath = path.join(process.cwd(), 'public', data.users[userIndex].avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        // تجاهل الخطأ إذا كانت الصورة غير موجودة
      }
    }

    // تحديث بيانات المستخدم
    data.users[userIndex].avatar = avatarUrl;
    data.users[userIndex].updated_at = new Date().toISOString();

    // حفظ التحديثات
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      avatarUrl
    });

  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في رفع الصورة' },
      { status: 500 }
    );
  }
} 