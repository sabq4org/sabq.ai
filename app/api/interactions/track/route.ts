import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { recordInteraction } from '@/lib/user-interactions';
import { PrismaClient } from '@/lib/generated/prisma';

export const runtime = 'nodejs';

interface UserInteraction {
  id: string;
  user_id: string;
  article_id: string;
  interaction_type: 'view' | 'read' | 'like' | 'unlike' | 'share' | 'comment' | 'save' | 'unsave';
  category_id?: number;
  duration?: number;
  scroll_percentage?: number;
  platform?: string;
  source?: string;
  device_type?: string;
  session_id?: string;
  timestamp: string;
}

interface InteractionData {
  user_id: string;
  article_id: string;
  action: 'read' | 'like' | 'share' | 'comment';
  duration?: number;
  timestamp: string;
}

interface UserPreference {
  user_id: string;
  preferences: Record<string, number>;
  last_updated: string;
}

interface Article {
  id: string;
  category_id: string;
  title: string;
}

interface LoyaltyPoints {
  user_id: string;
  points: number;
  history: Array<{
    action: string;
    points: number;
    timestamp: string;
    article_id?: string;
  }>;
}

// نقاط المكافآت لكل تفاعل
const POINTS_CONFIG = {
  read: 2,
  like: 3,
  share: 5,
  comment: 10
};

// الحد الأدنى لمدة القراءة (بالثواني)
const MIN_READ_DURATION = 10;

// نظام النقاط
const POINTS_SYSTEM = {
  view: 1,
  read: 5,
  like: 10,
  share: 15,
  comment: 20,
  save: 10
};

const prisma = new PrismaClient();

// دالة لتحميل التفاعلات
async function loadInteractions() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.interactions || [];
  } catch (error) {
    console.error('Error loading interactions:', error);
    return [];
  }
}

// دالة لحفظ التفاعلات
async function saveInteractions(interactions: any[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
    const data = { interactions, updated_at: new Date().toISOString() };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving interactions:', error);
    return false;
  }
}

// دالة لتحديث نقاط المستخدم
async function updateUserLoyaltyPoints(userId: string, points: number) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');
    let loyaltyData: { users: any[] } = { users: [] };
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      loyaltyData = JSON.parse(fileContent);
    } catch (error) {
      // ملف غير موجود، سيتم إنشاؤه
    }
    
    // البحث عن المستخدم أو إنشاء سجل جديد
    let userRecord = loyaltyData.users.find((u: any) => u.user_id === userId);
    
    if (!userRecord) {
      userRecord = {
        user_id: userId,
        total_points: 0,
        earned_points: 0,
        redeemed_points: 0,
        tier: 'bronze',
        created_at: new Date().toISOString()
      };
      loyaltyData.users.push(userRecord);
    }
    
    // تحديث النقاط
    userRecord.total_points += points;
    userRecord.earned_points += points;
    userRecord.last_updated = new Date().toISOString();
    
    // تحديث المستوى بناءً على النقاط
    if (userRecord.total_points >= 10000) {
      userRecord.tier = 'platinum';
    } else if (userRecord.total_points >= 5000) {
      userRecord.tier = 'gold';
    } else if (userRecord.total_points >= 1000) {
      userRecord.tier = 'silver';
    }
    
    // حفظ البيانات
    await fs.writeFile(filePath, JSON.stringify(loyaltyData, null, 2));
    
    return userRecord;
  } catch (error) {
    console.error('Error updating loyalty points:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // دعم كلا التنسيقين (camelCase و snake_case)
    const userId = body.userId || body.user_id;
    const articleId = body.articleId || body.article_id; 
    const interactionType = body.interactionType || body.interaction_type;
    const source = body.source;
    const duration = body.duration;
    const completed = body.completed;
    
    if (!userId || !articleId || !interactionType) {
      console.error('Missing required fields:', { userId, articleId, interactionType, body });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // في بيئة التطوير، نطبع البيانات للتأكد
    console.log('🔍 Received interaction:', {
      userId,
      articleId,
      interactionType,
      source
    });
    
    // في بيئة الإنتاج، استخدم قاعدة البيانات
    if (process.env.NODE_ENV === 'production' || process.env.USE_DATABASE === 'true') {
      try {
        // تسجيل التفاعل في قاعدة البيانات
        const interaction = await prisma.interaction.upsert({
          where: {
            userId_articleId_type: {
              userId,
              articleId,
              type: interactionType
            }
          },
          update: {
            createdAt: new Date()
          },
          create: {
            userId,
            articleId,
            type: interactionType
          }
        });
        
        // حساب النقاط
        const pointsMap: Record<string, number> = {
          like: 10,
          save: 15,
          share: 20,
          comment: 25,
          view: 1
        };
        
        const points = pointsMap[interactionType] || 0;
        
        if (points > 0 && userId !== 'guest') {
          // تسجيل نقاط الولاء
          await prisma.loyaltyPoint.create({
            data: {
              userId,
              points,
              action: `${interactionType} على المقال`,
              referenceId: articleId,
              referenceType: 'article',
              metadata: {
                source,
                device: request.headers.get('user-agent') || undefined
              }
            }
          });
        }
        
        // تحديث عدد المشاهدات للمقال إذا كان التفاعل مشاهدة
        if (interactionType === 'view') {
          await prisma.article.update({
            where: { id: articleId },
            data: { views: { increment: 1 } }
          });
        }
        
        return NextResponse.json({ 
          success: true,
          message: 'Interaction recorded successfully',
          points: points
        });
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        // في حالة فشل قاعدة البيانات، نستخدم نظام الملفات كـ fallback
      }
    }
    
    // استخدام نظام الملفات كـ fallback أو في بيئة التطوير

    // 1) تسجيل التفاعل في ملف التفاعلات
    await recordInteraction({
      user_id: userId,
      article_id: articleId,
      interaction_type: interactionType,
      timestamp: new Date().toISOString(),
      source: source || 'unknown',
      duration,
      completed,
      device: request.headers.get('user-agent') || undefined
    });

    // 2) حساب النقاط بناءً على جدول مدمج محلياً لتفادي مشاكل الـTDZ
    const localPointRules: Record<string, { points: number; description: string }> = {
      read: { points: 1, description: 'قراءة مقال' },
      like: { points: 1, description: 'إعجاب بمقال' },
      share: { points: 3, description: 'مشاركة مقال' },
      save: { points: 1, description: 'حفظ مقال' },
      comment: { points: 4, description: 'تعليق على مقال' },
      view: { points: 0, description: 'مشاهدة مقال' },
      unlike: { points: -1, description: 'إلغاء إعجاب' },
      unsave: { points: -1, description: 'إلغاء حفظ' }
    };

    const rule = localPointRules[interactionType] || { points: 0, description: interactionType };
    const pointsEarned = rule.points;

    if (pointsEarned !== 0 && userId !== 'guest') {
      // تحديث ملف نقاط الولاء مع دمج النقاط في سجل التاريخ
      await updateLoyaltyPoints(
        userId,
        pointsEarned,
        interactionType,
        articleId,
        rule.description
      );

      // تسجيل النشاط في ملف الأنشطة (اختياري)
      await logActivity(
        userId,
        interactionType,
        rule.description,
        pointsEarned,
        articleId,
        { source: source || 'unknown' }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Interaction recorded successfully',
      points_earned: pointsEarned
    });
    
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

// تحديث عدد المشاهدات للمقال
async function updateArticleViews(articleId: string) {
  try {
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const fileContent = await fs.readFile(articlesPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const articles = data.articles || data || [];
    
    const articleIndex = articles.findIndex((a: any) => a.id === articleId);
    if (articleIndex !== -1) {
      articles[articleIndex].views_count = (articles[articleIndex].views_count || 0) + 1;
      
      await fs.writeFile(
        articlesPath,
        JSON.stringify({ articles }, null, 2)
      );
    }
  } catch (error) {
    console.error('Error updating article views:', error);
  }
}

// تحديث تفضيلات المستخدم
async function updateUserPreferences(userId: string, categoryId: number, interactionType: string) {
  try {
    const prefsPath = path.join(process.cwd(), 'data', 'user_preferences.json');
    let preferences: any = {};
    
    try {
      const fileContent = await fs.readFile(prefsPath, 'utf-8');
      preferences = JSON.parse(fileContent);
    } catch (error) {
      // ملف جديد
    }

    if (!preferences[userId]) {
      preferences[userId] = {
        categories: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // أوزان التفاعلات
    const weights: { [key: string]: number } = {
      view: 0.1,
      read: 0.5,
      like: 0.3,
      share: 0.7,
      comment: 0.8,
      save: 0.6,
      unlike: -0.3,
      unsave: -0.6
    };

    const weight = weights[interactionType] || 0;
    const currentScore = preferences[userId].categories[categoryId] || 0;
    preferences[userId].categories[categoryId] = Math.max(0, Math.min(5, currentScore + weight));
    preferences[userId].lastUpdated = new Date().toISOString();

    await fs.writeFile(prefsPath, JSON.stringify(preferences, null, 2));
  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
}

const interactionsFilePath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
const loyaltyFilePath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');
const activitiesFilePath = path.join(process.cwd(), 'data', 'user_activities.json');

interface InteractionRequest {
  userId: string;
  articleId: string;
  interactionType: 'read' | 'like' | 'share' | 'save' | 'view' | 'comment' | 'unlike' | 'unsave';
  metadata?: {
    duration?: number;
    source?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  description: string;
  points_earned: number;
  article_id?: string;
  metadata?: any;
  timestamp: string;
}

// نظام النقاط المحدث حسب الجدول المطلوب
const POINT_RULES: { [key: string]: { points: number; description: string; maxPerArticle?: number; maxPerDay?: number } } = {
  read: { points: 1, description: 'قراءة مقال', maxPerArticle: 1 },
  like: { points: 1, description: 'إعجاب بمقال', maxPerArticle: 1 },
  share: { points: 3, description: 'مشاركة مقال', maxPerArticle: 1 },
  save: { points: 1, description: 'حفظ مقال', maxPerArticle: 1 },
  comment: { points: 4, description: 'تعليق على مقال', maxPerArticle: 1 },
  view: { points: 0, description: 'مشاهدة مقال' }, // لا نقاط للمشاهدة العادية
  unlike: { points: -1, description: 'إلغاء إعجاب' },
  unsave: { points: -1, description: 'إلغاء حفظ' }
};

// دالة للتأكد من وجود الملفات
async function ensureDataFiles() {
  const files = [
    { path: interactionsFilePath, defaultData: { interactions: [] } },
    { path: loyaltyFilePath, defaultData: { users: [] } },
    { path: activitiesFilePath, defaultData: { activities: [] } }
  ];

  for (const file of files) {
    try {
      await fs.access(file.path);
    } catch {
      await fs.mkdir(path.dirname(file.path), { recursive: true });
      await fs.writeFile(file.path, JSON.stringify(file.defaultData, null, 2));
    }
  }
}

// دالة للتحقق من الحدود اليومية والمقال
async function checkLimits(userId: string, articleId: string, interactionType: string): Promise<boolean> {
  try {
    const fileContent = await fs.readFile(interactionsFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const interactions = data.interactions || [];

    const rule = POINT_RULES[interactionType];
    if (!rule) return true;

    const today = new Date().toISOString().split('T')[0];

    // التحقق من الحد الأقصى لكل مقال
    if (rule.maxPerArticle) {
      const articleInteractions = interactions.filter((i: UserInteraction) => 
        i.user_id === userId && 
        i.article_id === articleId && 
        i.interaction_type === interactionType
      );
      if (articleInteractions.length >= rule.maxPerArticle) {
        return false;
      }
    }

    // التحقق من الحد الأقصى اليومي
    if (rule.maxPerDay) {
      const todayInteractions = interactions.filter((i: UserInteraction) => 
        i.user_id === userId && 
        i.interaction_type === interactionType &&
        i.timestamp.startsWith(today)
      );
      if (todayInteractions.length >= rule.maxPerDay) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('خطأ في التحقق من الحدود:', error);
    return true; // السماح في حالة الخطأ
  }
}

// دالة تحديث نقاط الولاء المحسنة
async function updateLoyaltyPoints(userId: string, points: number, action: string, articleId?: string, description?: string): Promise<void> {
  try {
    const fileContent = await fs.readFile(loyaltyFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.users) data.users = [];

    let userIndex = data.users.findIndex((user: any) => user.user_id === userId);
    
    if (userIndex === -1) {
      // إنشاء مستخدم جديد
      const newUser = {
        user_id: userId,
        total_points: Math.max(0, points),
        earned_points: points > 0 ? points : 0,
        redeemed_points: 0,
        tier: 'bronze',
        history: [] as Array<{
          action: string;
          points: number;
          timestamp: string;
          article_id?: string;
          description?: string;
        }>,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      if (points !== 0) {
        newUser.history.push({
          action,
          points,
          timestamp: new Date().toISOString(),
          article_id: articleId,
          description
        });
      }
      
      data.users.push(newUser);
    } else {
      // تحديث المستخدم الموجود
      const user = data.users[userIndex];
      user.total_points = Math.max(0, user.total_points + points);
      
      if (points > 0) {
        user.earned_points += points;
      }
      
      user.last_updated = new Date().toISOString();
      
      // تحديث المستوى
      if (user.total_points >= 2000) {
        user.tier = 'platinum';
      } else if (user.total_points >= 500) {
        user.tier = 'gold';
      } else if (user.total_points >= 100) {
        user.tier = 'silver';
      } else {
        user.tier = 'bronze';
      }
      
      // إضافة للتاريخ
      if (points !== 0) {
        user.history.push({
          action,
          points,
          timestamp: new Date().toISOString(),
          article_id: articleId,
          description
        });
      }
    }

    await fs.writeFile(loyaltyFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('خطأ في تحديث نقاط الولاء:', error);
  }
}

// دالة تسجيل النشاط
async function logActivity(userId: string, action: string, description: string, points: number, articleId?: string, metadata?: any): Promise<void> {
  try {
    const fileContent = await fs.readFile(activitiesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.activities) data.activities = [];

    const activity: UserActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      action,
      description,
      points_earned: points,
      article_id: articleId,
      metadata,
      timestamp: new Date().toISOString()
    };

    data.activities.push(activity);

    // الاحتفاظ بآخر 1000 نشاط فقط
    if (data.activities.length > 1000) {
      data.activities = data.activities.slice(-1000);
    }

    await fs.writeFile(activitiesFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('خطأ في تسجيل النشاط:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDataFiles();
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const articleId = url.searchParams.get('articleId');
    const type = url.searchParams.get('type');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const fileContent = await fs.readFile(interactionsFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    const interactions = data.interactions || [];

    let filteredInteractions = interactions.filter((i: UserInteraction) => i.user_id === userId);

    if (articleId) {
      filteredInteractions = filteredInteractions.filter((i: UserInteraction) => i.article_id === articleId);
    }

    if (type) {
      filteredInteractions = filteredInteractions.filter((i: UserInteraction) => i.interaction_type === type);
    }

    // ترتيب حسب التاريخ (الأحدث أولاً)
    filteredInteractions.sort((a: UserInteraction, b: UserInteraction) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      interactions: filteredInteractions,
      total: filteredInteractions.length
    });

  } catch (error) {
    console.error('خطأ في جلب التفاعلات:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في جلب التفاعلات' },
      { status: 500 }
    );
  }
} 