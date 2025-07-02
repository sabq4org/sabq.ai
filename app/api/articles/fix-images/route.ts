import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkImageExists, getDefaultImageUrl, extractPublicIdFromUrl, deleteFromCloudinary } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    // جلب جميع المقالات مع الصور
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        featuredImage: true,
        socialImage: true
      },
      where: {
        OR: [
          { featuredImage: { not: null } },
          { socialImage: { not: null } }
        ]
      }
    });

    const results = [];

    for (const article of articles) {
      const articleResult = {
        id: article.id,
        title: article.title,
        featuredImage: {
          original: article.featuredImage,
          exists: false,
          fixed: false,
          newUrl: null as string | null
        },
        socialImage: {
          original: article.socialImage,
          exists: false,
          fixed: false,
          newUrl: null as string | null
        }
      };

      // التحقق من صورة المقال الرئيسية
      if (article.featuredImage) {
        const exists = await checkImageExists(article.featuredImage);
        articleResult.featuredImage.exists = exists;
        
        if (!exists) {
          // استخدام صورة افتراضية
          articleResult.featuredImage.newUrl = getDefaultImageUrl('article');
          articleResult.featuredImage.fixed = true;
          
          // تحديث قاعدة البيانات
          await prisma.article.update({
            where: { id: article.id },
            data: { featuredImage: getDefaultImageUrl('article') }
          });
        }
      }

      // التحقق من صورة التواصل الاجتماعي
      if (article.socialImage) {
        const exists = await checkImageExists(article.socialImage);
        articleResult.socialImage.exists = exists;
        
        if (!exists) {
          // استخدام صورة افتراضية
          articleResult.socialImage.newUrl = getDefaultImageUrl('article');
          articleResult.socialImage.fixed = true;
          
          // تحديث قاعدة البيانات
          await prisma.article.update({
            where: { id: article.id },
            data: { socialImage: getDefaultImageUrl('article') }
          });
        }
      }

      results.push(articleResult);
    }

    const summary = {
      totalArticles: results.length,
      articlesWithMissingImages: results.filter(r => !r.featuredImage.exists || !r.socialImage.exists).length,
      fixedImages: results.filter(r => r.featuredImage.fixed || r.socialImage.fixed).length,
      results
    };

    return NextResponse.json({
      success: true,
      message: 'تم فحص وإصلاح الصور المفقودة',
      summary,
      data: results
    });

  } catch (error) {
    console.error('خطأ في إصلاح الصور:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في إصلاح الصور',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { articleId, imageType, newImageUrl } = await request.json();

    if (!articleId || !imageType || !newImageUrl) {
      return NextResponse.json({
        success: false,
        error: 'بيانات غير مكتملة',
        message: 'يجب توفير articleId و imageType و newImageUrl'
      }, { status: 400 });
    }

    // التحقق من وجود المقال
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, featuredImage: true, socialImage: true }
    });

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'المقال غير موجود',
        message: `المقال برقم ${articleId} غير موجود`
      }, { status: 404 });
    }

    // حذف الصورة القديمة من Cloudinary إذا كانت موجودة
    const oldImageUrl = imageType === 'featured' ? article.featuredImage : article.socialImage;
    if (oldImageUrl) {
      const publicId = extractPublicIdFromUrl(oldImageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // تحديث الصورة في قاعدة البيانات
    const updateData = imageType === 'featured' 
      ? { featuredImage: newImageUrl }
      : { socialImage: newImageUrl };

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      select: { id: true, title: true, featuredImage: true, socialImage: true }
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الصورة بنجاح',
      data: {
        article: updatedArticle,
        updatedField: imageType,
        oldUrl: oldImageUrl,
        newUrl: newImageUrl
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث الصورة:', error);
    return NextResponse.json({
      success: false,
      error: 'فشل في تحديث الصورة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
} 