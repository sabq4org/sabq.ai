import vision from '@google-cloud/vision';

// إنشاء عميل Vision API
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
});

export interface VisionAnalysisResult {
  labels: Array<{
    description: string;
    score: number;
  }>;
  faces: Array<{
    confidence: number;
    emotions: {
      joy: string;
      sorrow: string;
      anger: string;
      surprise: string;
    };
  }>;
  text: {
    fullText: string;
    language?: string;
  };
  landmarks: Array<{
    description: string;
    score: number;
    locations: Array<{
      latitude: number;
      longitude: number;
    }>;
  }>;
  objects: Array<{
    name: string;
    score: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  safeSearch: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
  dominantColors: Array<{
    color: string;
    score: number;
    pixelFraction: number;
  }>;
}

export async function analyzeImage(imageUrl: string): Promise<VisionAnalysisResult> {
  try {
    // تحليل الصورة باستخدام Vision API
    const [result] = await client.annotateImage({
      image: {
        source: {
          imageUri: imageUrl,
        },
      },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'FACE_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION' },
        { type: 'LANDMARK_DETECTION', maxResults: 5 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'IMAGE_PROPERTIES' },
      ],
    });

    // معالجة النتائج
    const analysis: VisionAnalysisResult = {
      labels: [],
      faces: [],
      text: { fullText: '' },
      landmarks: [],
      objects: [],
      safeSearch: {
        adult: 'UNKNOWN',
        spoof: 'UNKNOWN',
        medical: 'UNKNOWN',
        violence: 'UNKNOWN',
        racy: 'UNKNOWN',
      },
      dominantColors: [],
    };

    // معالجة التسميات
    if (result.labelAnnotations) {
      analysis.labels = result.labelAnnotations.map(label => ({
        description: label.description || '',
        score: label.score || 0,
      }));
    }

    // معالجة الوجوه
    if (result.faceAnnotations) {
      analysis.faces = result.faceAnnotations.map(face => ({
        confidence: face.detectionConfidence || 0,
        emotions: {
          joy: String(face.joyLikelihood || 'UNKNOWN'),
          sorrow: String(face.sorrowLikelihood || 'UNKNOWN'),
          anger: String(face.angerLikelihood || 'UNKNOWN'),
          surprise: String(face.surpriseLikelihood || 'UNKNOWN'),
        },
      }));
    }

    // معالجة النص
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      analysis.text = {
        fullText: result.textAnnotations[0].description || '',
        language: result.textAnnotations[0].locale || undefined,
      };
    }

    // معالجة المعالم
    if (result.landmarkAnnotations) {
      analysis.landmarks = result.landmarkAnnotations.map(landmark => ({
        description: landmark.description || '',
        score: landmark.score || 0,
        locations: landmark.locations?.map(loc => ({
          latitude: loc.latLng?.latitude || 0,
          longitude: loc.latLng?.longitude || 0,
        })) || [],
      }));
    }

    // معالجة الكائنات
    if (result.localizedObjectAnnotations) {
      analysis.objects = result.localizedObjectAnnotations.map(obj => ({
        name: obj.name || '',
        score: obj.score || 0,
        boundingBox: obj.boundingPoly?.normalizedVertices?.[0] ? {
          x: obj.boundingPoly.normalizedVertices[0].x || 0,
          y: obj.boundingPoly.normalizedVertices[0].y || 0,
          width: (obj.boundingPoly.normalizedVertices[2]?.x || 0) - (obj.boundingPoly.normalizedVertices[0]?.x || 0),
          height: (obj.boundingPoly.normalizedVertices[2]?.y || 0) - (obj.boundingPoly.normalizedVertices[0]?.y || 0),
        } : undefined,
      }));
    }

    // معالجة البحث الآمن
    if (result.safeSearchAnnotation) {
      analysis.safeSearch = {
        adult: String(result.safeSearchAnnotation.adult || 'UNKNOWN'),
        spoof: String(result.safeSearchAnnotation.spoof || 'UNKNOWN'),
        medical: String(result.safeSearchAnnotation.medical || 'UNKNOWN'),
        violence: String(result.safeSearchAnnotation.violence || 'UNKNOWN'),
        racy: String(result.safeSearchAnnotation.racy || 'UNKNOWN'),
      };
    }

    // معالجة الألوان السائدة
    if (result.imagePropertiesAnnotation?.dominantColors?.colors) {
      analysis.dominantColors = result.imagePropertiesAnnotation.dominantColors.colors.map(color => ({
        color: `rgb(${color.color?.red || 0}, ${color.color?.green || 0}, ${color.color?.blue || 0})`,
        score: color.score || 0,
        pixelFraction: color.pixelFraction || 0,
      }));
    }

    return analysis;
  } catch (error) {
    console.error('خطأ في تحليل الصورة:', error);
    throw error;
  }
}

// دالة لاستخراج الكيانات السعودية من التحليل
export function extractSaudiEntities(analysis: VisionAnalysisResult): {
  people: string[];
  places: string[];
  organizations: string[];
  events: string[];
} {
  const entities = {
    people: [] as string[],
    places: [] as string[],
    organizations: [] as string[],
    events: [] as string[],
  };

  // قائمة بالكلمات المفتاحية السعودية
  const saudiKeywords = {
    people: ['الملك', 'الأمير', 'ولي العهد', 'الوزير', 'السفير'],
    places: ['الرياض', 'جدة', 'مكة', 'المدينة', 'الدمام', 'الحرم', 'الكعبة'],
    organizations: ['أرامكو', 'سابك', 'الاتصالات السعودية', 'البنك الأهلي', 'الراجحي'],
    events: ['موسم الرياض', 'موسم جدة', 'الحج', 'العمرة', 'اليوم الوطني'],
  };

  // تحليل النص المستخرج
  const text = analysis.text.fullText.toLowerCase();
  
  // البحث عن الكيانات في النص
  for (const [category, keywords] of Object.entries(saudiKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        entities[category as keyof typeof entities].push(keyword);
      }
    }
  }

  // تحليل التسميات للبحث عن كيانات
  for (const label of analysis.labels) {
    const labelText = label.description.toLowerCase();
    
    // التحقق من المعالم السعودية
    if (labelText.includes('mosque') || labelText.includes('مسجد')) {
      entities.places.push('مسجد');
    }
    
    // التحقق من الأحداث
    if (labelText.includes('celebration') || labelText.includes('احتفال')) {
      entities.events.push('احتفال');
    }
  }

  // إزالة التكرارات
  for (const key in entities) {
    entities[key as keyof typeof entities] = [...new Set(entities[key as keyof typeof entities])];
  }

  return entities;
}

// دالة لتحليل الصورة وحفظ النتائج
export async function analyzeAndSaveImage(
  imageUrl: string,
  mediaFileId: string,
  prisma: any
): Promise<void> {
  try {
    // تحليل الصورة
    const analysis = await analyzeImage(imageUrl);
    
    // استخراج الكيانات السعودية
    const saudiEntities = extractSaudiEntities(analysis);
    
    // إنشاء قائمة بالعلامات
    const tags = [
      ...analysis.labels.filter(l => l.score > 0.7).map(l => l.description),
      ...saudiEntities.people.map(p => `شخص: ${p}`),
      ...saudiEntities.places.map(p => `مكان: ${p}`),
      ...saudiEntities.organizations.map(o => `منظمة: ${o}`),
      ...saudiEntities.events.map(e => `حدث: ${e}`),
    ];
    
    // تحديد التصنيف بناءً على التحليل
    let classification = 'عام';
    if (saudiEntities.people.length > 0) classification = 'شخصيات';
    else if (saudiEntities.places.length > 0) classification = 'أماكن';
    else if (saudiEntities.organizations.length > 0) classification = 'مؤسسات';
    else if (saudiEntities.events.length > 0) classification = 'أحداث';
    
    // تحديث سجل الوسائط
    await prisma.mediaFile.update({
      where: { id: mediaFileId },
      data: {
        tags,
        classification,
        aiEntities: saudiEntities,
        aiAnalysis: analysis,
      },
    });
    
    console.log(`✅ تم تحليل الصورة ${mediaFileId} بنجاح`);
  } catch (error) {
    console.error(`❌ فشل تحليل الصورة ${mediaFileId}:`, error);
  }
} 