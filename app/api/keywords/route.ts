import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'keywords.json');

interface Keyword {
  id: string;
  name: string;
  usageCount: number;
}

async function loadKeywords(): Promise<Keyword[]> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(content);
    return parsed.keywords || [];
  } catch (err) {
    return [];
  }
}

async function saveKeywords(keywords: Keyword[]) {
  const data = { keywords };
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET: ?search=name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('search') || '';
    const keywords = await loadKeywords();
    const filtered = q ? keywords.filter(k => k.name.includes(q)) : keywords;
    return NextResponse.json({ success: true, data: filtered });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to load keywords' }, { status: 500 });
  }
}

// POST: add keyword { name }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'الاسم مطلوب' }, { status: 400 });
    }
    const keywords = await loadKeywords();
    const exists = keywords.find(k => k.name === body.name);
    if (exists) {
      return NextResponse.json({ success: false, error: 'الكلمة موجودة مسبقاً' }, { status: 400 });
    }
    const newKeyword: Keyword = {
      id: `kw-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name: body.name,
      usageCount: body.usageCount ?? 0
    };
    keywords.push(newKeyword);
    await saveKeywords(keywords);
    return NextResponse.json({ success: true, data: newKeyword });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'فشل الإضافة' }, { status: 500 });
  }
}

// PUT: /api/keywords?id=kw-id  body { name, usageCount }
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'معرف مفقود' }, { status: 400 });
    const keywords = await loadKeywords();
    const idx = keywords.findIndex(k => k.id === id);
    if (idx === -1) return NextResponse.json({ success: false, error: 'غير موجود' }, { status: 404 });
    if (body.name) keywords[idx].name = body.name;
    if (typeof body.usageCount === 'number') keywords[idx].usageCount = body.usageCount;
    await saveKeywords(keywords);
    return NextResponse.json({ success: true, data: keywords[idx] });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'فشل التحديث' }, { status: 500 });
  }
}

// DELETE: /api/keywords?id=kw-id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const keywords = await loadKeywords();
    const filtered = keywords.filter(k => k.id !== id);
    await saveKeywords(filtered);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'فشل الحذف' }, { status: 500 });
  }
} 