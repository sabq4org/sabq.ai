import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

// GET: جلب تفاصيل ملف وسائط محدد
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await prisma.mediaFile.findUnique({
      where: { id: params.id },
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
                status: true,
                publishedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({
      media: {
        ...media,
        categories: media.categories.map((c) => c.category),
        usedInArticles: media.articleMedia.map((am) => ({
          articleId: am.article.id,
          articleTitle: am.article.title,
          articleSlug: am.article.slug,
          articleStatus: am.article.status,
          publishedAt: am.article.publishedAt,
          position: am.position,
          caption: am.caption,
        })),
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

// PATCH: تحديث معلومات ملف الوسائط
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      title,
      description,
      tags,
      classification,
      source,
      categoryIds,
      aiEntities,
    } = data;

    // التحقق من وجود الملف
    const existingMedia = await prisma.mediaFile.findUnique({
      where: { id: params.id },
    });

    if (!existingMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // تحديث الملف
    const updatedMedia = await prisma.mediaFile.update({
      where: { id: params.id },
      data: {
        title,
        description,
        tags,
        classification,
        source,
        aiEntities,
        ...(categoryIds && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId: string) => ({
              categoryId,
            })),
          },
        }),
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
        action: "media_update",
        entityType: "media",
        entityId: params.id,
        oldValue: {
          title: existingMedia.title,
          description: existingMedia.description,
          classification: existingMedia.classification,
        },
        newValue: {
          title,
          description,
          classification,
        },
      },
    });

    return NextResponse.json({
      message: "Media updated successfully",
      media: {
        ...updatedMedia,
        categories: updatedMedia.categories.map((c) => c.category),
      },
    });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE: حذف ملف وسائط
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // التحقق من وجود الملف
    const media = await prisma.mediaFile.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            articleMedia: true,
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // التحقق من عدم استخدام الملف في مقالات
    if (media._count.articleMedia > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete media that is used in articles",
          usageCount: media._count.articleMedia,
        },
        { status: 400 }
      );
    }

    // حذف الملف
    await prisma.mediaFile.delete({
      where: { id: params.id },
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "media_delete",
        entityType: "media",
        entityId: params.id,
        metadata: {
          fileName: media.fileName,
          title: media.title,
        },
      },
    });

    return NextResponse.json({
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
} 