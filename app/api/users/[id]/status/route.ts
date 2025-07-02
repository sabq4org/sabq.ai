import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// تحديث حالة المستخدم
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { status } = body;

    // التحقق من صحة الحالة
    const validStatuses = ['active', 'suspended', 'banned', 'pending'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'حالة غير صحيحة' },
        { status: 400 }
      );
    }

    // قراءة ملف المستخدمين
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersData = await fs.readFile(usersPath, 'utf-8');
    const data = JSON.parse(usersData);
    const users = data.users || [];

    // العثور على المستخدم
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تحديث الحالة
    const previousStatus = users[userIndex].status;
    users[userIndex].status = status;
    users[userIndex].updated_at = new Date().toISOString();

    // إذا تم إيقاف أو حظر المستخدم، قم بتسجيل السبب
    if (status === 'suspended' || status === 'banned') {
      users[userIndex].status_reason = body.reason || 'لم يتم تحديد السبب';
      users[userIndex].status_changed_at = new Date().toISOString();
    }

    // حفظ التحديثات
    await fs.writeFile(usersPath, JSON.stringify({ users }, null, 2));

    // رسالة مناسبة حسب نوع التغيير
    let message = 'تم تحديث حالة المستخدم';
    if (previousStatus !== status) {
      if (status === 'active') {
        message = 'تم تفعيل الحساب بنجاح';
      } else if (status === 'suspended') {
        message = 'تم إيقاف الحساب مؤقتاً';
      } else if (status === 'banned') {
        message = 'تم حظر الحساب نهائياً';
      }
    }

    return NextResponse.json({
      success: true,
      message,
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        status: users[userIndex].status,
        previousStatus
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث حالة المستخدم' },
      { status: 500 }
    );
  }
} 