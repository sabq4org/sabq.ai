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

// قراءة البلوكات من الملف
async function readBlocks(): Promise<SmartBlock[]> {
  try {
    const data = await fs.readFile(BLOCKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
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

// GET - جلب بلوك واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blocks = await readBlocks();
    const block = blocks.find(b => b.id === id);
    
    if (!block) {
      return NextResponse.json(
        { error: 'البلوك غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(block);
  } catch (error) {
    console.error('خطأ في جلب البلوك:', error);
    return NextResponse.json(
      { error: 'فشل في جلب البلوك' },
      { status: 500 }
    );
  }
}

// PUT - تحديث بلوك
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();
    console.log(`[SmartBlocks API] تحديث البلوك ${id} بالبيانات:`, updateData);
    
    const blocks = await readBlocks();
    const blockIndex = blocks.findIndex(b => b.id === id);
    
    if (blockIndex === -1) {
      return NextResponse.json(
        { error: 'البلوك غير موجود' },
        { status: 404 }
      );
    }
    
    // تحديث البلوك
    blocks[blockIndex] = {
      ...blocks[blockIndex],
      ...updateData,
      id: id, // التأكد من عدم تغيير ID
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[SmartBlocks API] البلوك بعد التحديث:`, blocks[blockIndex]);
    
    await writeBlocks(blocks);
    
    return NextResponse.json(blocks[blockIndex]);
  } catch (error) {
    console.error('خطأ في تحديث البلوك:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث البلوك' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث جزئي للبلوك (مثل تغيير الحالة)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await request.json();
    const blocks = await readBlocks();
    const blockIndex = blocks.findIndex(b => b.id === id);
    
    if (blockIndex === -1) {
      return NextResponse.json(
        { error: 'البلوك غير موجود' },
        { status: 404 }
      );
    }
    
    // تحديث الحقول المحددة فقط
    blocks[blockIndex] = {
      ...blocks[blockIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await writeBlocks(blocks);
    
    return NextResponse.json(blocks[blockIndex]);
  } catch (error) {
    console.error('خطأ في تحديث البلوك:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث البلوك' },
      { status: 500 }
    );
  }
}

// DELETE - حذف بلوك
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blocks = await readBlocks();
    const blockIndex = blocks.findIndex(b => b.id === id);
    
    if (blockIndex === -1) {
      return NextResponse.json(
        { error: 'البلوك غير موجود' },
        { status: 404 }
      );
    }
    
    // حذف البلوك
    const deletedBlock = blocks.splice(blockIndex, 1)[0];
    
    // إعادة ترتيب البلوكات المتبقية
    const reorderedBlocks = blocks.map((block, index) => ({
      ...block,
      order: index + 1
    }));
    
    await writeBlocks(reorderedBlocks);
    
    return NextResponse.json({
      message: 'تم حذف البلوك بنجاح',
      deletedBlock
    });
  } catch (error) {
    console.error('خطأ في حذف البلوك:', error);
    return NextResponse.json(
      { error: 'فشل في حذف البلوك' },
      { status: 500 }
    );
  }
} 