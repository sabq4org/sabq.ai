import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const type = data.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم رفع أي ملف' });
    }

    // التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'نوع الملف غير مسموح',
        message: 'يسمح فقط بملفات الصور (JPEG, PNG, GIF, WebP)'
      }, { status: 400 });
    }

    // التحقق من حجم الملف (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'حجم الملف كبير جداً',
        message: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت'
      }, { status: 400 });
    }

    try {
      // تنظيف اسم الملف
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileExtension = path.extname(file.name);
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(fileExtension, '')
        .substring(0, 30);
      
      const finalFileName = `${timestamp}_${cleanFileName}_${randomId}${fileExtension}`;

      // تحديد مجلد الحفظ
      let uploadDir = 'uploads';
      switch (type) {
        case 'avatar':
          uploadDir = 'uploads/avatars';
          break;
        case 'featured':
          uploadDir = 'uploads/featured';
          break;
        case 'gallery':
          uploadDir = 'uploads/gallery';
          break;
        case 'team':
          uploadDir = 'uploads/team';
          break;
        case 'analysis':
          uploadDir = 'uploads/analysis';
          break;
        default:
          uploadDir = 'uploads/general';
      }

      // إنشاء المجلد إذا لم يكن موجوداً
      const fullUploadDir = path.join(process.cwd(), 'public', uploadDir);
      await mkdir(fullUploadDir, { recursive: true });

      // تحويل الملف إلى buffer وحفظه
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filePath = path.join(fullUploadDir, finalFileName);
      await writeFile(filePath, buffer);

      // إنشاء URL للوصول للملف
      const fileUrl = `/${uploadDir}/${finalFileName}`;

      console.log('✅ تم حفظ الملف محلياً:', fileUrl);

      return NextResponse.json({ 
        success: true, 
        url: fileUrl,
        public_id: finalFileName,
        message: 'تم رفع الصورة بنجاح',
        local_storage: true
      });

    } catch (uploadError) {
      console.error('❌ خطأ في حفظ الملف:', uploadError);
      return NextResponse.json({ 
        success: false, 
        error: 'فشل في حفظ الملف',
        message: uploadError instanceof Error ? uploadError.message : 'خطأ غير معروف'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ خطأ في معالجة الملف:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'فشل في معالجة الملف',
      message: error instanceof Error ? error.message : 'خطأ غير معروف' 
    }, { status: 500 });
  }
}

// دعم OPTIONS للـ CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 