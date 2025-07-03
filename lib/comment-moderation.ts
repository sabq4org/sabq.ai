// كلمات محظورة محلياً للفحص السريع
const BANNED_WORDS = [
  // إهانات شخصية
  'غبي', 'أحمق', 'حقير', 'كلب', 'خنزير', 'قذر', 'عاهر',
  'لعين', 'ملعون', 'كافر', 'زنديق', 'منافق', 'خائن',
  'حمار', 'بهيمة', 'وسخ', 'نجس', 'قرد', 'حيوان',
  'سخيف', 'تافه', 'سفيه', 'مجنون', 'معتوه', 'أبله',
  'كاذب', 'كذاب', 'دجال', 'محتال', 'نصاب', 'مخادع',
  'حرامي', 'لص', 'سارق', 'مجرم', 'فاسد', 'مرتشي',
  'جبان', 'خسيس', 'دنيء', 'رخيص', 'حشرة', 'جرذ',
  // كلمات نابية
  'تبا', 'اللعنة', 'يلعن', 'زفت', 'خرا', 'زبالة',
  'قرف', 'مقرف', 'وقح', 'وقاحة', 'بذيء',
  // تهديدات
  'سأقتلك', 'موت', 'اذبحك', 'اضربك', 'انتقم',
  'سأدمرك', 'احذر', 'ستندم', 'سأريك',
  // عنصرية وطائفية
  'عبد', 'زنجي', 'رافضي', 'ناصبي', 'مجوسي',
  'كفار', 'مرتد', 'صليبي', 'يهودي', 'صهيوني'
];

export interface AnalysisResult {
  score: number;
  classification: 'safe' | 'questionable' | 'suspicious' | 'toxic';
  suggestedAction: 'approve' | 'review' | 'reject';
  flaggedWords: string[];
  confidence: number;
  categories?: {
    toxicity?: number;
    threat?: number;
    harassment?: number;
    spam?: number;
    hate?: number;
  };
  reason?: string;
}

// تحليل محلي سريع
export function quickLocalAnalysis(text: string): AnalysisResult {
  const lowerText = text.toLowerCase();
  let score = 100;
  let flaggedWords: string[] = [];
  let reasons: string[] = [];
  
  // فحص الكلمات المحظورة
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      score -= 30;
      flaggedWords.push(word);
      if (!reasons.includes('كلمات مسيئة')) {
        reasons.push('كلمات مسيئة');
      }
    }
  }
  
  // فحص الأنماط المشبوهة
  if (lowerText.includes('http://') || lowerText.includes('https://')) {
    score -= 10; // روابط
    reasons.push('يحتوي على روابط');
  }
  
  if ((text.match(/!/g) || []).length > 3) {
    score -= 10; // علامات تعجب كثيرة
    reasons.push('علامات تعجب مفرطة');
  }
  
  if ((text.match(/\?/g) || []).length > 3) {
    score -= 10; // علامات استفهام كثيرة
    reasons.push('علامات استفهام مفرطة');
  }
  
  if (text.length < 10) {
    score -= 20; // تعليق قصير جداً
    reasons.push('تعليق قصير جداً');
  }
  
  if (/(.)\1{4,}/.test(text)) {
    score -= 20; // تكرار حروف
    reasons.push('تكرار مفرط للأحرف');
  }
  
  // فحص الكلمات بالإنجليزية
  const englishProfanity = ['fuck', 'shit', 'bitch', 'ass', 'damn'];
  for (const word of englishProfanity) {
    if (lowerText.includes(word)) {
      score -= 25;
      flaggedWords.push(word);
      if (!reasons.includes('كلمات نابية بالإنجليزية')) {
        reasons.push('كلمات نابية بالإنجليزية');
      }
    }
  }
  
  // تحديد التصنيف
  let classification: AnalysisResult['classification'] = 'safe';
  let suggestedAction: AnalysisResult['suggestedAction'] = 'approve';
  
  if (score < 20) {
    classification = 'toxic';
    suggestedAction = 'reject';
  } else if (score < 50) {
    classification = 'suspicious';
    suggestedAction = 'review';
  } else if (score < 80) {
    classification = 'questionable';
    suggestedAction = 'review';
  }
  
  return {
    score: Math.max(0, score),
    classification,
    suggestedAction,
    flaggedWords,
    confidence: 0.7, // ثقة متوسطة للتحليل المحلي
    reason: reasons.length > 0 ? reasons.join('، ') : undefined
  };
} 