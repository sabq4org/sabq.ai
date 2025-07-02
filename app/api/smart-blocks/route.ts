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
  keywords?: string[];
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
    isAlwaysActive: boolean;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

// إنشاء مجلد البيانات إذا لم يكن موجوداً
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// قراءة البلوكات من الملف
async function readBlocks(): Promise<SmartBlock[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(BLOCKS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length === 0) {
      // إذا كان الملف موجوداً لكنه فارغ، أضف البلوكات الافتراضية
      const defaultBlocks: SmartBlock[] = [
        {
          id: '1',
          name: 'أخبار اليوم الوطني',
          position: 'afterHighlights',
          type: 'smart',
          status: 'active',
          displayType: 'grid',
          keywords: ['اليوم الوطني'],
          articlesCount: 6,
          theme: {
            primaryColor: '#00BFA6',
            backgroundColor: '#f8fafc',
            textColor: '#1a1a1a'
          },
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'أخبار الرياضة',
          position: 'afterCards',
          type: 'smart',
          status: 'active',
          displayType: 'cards',
          keywords: ['رياضة'],
          category: 'رياضة',
          articlesCount: 4,
          theme: {
            primaryColor: '#3b82f6',
            backgroundColor: '#ffffff',
            textColor: '#1f2937'
          },
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(BLOCKS_FILE, JSON.stringify(defaultBlocks, null, 2));
      return defaultBlocks;
    }
    return parsed;
  } catch (error) {
    console.error('خطأ في جلب البلوكات:', error);
    return [];
  }
}

// كتابة البلوكات إلى الملف
async function writeBlocks(blocks: SmartBlock[]) {
  await ensureDataDirectory();
  await fs.writeFile(BLOCKS_FILE, JSON.stringify(blocks, null, 2));
}

// GET - جلب جميع البلوكات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const status = searchParams.get('status');
    
    let blocks = await readBlocks();
    
    // فلترة حسب الموقع
    if (position) {
      blocks = blocks.filter(block => block.position === position);
    }
    
    // فلترة حسب الحالة
    if (status) {
      blocks = blocks.filter(block => block.status === status);
    }
    
    // فلترة البلوكات المجدولة
    const now = new Date().toISOString();
    blocks = blocks.filter(block => {
      if (block.status === 'scheduled' && block.schedule && !block.schedule.isAlwaysActive) {
        const startDate = block.schedule.startDate;
        const endDate = block.schedule.endDate;
        
        if (startDate && endDate) {
          return now >= startDate && now <= endDate;
        }
      }
      return true;
    });
    
    // ترتيب حسب order
    blocks.sort((a, b) => a.order - b.order);
    
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('خطأ في جلب البلوكات:', error);
    return NextResponse.json(
      { error: 'فشل في جلب البلوكات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء بلوك جديد
export async function POST(request: NextRequest) {
  try {
    const blockData = await request.json();
    const blocks = await readBlocks();
    
    // إنشاء ID جديد
    const newId = Date.now().toString();
    
    const newBlock: SmartBlock = {
      ...blockData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: blockData.order || blocks.length + 1
    };
    
    blocks.push(newBlock);
    await writeBlocks(blocks);
    
    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error('خطأ في إنشاء البلوك:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء البلوك' },
      { status: 500 }
    );
  }
}

// PUT - تحديث جميع البلوكات (للترتيب)
export async function PUT(request: NextRequest) {
  try {
    const { blocks } = await request.json();
    
    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'البيانات غير صحيحة' },
        { status: 400 }
      );
    }
    
    // تحديث تاريخ التعديل
    const updatedBlocks = blocks.map(block => ({
      ...block,
      updatedAt: new Date().toISOString()
    }));
    
    await writeBlocks(updatedBlocks);
    
    return NextResponse.json({ message: 'تم تحديث البلوكات بنجاح' });
  } catch (error) {
    console.error('خطأ في تحديث البلوكات:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث البلوكات' },
      { status: 500 }
    );
  }
} 