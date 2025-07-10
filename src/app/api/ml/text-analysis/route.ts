/**
 * API تحليل النصوص العربية - Sabq AI CMS
 * يوفر تحليل شامل للنصوص باستخدام الذكاء الاصطناعي ومعالجة اللغة الطبيعية
 * 
 * @author Sabq AI Team
 * @date 2024-01-20
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { validatePermission } from '@/lib/permissions';
import { rateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit-log';
import { arabicTextProcessor } from '@/lib/arabic-text-processor';
import { sentimentAnalyzer } from '@/lib/sentiment-analyzer';
import { keywordExtractor } from '@/lib/keyword-extractor';
import { entityRecognizer } from '@/lib/entity-recognizer';
import { readabilityAnalyzer } from '@/lib/readability-analyzer';
import { toxicityDetector } from '@/lib/toxicity-detector';
import { plagiarismDetector } from '@/lib/plagiarism-detector';
import { topicModeling } from '@/lib/topic-modeling';
import { textSummarizer } from '@/lib/text-summarizer';
import { languageDetector } from '@/lib/language-detector';

// Schema للتحقق من صحة البيانات
const textAnalysisSchema = z.object({
  text: z.string().min(1, 'النص مطلوب').max(100000, 'النص طويل جداً'),
  analysisTypes: z.array(z.enum([
    'sentiment',
    'keywords',
    'entities',
    'readability',
    'toxicity',
    'plagiarism',
    'topics',
    'summary',
    'language',
    'statistics',
    'seo',
    'emotions',
    'complexity',
    'all',
  ])).optional().default(['all']),
  language: z.enum(['ar', 'en', 'auto']).optional().default('auto'),
  options: z.object({
    // خيارات تحليل المشاعر
    sentiment: z.object({
      model: z.enum(['traditional', 'transformer', 'hybrid']).optional().default('hybrid'),
      includeEmotions: z.boolean().optional().default(true),
      confidenceThreshold: z.number().min(0).max(1).optional().default(0.7),
    }).optional(),
    
    // خيارات استخراج الكلمات المفتاحية
    keywords: z.object({
      method: z.enum(['tfidf', 'textrank', 'yake', 'hybrid']).optional().default('hybrid'),
      maxKeywords: z.number().min(1).max(50).optional().default(10),
      minLength: z.number().min(1).optional().default(2),
      includeNgrams: z.boolean().optional().default(true),
      ngramRange: z.tuple([z.number(), z.number()]).optional().default([1, 3]),
    }).optional(),
    
    // خيارات التعرف على الكيانات
    entities: z.object({
      types: z.array(z.enum([
        'PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'TIME', 
        'MONEY', 'PERCENTAGE', 'PRODUCT', 'EVENT', 'MISC'
      ])).optional(),
      confidenceThreshold: z.number().min(0).max(1).optional().default(0.8),
      includePositions: z.boolean().optional().default(true),
    }).optional(),
    
    // خيارات تحليل القابلية للقراءة
    readability: z.object({
      metrics: z.array(z.enum([
        'flesch_reading_ease', 'automated_readability_index',
        'coleman_liau_index', 'gunning_fog', 'smog_index',
        'arabic_readability_index'
      ])).optional(),
      targetAudience: z.enum(['elementary', 'middle', 'high', 'college', 'graduate']).optional(),
    }).optional(),
    
    // خيارات كشف السمية
    toxicity: z.object({
      categories: z.array(z.enum([
        'toxicity', 'severe_toxicity', 'identity_attack',
        'insult', 'profanity', 'threat', 'hate_speech'
      ])).optional(),
      threshold: z.number().min(0).max(1).optional().default(0.7),
    }).optional(),
    
    // خيارات كشف الانتحال
    plagiarism: z.object({
      sources: z.array(z.enum(['web', 'database', 'articles'])).optional().default(['database']),
      similarityThreshold: z.number().min(0).max(1).optional().default(0.8),
      checkSentences: z.boolean().optional().default(true),
    }).optional(),
    
    // خيارات نمذجة الموضوعات
    topics: z.object({
      numTopics: z.number().min(1).max(20).optional().default(5),
      method: z.enum(['lda', 'nmf', 'bertopic']).optional().default('lda'),
      includeCoherence: z.boolean().optional().default(true),
    }).optional(),
    
    // خيارات التلخيص
    summary: z.object({
      method: z.enum(['extractive', 'abstractive', 'hybrid']).optional().default('extractive'),
      ratio: z.number().min(0.1).max(0.5).optional().default(0.3),
      maxSentences: z.number().min(1).max(10).optional().default(3),
    }).optional(),
  }).optional(),
  context: z.object({
    articleId: z.string().uuid().optional(),
    authorId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    purpose: z.enum(['analysis', 'moderation', 'seo', 'quality_check']).optional().default('analysis'),
  }).optional(),
  saveResults: z.boolean().optional().default(false),
});

// Types للاستجابة
interface TextAnalysisResponse {
  success: boolean;
  message: string;
  data?: {
    analysisId: string;
    text: {
      original: string;
      processed: string;
      length: number;
      wordCount: number;
      sentenceCount: number;
      paragraphCount: number;
    };
    language: {
      detected: string;
      confidence: number;
      alternatives: Array<{
        language: string;
        confidence: number;
      }>;
    };
    sentiment: {
      overall: {
        polarity: string;
        score: number;
        confidence: number;
      };
      emotions: Record<string, number>;
      sentenceLevel: Array<{
        sentence: string;
        polarity: string;
        score: number;
        emotions: Record<string, number>;
      }>;
    };
    keywords: Array<{
      word: string;
      score: number;
      frequency: number;
      positions: number[];
      type: string;
    }>;
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
      startPos: number;
      endPos: number;
      normalizedValue?: string;
    }>;
    readability: {
      scores: Record<string, number>;
      level: string;
      suggestions: string[];
      complexity: string;
    };
    toxicity: {
      isToxic: boolean;
      overallScore: number;
      categories: Record<string, number>;
      flaggedSentences: Array<{
        sentence: string;
        score: number;
        categories: string[];
      }>;
    };
    plagiarism: {
      isPlagiarized: boolean;
      overallSimilarity: number;
      sources: Array<{
        source: string;
        similarity: number;
        matchedText: string;
        url?: string;
      }>;
      suspiciousSentences: Array<{
        sentence: string;
        similarity: number;
        potentialSource: string;
      }>;
    };
    topics: Array<{
      id: number;
      words: Array<{
        word: string;
        weight: number;
      }>;
      coherence: number;
      description: string;
    }>;
    summary: {
      extractive: string[];
      abstractive?: string;
      keyPoints: string[];
      mainIdea: string;
    };
    statistics: {
      averageWordsPerSentence: number;
      averageSentencesPerParagraph: number;
      lexicalDiversity: number;
      typeTokenRatio: number;
      mostFrequentWords: Array<{
        word: string;
        frequency: number;
      }>;
      characterDistribution: Record<string, number>;
    };
    seo: {
      score: number;
      recommendations: string[];
      keywordDensity: Record<string, number>;
      headingStructure: Array<{
        level: number;
        text: string;
        optimization: string;
      }>;
      metaDescription: string;
      suggestedTags: string[];
    };
    quality: {
      overallScore: number;
      dimensions: {
        clarity: number;
        coherence: number;
        engagement: number;
        accuracy: number;
        completeness: number;
      };
      suggestions: string[];
    };
    metadata: {
      analysisTypes: string[];
      processingTime: number;
      modelVersions: Record<string, string>;
      confidence: number;
      timestamp: string;
    };
  };
  errors?: Record<string, string>;
}

/**
 * POST /api/ml/text-analysis
 * تحليل النص باستخدام الذكاء الاصطناعي
 */
export async function POST(request: NextRequest): Promise<NextResponse<TextAnalysisResponse>> {
  const startTime = Date.now();
  
  try {
    const clientIp = request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<TextAnalysisResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // التحقق من الأذونات
    if (!await validatePermission(user, 'ML_TEXT_ANALYSIS')) {
      return NextResponse.json<TextAnalysisResponse>({
        success: false,
        message: 'غير مصرح لك باستخدام تحليل النصوص',
        errors: { permission: 'access_denied' },
      }, { status: 403 });
    }

    // التحقق من حد الطلبات
    const rateLimitResult = await rateLimit({
      key: `text_analysis:${user.id}`,
      limit: 20,
      window: 60 * 1000, // دقيقة واحدة
    });

    if (!rateLimitResult.success) {
      return NextResponse.json<TextAnalysisResponse>({
        success: false,
        message: 'تم تجاوز حد تحليل النصوص المسموح',
        errors: { rate_limit: 'too_many_requests' },
      }, { status: 429 });
    }

    // قراءة وتحليل البيانات
    const body = await request.json();
    const validationResult = textAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<TextAnalysisResponse>({
        success: false,
        message: 'بيانات تحليل النص غير صحيحة',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const analysisRequest = validationResult.data;

    // إنشاء معرف فريد للتحليل
    const analysisId = crypto.randomUUID();

    // معالجة النص المبدئية
    const processedText = await arabicTextProcessor.preprocess(
      analysisRequest.text,
      {
        normalizeDiacritics: true,
        removeExtraSpaces: true,
        fixArabicText: true,
        preserveStructure: true,
      }
    );

    // كشف اللغة
    const languageResult = await languageDetector.detect(analysisRequest.text);

    // تحديد اللغة المستخدمة في التحليل
    const detectedLanguage = analysisRequest.language === 'auto' 
      ? languageResult.detected 
      : analysisRequest.language;

    // تنفيذ التحليلات المختلفة
    const analysisResults = await runAnalysis(
      analysisRequest.text,
      processedText.processed,
      detectedLanguage,
      analysisRequest.analysisTypes,
      analysisRequest.options || {}
    );

    // حساب النص الإحصائي
    const textStatistics = calculateTextStatistics(analysisRequest.text);

    // تقييم الجودة الإجمالية
    const qualityAssessment = await assessTextQuality(analysisResults, textStatistics);

    // تحضير البيانات للاستجابة
    const responseData = {
      analysisId,
      text: {
        original: analysisRequest.text,
        processed: processedText.processed,
        length: analysisRequest.text.length,
        wordCount: textStatistics.wordCount,
        sentenceCount: textStatistics.sentenceCount,
        paragraphCount: textStatistics.paragraphCount,
      },
      language: languageResult,
      ...analysisResults,
      statistics: textStatistics,
      quality: qualityAssessment,
      metadata: {
        analysisTypes: analysisRequest.analysisTypes,
        processingTime: Date.now() - startTime,
        modelVersions: await getModelVersions(),
        confidence: calculateOverallConfidence(analysisResults),
        timestamp: new Date().toISOString(),
      },
    };

    // حفظ النتائج إذا طُلب ذلك
    if (analysisRequest.saveResults) {
      await saveAnalysisResults(analysisId, user.id, analysisRequest, responseData);
    }

    // إنشاء سجل تدقيق
    await createAuditLog({
      action: 'ML_TEXT_ANALYSIS_PERFORMED',
      userId: user.id,
      ipAddress: clientIp,
      userAgent,
      details: {
        analysisId,
        analysisTypes: analysisRequest.analysisTypes,
        textLength: analysisRequest.text.length,
        language: detectedLanguage,
        processingTime: Date.now() - startTime,
        saveResults: analysisRequest.saveResults,
      },
    });

    return NextResponse.json<TextAnalysisResponse>({
      success: true,
      message: 'تم تحليل النص بنجاح',
      data: responseData,
    });

  } catch (error) {
    console.error('خطأ في تحليل النص:', error);

    return NextResponse.json<TextAnalysisResponse>({
      success: false,
      message: 'حدث خطأ أثناء تحليل النص',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

/**
 * GET /api/ml/text-analysis
 * جلب نتائج التحليلات السابقة
 */
export async function GET(request: NextRequest): Promise<NextResponse<TextAnalysisResponse>> {
  try {
    // التحقق من المصادقة
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json<TextAnalysisResponse>({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
        errors: { auth: 'authentication_required' },
      }, { status: 401 });
    }

    // قراءة معاملات الاستعلام
    const searchParams = request.nextUrl.searchParams;
    const analysisId = searchParams.get('analysis_id');
    const articleId = searchParams.get('article_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    let analyses = [];

    if (analysisId) {
      // جلب تحليل محدد
      const analysis = await prisma.textAnalysis.findFirst({
        where: {
          id: analysisId,
          userId: user.id,
        },
      });

      if (analysis) {
        analyses = [analysis];
      }
    } else if (articleId) {
      // جلب تحليلات مقال محدد
      analyses = await prisma.textAnalysis.findMany({
        where: {
          articleId,
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    } else {
      // جلب أحدث التحليلات
      analyses = await prisma.textAnalysis.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    }

    if (analyses.length === 0) {
      return NextResponse.json<TextAnalysisResponse>({
        success: false,
        message: 'لا توجد نتائج تحليل',
        errors: { analysis: 'no_results_found' },
      }, { status: 404 });
    }

    // إرجاع النتيجة الأولى (أو الوحيدة)
    const latestAnalysis = analyses[0];

    return NextResponse.json<TextAnalysisResponse>({
      success: true,
      message: 'تم جلب نتائج التحليل بنجاح',
      data: latestAnalysis.results,
    });

  } catch (error) {
    console.error('خطأ في جلب نتائج التحليل:', error);

    return NextResponse.json<TextAnalysisResponse>({
      success: false,
      message: 'حدث خطأ أثناء جلب نتائج التحليل',
      errors: { general: 'internal_server_error' },
    }, { status: 500 });
  }
}

// Helper Functions

/**
 * تنفيذ التحليلات المختلفة
 */
async function runAnalysis(
  originalText: string,
  processedText: string,
  language: string,
  analysisTypes: string[],
  options: any
): Promise<any> {
  const results: any = {};

  // تحليل المشاعر
  if (shouldRunAnalysis(analysisTypes, 'sentiment')) {
    results.sentiment = await sentimentAnalyzer.analyze(
      processedText,
      language,
      options.sentiment || {}
    );
  }

  // استخراج الكلمات المفتاحية
  if (shouldRunAnalysis(analysisTypes, 'keywords')) {
    results.keywords = await keywordExtractor.extract(
      processedText,
      language,
      options.keywords || {}
    );
  }

  // التعرف على الكيانات
  if (shouldRunAnalysis(analysisTypes, 'entities')) {
    results.entities = await entityRecognizer.recognize(
      originalText,
      language,
      options.entities || {}
    );
  }

  // تحليل القابلية للقراءة
  if (shouldRunAnalysis(analysisTypes, 'readability')) {
    results.readability = await readabilityAnalyzer.analyze(
      processedText,
      language,
      options.readability || {}
    );
  }

  // كشف السمية
  if (shouldRunAnalysis(analysisTypes, 'toxicity')) {
    results.toxicity = await toxicityDetector.detect(
      originalText,
      language,
      options.toxicity || {}
    );
  }

  // كشف الانتحال
  if (shouldRunAnalysis(analysisTypes, 'plagiarism')) {
    results.plagiarism = await plagiarismDetector.check(
      originalText,
      options.plagiarism || {}
    );
  }

  // نمذجة الموضوعات
  if (shouldRunAnalysis(analysisTypes, 'topics')) {
    results.topics = await topicModeling.analyze(
      processedText,
      language,
      options.topics || {}
    );
  }

  // التلخيص
  if (shouldRunAnalysis(analysisTypes, 'summary')) {
    results.summary = await textSummarizer.summarize(
      originalText,
      language,
      options.summary || {}
    );
  }

  // تحليل SEO
  if (shouldRunAnalysis(analysisTypes, 'seo')) {
    results.seo = await analyzeSEO(originalText, results.keywords || []);
  }

  return results;
}

/**
 * فحص ما إذا كان يجب تشغيل تحليل معين
 */
function shouldRunAnalysis(analysisTypes: string[], analysisType: string): boolean {
  return analysisTypes.includes('all') || analysisTypes.includes(analysisType);
}

/**
 * حساب الإحصائيات النصية
 */
function calculateTextStatistics(text: string): any {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);

  // حساب التنوع المعجمي
  const uniqueWords = new Set(words.map(word => word.toLowerCase()));
  const lexicalDiversity = uniqueWords.size / words.length;
  const typeTokenRatio = uniqueWords.size / words.length;

  // حساب تكرار الكلمات
  const wordFrequency = words.reduce((freq, word) => {
    const normalizedWord = word.toLowerCase();
    freq[normalizedWord] = (freq[normalizedWord] || 0) + 1;
    return freq;
  }, {} as Record<string, number>);

  const mostFrequentWords = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, frequency]) => ({ word, frequency }));

  // توزيع الأحرف
  const characterDistribution = text.split('').reduce((dist, char) => {
    if (char.match(/[أ-ي]/)) {
      dist['arabic'] = (dist['arabic'] || 0) + 1;
    } else if (char.match(/[a-zA-Z]/)) {
      dist['english'] = (dist['english'] || 0) + 1;
    } else if (char.match(/[0-9]/)) {
      dist['numbers'] = (dist['numbers'] || 0) + 1;
    } else if (char.match(/\s/)) {
      dist['spaces'] = (dist['spaces'] || 0) + 1;
    } else {
      dist['punctuation'] = (dist['punctuation'] || 0) + 1;
    }
    return dist;
  }, {} as Record<string, number>);

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageWordsPerSentence: words.length / sentences.length || 0,
    averageSentencesPerParagraph: sentences.length / paragraphs.length || 0,
    lexicalDiversity,
    typeTokenRatio,
    mostFrequentWords,
    characterDistribution,
  };
}

/**
 * تقييم جودة النص
 */
async function assessTextQuality(analysisResults: any, textStatistics: any): Promise<any> {
  let overallScore = 0;
  const dimensions = {
    clarity: 0,
    coherence: 0,
    engagement: 0,
    accuracy: 0,
    completeness: 0,
  };

  // تقييم الوضوح
  if (analysisResults.readability) {
    dimensions.clarity = Math.min(100, analysisResults.readability.scores.arabic_readability_index || 50);
  }

  // تقييم التماسك
  if (analysisResults.topics) {
    const avgCoherence = analysisResults.topics.reduce((sum, topic) => sum + topic.coherence, 0) / analysisResults.topics.length;
    dimensions.coherence = avgCoherence * 100;
  }

  // تقييم الجاذبية
  if (analysisResults.sentiment) {
    dimensions.engagement = Math.abs(analysisResults.sentiment.overall.score) * 100;
  }

  // تقييم الدقة
  if (analysisResults.toxicity) {
    dimensions.accuracy = (1 - analysisResults.toxicity.overallScore) * 100;
  }

  // تقييم الشمولية
  dimensions.completeness = Math.min(100, (textStatistics.wordCount / 100) * 10);

  // حساب النتيجة الإجمالية
  overallScore = Object.values(dimensions).reduce((sum, score) => sum + score, 0) / 5;

  const suggestions = [];
  if (dimensions.clarity < 60) {
    suggestions.push('حسن وضوح النص باستخدام جمل أبسط وأقصر');
  }
  if (dimensions.coherence < 50) {
    suggestions.push('اربط الأفكار بشكل أفضل واستخدم كلمات ربط مناسبة');
  }
  if (dimensions.engagement < 40) {
    suggestions.push('اجعل النص أكثر حيوية وإثارة للاهتمام');
  }
  if (dimensions.accuracy < 70) {
    suggestions.push('راجع النص للتأكد من عدم وجود محتوى غير لائق');
  }
  if (dimensions.completeness < 50) {
    suggestions.push('أضف المزيد من التفاصيل لتحسين شمولية المحتوى');
  }

  return {
    overallScore: Math.round(overallScore),
    dimensions: Object.fromEntries(
      Object.entries(dimensions).map(([key, value]) => [key, Math.round(value)])
    ),
    suggestions,
  };
}

/**
 * تحليل SEO
 */
async function analyzeSEO(text: string, keywords: any[]): Promise<any> {
  const wordCount = text.split(/\s+/).length;
  let score = 0;
  const recommendations = [];
  
  // حساب كثافة الكلمات المفتاحية
  const keywordDensity = keywords.reduce((density, keyword) => {
    const frequency = keyword.frequency;
    density[keyword.word] = (frequency / wordCount) * 100;
    return density;
  }, {} as Record<string, number>);

  // فحص طول النص
  if (wordCount >= 300) {
    score += 20;
  } else {
    recommendations.push('زيادة طول النص إلى 300 كلمة على الأقل');
  }

  // فحص كثافة الكلمات المفتاحية
  const avgDensity = Object.values(keywordDensity).reduce((sum, density) => sum + density, 0) / keywords.length;
  if (avgDensity >= 1 && avgDensity <= 3) {
    score += 20;
  } else {
    recommendations.push('تحسين كثافة الكلمات المفتاحية (1-3%)');
  }

  // فحص بنية العناوين
  const headings = text.match(/^#{1,6}.+$/gm) || [];
  const headingStructure = headings.map((heading, index) => {
    const level = (heading.match(/^#{1,6}/) || [''])[0].length;
    return {
      level,
      text: heading.replace(/^#{1,6}\s*/, ''),
      optimization: level === 1 ? 'ممتاز' : level <= 3 ? 'جيد' : 'يحتاج تحسين',
    };
  });

  if (headings.length > 0) {
    score += 20;
  } else {
    recommendations.push('إضافة عناوين فرعية لتحسين بنية المحتوى');
  }

  // إنشاء وصف meta
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const metaDescription = sentences.slice(0, 2).join('. ').substring(0, 160) + '...';

  // اقتراح الكلمات المفتاحية للتصنيف
  const suggestedTags = keywords
    .slice(0, 5)
    .map(keyword => keyword.word);

  score += 40; // نقاط إضافية للاكتمال

  return {
    score: Math.min(100, score),
    recommendations,
    keywordDensity,
    headingStructure,
    metaDescription,
    suggestedTags,
  };
}

/**
 * حساب الثقة الإجمالية
 */
function calculateOverallConfidence(results: any): number {
  const confidenceValues = [];

  if (results.sentiment?.overall?.confidence) {
    confidenceValues.push(results.sentiment.overall.confidence);
  }
  if (results.entities) {
    const avgEntityConfidence = results.entities.reduce((sum, entity) => sum + entity.confidence, 0) / results.entities.length;
    confidenceValues.push(avgEntityConfidence);
  }
  if (results.language?.confidence) {
    confidenceValues.push(results.language.confidence);
  }

  return confidenceValues.length > 0
    ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
    : 0.8; // قيمة افتراضية
}

/**
 * جلب إصدارات النماذج
 */
async function getModelVersions(): Promise<Record<string, string>> {
  return {
    sentiment: '2024.1.0',
    keywords: '2024.1.0',
    entities: '2024.1.0',
    readability: '2024.1.0',
    toxicity: '2024.1.0',
    plagiarism: '2024.1.0',
    topics: '2024.1.0',
    summary: '2024.1.0',
  };
}

/**
 * حفظ نتائج التحليل
 */
async function saveAnalysisResults(
  analysisId: string,
  userId: string,
  request: any,
  results: any
): Promise<void> {
  try {
    await prisma.textAnalysis.create({
      data: {
        id: analysisId,
        userId,
        text: request.text,
        analysisTypes: request.analysisTypes,
        language: results.language.detected,
        results: results,
        articleId: request.context?.articleId,
        purpose: request.context?.purpose || 'analysis',
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('خطأ في حفظ نتائج التحليل:', error);
  }
} 