import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { MediaType } from "@/lib/generated/prisma";

export const runtime = 'nodejs';

// ===============================
// أنواع البيانات
// ===============================

interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number;
  media_type: 'image' | 'video' | 'audio' | 'document';
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  description?: string;
  alt_text?: string;
  caption?: string;
  credit?: string;
  tags: string[];
  uploaded_by: string;
  article_id?: string;
  storage_provider: string;
  is_public: boolean;
  is_optimized: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

// بيانات وهمية للوسائط
let mediaFiles: MediaFile[] = [
  {
    id: 'media-1',
    filename: 'vision-2030-tech-hero.jpg',
    original_name: 'رؤية 2030 التقنية.jpg',
    file_path: '/uploads/images/2024/12/vision-2030-tech-hero.jpg',
    file_url: '/images/articles/vision-2030-tech-hero.jpg',
    mime_type: 'image/jpeg',
    file_size: 245760,
    media_type: 'image',
    width: 1200,
    height: 675,
    title: 'رؤية 2030 والتقنية',
    description: 'صورة توضيحية لإنجازات رؤية 2030 في قطاع التقنية',
    alt_text: 'رؤية المملكة 2030 في قطاع التقنية والابتكار',
    caption: 'إنجازات متميزة في التحول الرقمي',
    credit: 'وكالة الأنباء السعودية',
    tags: ['رؤية 2030', 'تقنية', 'تحول رقمي'],
    uploaded_by: 'user-1',
    article_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    storage_provider: 'local',
    is_public: true,
    is_optimized: true,
    usage_count: 5,
    last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'media-2',
    filename: 'alhilal-celebration.jpg',
    original_name: 'احتفال الهلال.jpg',
    file_path: '/uploads/images/2024/12/alhilal-celebration.jpg',
    file_url: '/images/articles/alhilal-celebration.jpg',
    mime_type: 'image/jpeg',
    file_size: 189440,
    media_type: 'image',
    width: 800,
    height: 600,
    title: 'احتفال نادي الهلال',
    description: 'لاعبو الهلال يحتفلون بالتأهل لنهائي دوري أبطال آسيا',
    alt_text: 'لاعبو نادي الهلال يحتفلون بالتأهل',
    caption: 'فرحة التأهل للنهائي الآسيوي',
    credit: 'المصور الرياضي',
    tags: ['الهلال', 'كرة قدم', 'دوري آسيا'],
    uploaded_by: 'user-2',
    article_id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    storage_provider: 'local',
    is_public: true,
    is_optimized: true,
    usage_count: 12,
    last_used_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'media-3',
    filename: 'oil-market-chart.png',
    original_name: 'مخطط أسعار النفط.png',
    file_path: '/uploads/images/2024/12/oil-market-chart.png',
    file_url: '/images/articles/oil-market-chart.png',
    mime_type: 'image/png',
    file_size: 156230,
    media_type: 'image',
    width: 1000,
    height: 500,
    title: 'مخطط أسعار النفط',
    description: 'رسم بياني يوضح تطور أسعار النفط خلال الربع الأخير',
    alt_text: 'مخطط بياني لأسعار النفط',
    caption: 'ارتفاع أسعار النفط في الأسواق العالمية',
    tags: ['نفط', 'اقتصاد', 'أسعار'],
    uploaded_by: 'user-3',
    article_id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
    storage_provider: 'local',
    is_public: true,
    is_optimized: false,
    usage_count: 3,
    last_used_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'media-4',
    filename: 'ai-conference-video.mp4',
    original_name: 'مؤتمر الذكاء الاصطناعي.mp4',
    file_path: '/uploads/videos/2024/12/ai-conference-video.mp4',
    file_url: '/videos/ai-conference-video.mp4',
    mime_type: 'video/mp4',
    file_size: 15728640,
    media_type: 'video',
    width: 1920,
    height: 1080,
    duration: 180,
    title: 'مقطع من مؤتمر الذكاء الاصطناعي',
    description: 'لقطات من افتتاح مؤتمر الرياض للذكاء الاصطناعي',
    caption: 'كلمة افتتاح المؤتمر',
    credit: 'قناة سبق',
    tags: ['ذكاء اصطناعي', 'مؤتمر', 'تقنية'],
    uploaded_by: 'user-1',
    storage_provider: 'local',
    is_public: true,
    is_optimized: true,
    usage_count: 1,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'media-5',
    filename: 'neom-project-doc.pdf',
    original_name: 'تقرير مشروع نيوم.pdf',
    file_path: '/uploads/documents/2024/12/neom-project-doc.pdf',
    file_url: '/documents/neom-project-doc.pdf',
    mime_type: 'application/pdf',
    file_size: 2097152,
    media_type: 'document',
    title: 'تقرير مشروع نيوم',
    description: 'تقرير شامل عن مشروع نيوم ومبادرات الطاقة المتجددة',
    tags: ['نيوم', 'طاقة متجددة', 'مشاريع'],
    uploaded_by: 'user-2',
    storage_provider: 'local',
    is_public: false,
    is_optimized: false,
    usage_count: 2,
    last_used_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

// ===============================
// وظائف مساعدة
// ===============================

// تحديد نوع الوسائط من MIME type
function getMediaTypeFromMime(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// تحويل حجم الملف إلى نص قابل للقراءة
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// فلترة الوسائط
function filterMedia(query: URLSearchParams) {
  let filteredMedia = [...mediaFiles];

  // فلترة حسب نوع الوسائط
  const mediaType = query.get('media_type');
  if (mediaType) {
    filteredMedia = filteredMedia.filter(file => file.media_type === mediaType);
  }

  // فلترة حسب المؤلف
  const uploadedBy = query.get('uploaded_by');
  if (uploadedBy) {
    filteredMedia = filteredMedia.filter(file => file.uploaded_by === uploadedBy);
  }

  // البحث في الاسم والوصف والعلامات
  const search = query.get('search');
  if (search) {
    filteredMedia = filteredMedia.filter(file => 
      file.title?.includes(search) ||
      file.description?.includes(search) ||
      file.original_name.includes(search) ||
      file.tags.some(tag => tag.includes(search))
    );
  }

  // فلترة الملفات العامة/الخاصة
  const isPublic = query.get('is_public');
  if (isPublic !== null) {
    filteredMedia = filteredMedia.filter(file => file.is_public === (isPublic === 'true'));
  }

  // فلترة حسب حجم الملف
  const maxSize = query.get('max_size');
  if (maxSize) {
    const maxSizeBytes = parseInt(maxSize);
    filteredMedia = filteredMedia.filter(file => file.file_size <= maxSizeBytes);
  }

  return filteredMedia;
}

// ===============================
// معالجات API
// ===============================

// GET: جلب الوسائط مع فلترة متقدمة
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") as MediaType | null;
    const classification = searchParams.get("classification");
    const search = searchParams.get("search");
    const articleId = searchParams.get("articleId");
    const unused = searchParams.get("unused") === "true";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // بناء الفلاتر
    const where: any = {
      isArchived: false,
    };

    if (type) {
      where.type = type;
    }

    if (classification) {
      where.classification = classification;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { fileName: { contains: search } },
      ];
    }

    if (articleId) {
      where.articleMedia = {
        some: {
          articleId: articleId,
        },
      };
    }

    if (unused) {
      where.usageCount = 0;
    }

    // جلب الوسائط مع العلاقات
    const [media, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          articleMedia: {
            include: {
              article: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              articleMedia: true,
            },
          },
        },
      }),
      prisma.mediaFile.count({ where }),
    ]);

    // تحويل البيانات للعرض
    const formattedMedia = media.map((item) => ({
      id: item.id,
      url: item.url,
      type: item.type,
      title: item.title,
      description: item.description,
      tags: item.tags,
      classification: item.classification,
      source: item.source,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      width: item.width,
      height: item.height,
      duration: item.duration,
      thumbnailUrl: item.thumbnailUrl,
      aiEntities: item.aiEntities,
      uploadedBy: item.uploader,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt,
      usageCount: item.usageCount,
      categories: item.categories.map((c) => c.category),
      usedInArticles: item.articleMedia.map((am) => ({
        articleId: am.article.id,
        articleTitle: am.article.title,
        articleSlug: am.article.slug,
        position: am.position,
      })),
    }));

    return NextResponse.json({
      media: formattedMedia,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// POST: رفع وسائط جديدة
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      url,
      type = "IMAGE",
      title,
      description,
      tags,
      classification,
      source,
      fileName,
      fileSize,
      mimeType,
      width,
      height,
      duration,
      thumbnailUrl,
      categoryIds = [],
    } = data;

    // إنشاء الملف في قاعدة البيانات
    const mediaFile = await prisma.mediaFile.create({
      data: {
        url,
        type,
        title,
        description,
        tags: tags || [],
        classification,
        source,
        fileName,
        fileSize,
        mimeType,
        width,
        height,
        duration,
        thumbnailUrl,
        uploadedBy: user.id,
        categories: {
          create: categoryIds.map((categoryId: string) => ({
            categoryId,
          })),
        },
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "media_upload",
        entityType: "media",
        entityId: mediaFile.id,
        metadata: {
          fileName: mediaFile.fileName,
          type: mediaFile.type,
        },
      },
    });

    return NextResponse.json({
      message: "Media uploaded successfully",
      media: {
        ...mediaFile,
        categories: mediaFile.categories.map((c) => c.category),
      },
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
  }
}

// DELETE: حذف ملفات متعددة
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'قائمة معرفات الملفات مطلوبة'
      }, { status: 400 });
    }

    const deletedCount = mediaFiles.length;
    mediaFiles = mediaFiles.filter(file => !ids.includes(file.id));
    const actualDeletedCount = deletedCount - mediaFiles.length;

    return NextResponse.json({
      success: true,
      message: `تم حذف ${actualDeletedCount} ملف`,
      deletedCount: actualDeletedCount
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'فشل في حذف الملفات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
} 