import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkImageExists, getDefaultImageUrl, extractPublicIdFromUrl } from '@/lib/cloudinary';
import { deleteFromCloudinary } from '@/lib/cloudinary-server';

export async function GET(request: NextRequest) {
  try {
    // جلب جميع المقالات مع الصور
    const articles = await prisma.articles.findMany({
      select: {
        id: true,
        title: true,
        featured_image: true,
        social_image: true
      },
      where: {
        OR: [
          { featured_image: { not: null } },
          { social_image: { not: null } }
        ]
      }
    });

    const results = [];

    for (const article of articles) {
      const articleResult = {
        id: article.id,
        title: article.title,
        featured_image: {
          original: article.featured_image,
          exists: false,
          fixed: false,
          newUrl: null as string | null
        },
        social_image: {
          original: article.social_image,
          exists: false,
          fixed: false,
          newUrl: null as string | null
        }
      };

      // التحقق من صورة المقال الرئيسية
      if (article.featured_image) {
        const exists = await checkImageExists(article.featured_image);
        articleResult.featured_image.exists = exists;
        
        if (!exists) {
          // استخدام صورة افتراضية
          articleResult.featured_image.newUrl = getDefaultImageUrl('article');
          articleResult.featured_image.fixed = true;
          
          // تحديث قاعدة البيانات
          await prisma.articles.update({
            where: { id: article.id },
            data: { featured_image: getDefaultImageUrl('article') }
          });
        }
      }

      // التحقق من صورة التواصل الاجتماعي
      if (article.social_image) {
        const exists = await checkImageExists(article.social_image);
        articleResult.social_image.exists = exists;
        
        if (!exists) {
          // استخدام صورة افتراضية
          articleResult.social_image.newUrl = getDefaultImageUrl('article');
          articleResult.social_image.fixed = true;
          
          // تحديث قاعدة البيانات
          await prisma.articles.update({
            where: { id: article.id },
            data: { social_image: getDefaultImageUrl('article') }
          });
        }
      }

      results.push(articleResult);
    }

    const summary = {
      totalArticles: results.length,
      articlesWithMissingImages: results.filter(r => !r.featured_image.exists || !r.social_image.exists).length,
      fixedImages: results.filter(r => r.featured_image.fixed || r.social_image.fixed).length,
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
    const article = await prisma.articles.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, featured_image: true, social_image: true }
    });

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'المقال غير موجود',
        message: `المقال برقم ${articleId} غير موجود`
      }, { status: 404 });
    }

    // حذف الصورة القديمة من Cloudinary إذا كانت موجودة
    const oldImageUrl = imageType === 'featured' ? article.featured_image : article.social_image;
    if (oldImageUrl) {
      const publicId = extractPublicIdFromUrl(oldImageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // تحديث الصورة في قاعدة البيانات
    const updateData = imageType === 'featured' 
      ? { featured_image: newImageUrl }
      : { social_image: newImageUrl };

    const updatedArticle = await prisma.articles.update({
      where: { id: articleId },
      data: updateData,
      select: { id: true, title: true, featured_image: true, social_image: true }
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