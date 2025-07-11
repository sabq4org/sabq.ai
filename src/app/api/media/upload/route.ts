import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth-middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

// إعدادات الملفات المسموحة
const ALLOWED_FILE_TYPES = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
    extensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov']
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'],
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['.mp3', '.wav', '.ogg', '.m4a']
  },
  document: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.pdf', '.doc', '.docx']
  }
};

/**
 * تحديد نوع الملف من MIME type
 */
function getFileType(mimeType: string): string | null {
  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return null;
}

/**
 * التحقق من صحة الملف
 */
function validateFile(file: File): { valid: boolean; error?: string; fileType?: string } {
  const fileType = getFileType(file.type);
  
  if (!fileType) {
    return { valid: false, error: 'File type not allowed' };
  }

  const config = ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES];
  
  if (file.size > config.maxSize) {
    return { valid: false, error: `File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB` };
  }

  // التحقق من الامتداد
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!config.extensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }

  return { valid: true, fileType };
}

/**
 * إنشاء اسم ملف آمن
 */
function generateSafeFilename(originalName: string): string {
  const extension = '.' + originalName.split('.').pop()?.toLowerCase();
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uuid}${extension}`;
}

/**
 * حساب hash للملف للتحقق من التكرار
 */
async function calculateFileHash(buffer: ArrayBuffer): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * استخراج metadata من الملف
 */
async function extractMetadata(file: File, fileType: string): Promise<any> {
  const metadata: any = {};

  if (fileType === 'image') {
    // يمكن إضافة مكتبة لاستخراج أبعاد الصورة
    // مثل sharp أو image-size
    metadata.width = null;
    metadata.height = null;
  } else if (fileType === 'video' || fileType === 'audio') {
    // يمكن إضافة مكتبة لاستخراج مدة الفيديو/الصوت
    metadata.duration = null;
  }

  return metadata;
}

/**
 * POST /api/media/upload
 * رفع ملف وسائط
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    if (!['editor', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('alt_text') as string;
    const caption = formData.get('caption') as string;
    const isPublic = formData.get('is_public') !== 'false';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // التحقق من صحة الملف
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const fileType = validation.fileType!;
    const buffer = await file.arrayBuffer();
    
    // حساب hash للملف
    const fileHash = await calculateFileHash(buffer);

    // التحقق من وجود الملف مسبقاً
    const existingFile = await prisma.mediaFile.findFirst({
      where: {
        file_size: file.size,
        mime_type: file.type,
        // يمكن إضافة hash field لقاعدة البيانات للتحقق من التكرار
      }
    });

    if (existingFile) {
      // تحديث عدد الاستخدام
      await prisma.mediaFile.update({
        where: { id: existingFile.id },
        data: { usage_count: { increment: 1 } }
      });

      return NextResponse.json({
        success: true,
        data: { 
          file: existingFile,
          message: 'File already exists, usage count updated'
        }
      });
    }

    // إنشاء اسم ملف آمن
    const filename = generateSafeFilename(file.name);
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileType);
    const filePath = join(uploadDir, filename);
    const fileUrl = `/uploads/${fileType}/${filename}`;

    // إنشاء المجلد إذا لم يكن موجوداً
    await mkdir(uploadDir, { recursive: true });

    // كتابة الملف
    await writeFile(filePath, Buffer.from(buffer));

    // استخراج metadata
    const metadata = await extractMetadata(file, fileType);

    // حفظ معلومات الملف في قاعدة البيانات
    const mediaFile = await prisma.mediaFile.create({
      data: {
        filename,
        original_name: file.name,
        file_path: filePath,
        file_url: fileUrl,
        file_type: fileType,
        mime_type: file.type,
        file_size: file.size,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        alt_text: altText || null,
        caption: caption || null,
        uploaded_by: user.id,
        is_public: isPublic,
        usage_count: 1
      }
    });

    return NextResponse.json({
      success: true,
      data: { file: mediaFile }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/upload
 * جلب قائمة الملفات المرفوعة
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const whereClause: any = {};

    if (fileType) {
      whereClause.file_type = fileType;
    }

    if (search) {
      whereClause.OR = [
        { original_name: { contains: search, mode: 'insensitive' } },
        { alt_text: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [files, totalCount] = await Promise.all([
      prisma.mediaFile.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.mediaFile.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        files,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching media files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 