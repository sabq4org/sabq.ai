import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

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
      // تحديد مجلد الرفع حسب النوع
      let folder = 'sabq-cms';
      switch (type) {
        case 'avatar':
          folder = 'sabq-cms/avatars';
          break;
        case 'featured':
          folder = 'sabq-cms/featured';
          break;
        case 'gallery':
          folder = 'sabq-cms/gallery';
          break;
        case 'team':
          folder = 'sabq-cms/team';
          break;
        case 'analysis':
          folder = 'sabq-cms/analysis';
          break;
        default:
          folder = 'sabq-cms/general';
      }

      // رفع الملف إلى Cloudinary
      const result = await uploadToCloudinary(file, {
        folder,
        publicId: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`,
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });

      console.log('✅ تم رفع الملف إلى Cloudinary:', result.url);

      return NextResponse.json({ 
        success: true, 
        url: result.url,
        public_id: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        message: 'تم رفع الصورة بنجاح إلى Cloudinary'
      });

    } catch (cloudinaryError) {
      console.error('❌ خطأ في رفع الملف إلى Cloudinary:', cloudinaryError);
      return NextResponse.json({ 
        success: false, 
        error: 'فشل رفع الصورة إلى السحابة',
        message: 'لا يمكن حفظ الصور محلياً. يجب رفعها إلى Cloudinary فقط.',
        details: cloudinaryError instanceof Error ? cloudinaryError.message : 'خطأ غير معروف'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ خطأ في رفع الملف:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'فشل رفع الملف',
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