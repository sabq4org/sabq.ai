import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

type RouteParams = {
  params: Promise<{ path: string[] }>
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const imagePath = resolvedParams.path.join('/');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', imagePath);
    
    try {
      // محاولة قراءة الملف
      const file = await readFile(fullPath);
      
      // تحديد نوع المحتوى بناءً على الامتداد
      const ext = path.extname(fullPath).toLowerCase();
      let contentType = 'image/jpeg';
      
      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.avif':
          contentType = 'image/avif';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }
      
      return new NextResponse(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      // إذا لم يتم العثور على الملف، أرجع صورة افتراضية
      console.error('Image not found:', fullPath);
      
      // إعادة توجيه إلى صورة افتراضية
      return NextResponse.redirect(new URL('/default-avatar.png', request.url));
    }
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 