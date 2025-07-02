import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'templates.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const templates = JSON.parse(data);
    
    // البحث عن قالب الهيدر النشط
    // أولاً: البحث عن قالب is_default = true
    let activeTemplate = templates.find((t: any) => 
      t.type === 'header' && t.is_default === true
    );
    
    // ثانياً: إذا لم يوجد، البحث عن قالب is_active = true
    if (!activeTemplate) {
      activeTemplate = templates.find((t: any) => 
        t.type === 'header' && t.is_active === true
      );
    }
    
    // ثالثاً: إذا لم يوجد، إرجاع أول قالب header
    if (!activeTemplate) {
      activeTemplate = templates.find((t: any) => t.type === 'header');
    }
    
    if (activeTemplate) {
      return NextResponse.json(activeTemplate);
    } else {
      return NextResponse.json(null);
    }
  } catch (error) {
    console.error('Error reading templates:', error);
    return NextResponse.json(null, { status: 500 });
  }
} 