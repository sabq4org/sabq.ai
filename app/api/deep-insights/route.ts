import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DeepAnalysis } from '@/types/deep-analysis';

// مسار ملف البيانات
const DATA_PATH = join(process.cwd(), 'data', 'deep_analyses.json');

// نوع البيانات المرجعة للواجهة الأمامية
interface DeepInsightResponse {
  id: string;
  title: string;
  summary: string;
  author: string;
  createdAt: string;
  readTime: number;
  views: number;
  aiConfidence: number;
  tags: string[];
  type: string;
  analysisType?: 'manual' | 'ai' | 'mixed';
  url: string;
  isNew: boolean;
  qualityScore: number;
  category: string;
}

// قراءة التحليلات من الملف
async function readAnalyses(): Promise<DeepAnalysis[]> {
  try {
    const data = await readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // إذا لم يكن الملف موجوداً، نعيد مصفوفة فارغة
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '3');
    const sort = searchParams.get('sort') || 'desc';

    // قراءة التحليلات من الملف
    const analyses = await readAnalyses();
    
    // فلترة التحليلات المنشورة والنشطة فقط
    const publishedAnalyses = analyses.filter(analysis => 
      analysis.status === 'published' && 
      analysis.isActive === true
    );

    // تحويل البيانات إلى التنسيق المطلوب للواجهة الأمامية
    let insights: DeepInsightResponse[] = publishedAnalyses.map(analysis => ({
      id: analysis.id,
      title: analysis.title,
      summary: analysis.summary,
      author: analysis.authorName,
      createdAt: analysis.publishedAt || analysis.createdAt,
      readTime: analysis.readingTime,
      views: analysis.views,
      aiConfidence: analysis.sourceType === 'gpt' ? analysis.qualityScore * 100 : 0,
      tags: analysis.tags.slice(0, 2), // أول وسمين فقط
      type: analysis.sourceType === 'gpt' ? 'AI' : 'تحرير بشري',
      analysisType: analysis.analysisType,
      url: `/insights/deep/${analysis.id}`,
      isNew: isNewAnalysis(analysis.publishedAt || analysis.createdAt),
      qualityScore: analysis.qualityScore * 100,
      category: analysis.categories[0] || 'تحليل عميق'
    }));

    // الترتيب
    if (sort === 'desc') {
      insights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'views') {
      insights.sort((a, b) => b.views - a.views);
    }

    // تحديد العدد
    insights = insights.slice(0, limit);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching deep insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deep insights' },
      { status: 500 }
    );
  }
}

// دالة للتحقق من كون التحليل جديد (خلال آخر 48 ساعة)
function isNewAnalysis(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 48;
} 