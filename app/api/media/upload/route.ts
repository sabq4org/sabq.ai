import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { v4 as uuidv4 } from 'uuid';

// الحد الأقصى لحجم الملف (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// أنواع الملفات المسموحة
const ALLOWED_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
};

// دالة لضغط الصور (سيتم التعامل معها من Cloudinary)
async function processImage(file: File): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        format: file.type.split('/')[1] || 'unknown',
        size: file.size,
      });
    };
    img.src = URL.createObjectURL(file);
  });
}

// دالة لتحديد نوع الملف
function getFileType(mimeType: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type as any;
    }
  }
  return 'DOCUMENT';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';
    const userId = formData.get('userId') as string || '1'; // مؤقتاً

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم توفير ملف' },
        { status: 400 }
      );
    }

    // تحويل الملف إلى Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // رفع إلى Cloudinary
    try {
      // تحديد مجلد الرفع حسب النوع
      let folder = 'sabq-cms/media';
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
          folder = 'sabq-cms/media';
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

      if (!result || !result.url) {
        throw new Error('لم يتم استلام رابط الصورة من Cloudinary');
      }

      // حفظ في قاعدة البيانات (إذا كان الجدول موجود)
      let mediaFileId = uuidv4();
      try {
        // محاولة حفظ في قاعدة البيانات إذا كان الجدول موجود
        const mediaFile = await prisma.mediaFile.create({
          data: {
            fileName: file.name,
            title: file.name,
            url: result.url,
            publicId: result.publicId,
            type: 'IMAGE',
            fileSize: result.bytes || file.size,
            width: result.width || null,
            height: result.height || null,
            mimeType: file.type,
            metadata: {
              originalName: file.name,
              uploadType: type,
              cloudinaryData: {
                publicId: result.publicId,
                format: result.format
              }
            },
            uploadedBy: userId
          }
        });
        mediaFileId = mediaFile.id;
      } catch (dbError) {
        console.warn('⚠️ جدول mediaFile غير موجود، سيتم حفظ البيانات فقط في Cloudinary');
      }

      return NextResponse.json({
        id: mediaFileId,
        url: result.url,
        width: result.width,
        height: result.height,
        format: file.type.split('/')[1]
      });

    } catch (cloudinaryError) {
      console.error('خطأ في رفع الملف إلى Cloudinary:', cloudinaryError);
      return NextResponse.json(
        { error: 'فشل في رفع الملف إلى السحابة' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('خطأ في معالجة الملف:', error);
    return NextResponse.json(
      { error: 'فشل في معالجة الملف' },
      { status: 500 }
    );
  }
} 