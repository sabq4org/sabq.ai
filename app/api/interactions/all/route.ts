import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const interactionsPath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
    
    let interactions = [];
    try {
      const data = await fs.readFile(interactionsPath, 'utf8');
      const parsedData = JSON.parse(data);
      
      // التأكد من أن البيانات مصفوفة
      if (Array.isArray(parsedData)) {
        interactions = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        // إذا كانت البيانات كائن، حاول استخراج المصفوفة منه
        if (Array.isArray(parsedData.interactions)) {
          interactions = parsedData.interactions;
        } else {
          // إذا لم تكن هناك مصفوفة، حول الكائن إلى مصفوفة
          interactions = Object.values(parsedData);
        }
      }
    } catch (error) {
      // إذا لم يكن الملف موجوداً أو فشلت القراءة، نرجع مصفوفة فارغة
      console.log('Could not read interactions file:', error);
    }

    // ترتيب التفاعلات حسب الوقت (الأحدث أولاً) مع التحقق من وجود مصفوفة
    if (Array.isArray(interactions) && interactions.length > 0) {
      interactions.sort((a: any, b: any) => {
        const dateA = new Date(a.timestamp || a.created_at || 0).getTime();
        const dateB = new Date(b.timestamp || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }

    return NextResponse.json({
      success: true,
      count: interactions.length,
      interactions
    });

  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
} 