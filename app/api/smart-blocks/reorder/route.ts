import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BLOCKS_FILE = path.join(process.cwd(), 'data', 'smart_blocks.json');

interface SmartBlock {
  id: string;
  name: string;
  position: 'topBanner' | 'afterHighlights' | 'afterCards' | 'beforePersonalization' | 'beforeFooter';
  type: 'smart' | 'custom' | 'html';
  status: 'active' | 'inactive' | 'scheduled';
  displayType: 'grid' | 'cards' | 'horizontal' | 'gallery' | 'list';
  keyword?: string;
  category?: string;
  articlesCount: number;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  customHtml?: string;
  schedule?: {
    startDate: string;
    endDate: string;
    isTemp: boolean;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

// كتابة البلوكات إلى الملف
async function writeBlocks(blocks: SmartBlock[]) {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  await fs.writeFile(BLOCKS_FILE, JSON.stringify(blocks, null, 2));
}

// POST - إعادة ترتيب البلوكات
export async function POST(request: NextRequest) {
  try {
    const { blocks } = await request.json();
    
    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'البيانات غير صحيحة' },
        { status: 400 }
      );
    }
    
    // التأكد من وجود order صحيح لكل بلوك
    const reorderedBlocks = blocks.map((block, index) => ({
      ...block,
      order: index + 1,
      updatedAt: new Date().toISOString()
    }));
    
    await writeBlocks(reorderedBlocks);
    
    return NextResponse.json({
      message: 'تم تحديث ترتيب البلوكات بنجاح',
      blocks: reorderedBlocks
    });
  } catch (error) {
    console.error('خطأ في إعادة ترتيب البلوكات:', error);
    return NextResponse.json(
      { error: 'فشل في إعادة ترتيب البلوكات' },
      { status: 500 }
    );
  }
} 