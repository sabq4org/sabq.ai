import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { 
  DeepAnalysis, 
  CreateAnalysisRequest,
  AnalysisStatus,
  SourceType
} from '@/types/deep-analysis';
import { generateDeepAnalysis, initializeOpenAI } from '@/lib/services/deepAnalysisService';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';

export const runtime = 'nodejs';

// مسار ملف البيانات
const DATA_PATH = join(process.cwd(), 'data', 'deep_analyses.json');

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

// كتابة التحليلات إلى الملف
async function writeAnalyses(analyses: DeepAnalysis[]): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(analyses, null, 2));
}

// GET - جلب التحليلات مع الفلترة
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analyses = await readAnalyses();
    
    // تطبيق الفلاتر
    let filteredAnalyses = [...analyses];
    
    // فلتر الحالة
    const status = searchParams.get('status') as AnalysisStatus;
    if (status) {
      filteredAnalyses = filteredAnalyses.filter(a => a.status === status);
    }
    
    // فلتر نوع المصدر
    const sourceType = searchParams.get('sourceType') as SourceType;
    if (sourceType) {
      filteredAnalyses = filteredAnalyses.filter(a => a.sourceType === sourceType);
    }
    
    // فلتر النشط فقط
    const activeOnly = searchParams.get('activeOnly') === 'true';
    if (activeOnly) {
      filteredAnalyses = filteredAnalyses.filter(a => a.isActive);
    }
    
    // فلتر المميز
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    if (featuredOnly) {
      filteredAnalyses = filteredAnalyses.filter(a => a.isFeatured);
    }
    
    // البحث النصي
    const search = searchParams.get('search');
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.summary.toLowerCase().includes(searchLower) ||
        a.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // فلتر التصنيف
    const category = searchParams.get('category');
    if (category) {
      filteredAnalyses = filteredAnalyses.filter(a => 
        a.categories.includes(category)
      );
    }
    
    // فلتر جودة المحتوى
    const minQuality = searchParams.get('minQuality');
    if (minQuality) {
      const minScore = parseFloat(minQuality);
      filteredAnalyses = filteredAnalyses.filter(a => a.qualityScore >= minScore);
    }
    
    // الترتيب
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    filteredAnalyses.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'publishedAt':
          aVal = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          bVal = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          break;
        case 'views':
          aVal = a.views;
          bVal = b.views;
          break;
        case 'qualityScore':
          aVal = a.qualityScore;
          bVal = b.qualityScore;
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // التصفح
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedAnalyses = filteredAnalyses.slice(startIndex, endIndex);
    
    return NextResponse.json({
      analyses: paginatedAnalyses,
      total: filteredAnalyses.length,
      page,
      limit,
      totalPages: Math.ceil(filteredAnalyses.length / limit)
    });
    
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

// POST - إنشاء تحليل جديد
export async function POST(request: NextRequest) {
  try {
    const body: CreateAnalysisRequest = await request.json();
    const analyses = await readAnalyses();
    
    // إنشاء ID فريد
    const id = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // إنشاء slug
    const slug = body.title
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + 
      '-' + Date.now();
    
    let analysisContent = null;
    let rawContent = '';
    let qualityScore = 0;
    let readingTime = 5;
    
    // إذا كان المطلوب توليد بـ GPT
    if (body.generateWithGPT) {
      // التحقق من وجود API key
      let gptApiKey = process.env.OPENAI_API_KEY;
      
      // إذا كان هناك مفتاح مرسل من الواجهة، استخدمه
      if (body.openaiApiKey && body.openaiApiKey.length > 10) {
        gptApiKey = body.openaiApiKey;
      }
      
      // تسجيل معلومات المفتاح للتشخيص
      console.log('Checking OpenAI API key for publishing...');
      console.log('Environment key exists:', !!process.env.OPENAI_API_KEY);
      console.log('Environment key length:', process.env.OPENAI_API_KEY?.length || 0);
      console.log('Request body key exists:', !!body.openaiApiKey);
      console.log('Request body key length:', body.openaiApiKey?.length || 0);
      console.log('Using key from:', body.openaiApiKey && body.openaiApiKey.length > 10 ? 'request body' : 'environment');
      
      if (!gptApiKey || gptApiKey.length < 10) {
        console.error('OpenAI API key validation failed');
        return NextResponse.json(
          { 
            error: 'OpenAI API key not configured or invalid',
            details: 'Please ensure you have a valid OpenAI API key in your settings or environment variables'
          },
          { status: 500 }
        );
      }
      
      try {
        // تهيئة OpenAI
        initializeOpenAI(gptApiKey);
        console.log('OpenAI initialized successfully');
      } catch (error) {
        console.error('Error initializing OpenAI:', error);
        return NextResponse.json(
          { error: 'Failed to initialize OpenAI client' },
          { status: 500 }
        );
      }
      
      // توليد التحليل
      const gptResponse = await generateDeepAnalysis({
        sourceType: body.creationType === 'from_article' ? 'article' : 
                    body.creationType === 'external_link' ? 'external' : 'topic',
        sourceId: body.sourceArticleId,
        externalUrl: body.externalLink,
        topic: body.title,
        category: body.categories[0],
        customPrompt: body.gptPrompt,
        language: 'ar',
        tone: 'professional',
        length: 'medium'
      });
      
      if (!gptResponse.success || !gptResponse.analysis) {
        return NextResponse.json(
          { error: gptResponse.error || 'Failed to generate analysis' },
          { status: 500 }
        );
      }
      
      analysisContent = gptResponse.analysis.content;
      qualityScore = gptResponse.analysis.qualityScore || 0;
      readingTime = gptResponse.analysis.estimatedReadingTime;
      
      // تحويل المحتوى إلى HTML للعرض في المحرر
      rawContent = convertSectionsToHTML(analysisContent.sections);
    } else {
      // إذا لم يكن توليد GPT، استخدم المحتوى المرسل
      rawContent = body.content || '';
      // حساب جودة المحتوى اليدوي
      qualityScore = 0; // يمكن إضافة منطق لحساب الجودة للمحتوى اليدوي
    }
    
    // إنشاء التحليل الجديد
    const newAnalysis: DeepAnalysis = {
      id,
      title: body.title,
      slug,
      summary: body.summary,
      content: analysisContent || {
        sections: [{
          id: 'section-1',
          title: 'المحتوى الرئيسي',
          content: rawContent,
          order: 1,
          type: 'text'
        }],
        tableOfContents: [],
        recommendations: [],
        keyInsights: [],
        dataPoints: []
      },
      rawContent: rawContent, // حفظ المحتوى الخام للعرض في المحرر
      featuredImage: body.featuredImage || null,
      categories: body.categories,
      tags: body.tags,
      authorId: undefined, // سيتم تحديده من الجلسة
      authorName: body.authorName || 'محرر سبق',
      sourceType: body.generateWithGPT ? 'gpt' : body.sourceType,
      creationType: body.creationType,
      analysisType: body.analysisType || 'manual',
      sourceArticleId: body.sourceArticleId,
      externalLink: body.externalLink,
      readingTime,
      qualityScore,
      contentScore: {
        overall: qualityScore,
        contentLength: rawContent.length,
        hasSections: true,
        hasData: false,
        hasRecommendations: false,
        readability: 0.7,
        uniqueness: 0.8
      },
      status: 'draft',
      isActive: true,
      isFeatured: false,
      displayPosition: 'middle',
      views: 0,
      likes: 0,
      shares: 0,
      saves: 0,
      commentsCount: 0,
      avgReadTime: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastGptUpdate: body.generateWithGPT ? new Date().toISOString() : undefined,
      metadata: {
        generatedByAI: body.generateWithGPT || false,
        aiModel: body.generateWithGPT ? 'gpt-4o' : undefined
      }
    };
    
    // إضافة التحليل الجديد
    analyses.unshift(newAnalysis);
    
    // حفظ التحليلات
    await writeAnalyses(analyses);
    
    return NextResponse.json(newAnalysis, { status: 201 });
    
  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to create analysis' },
      { status: 500 }
    );
  }
}

// دالة تحويل الأقسام إلى HTML
function convertSectionsToHTML(sections: any[]): string {
  if (!sections || sections.length === 0) return '';
  
  return sections.map(section => {
    return `<h2>${section.title}</h2>\n${section.content}`;
  }).join('\n\n');
} 