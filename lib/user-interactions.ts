import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// أوزان التفاعلات للنقاط والتفضيلات
const INTERACTION_WEIGHTS = {
  view: { points: 1, preference: 1 },
  read: { points: 5, preference: 2 },
  like: { points: 10, preference: 3 },
  save: { points: 15, preference: 4 },
  share: { points: 20, preference: 5 },
  comment: { points: 25, preference: 4 }
};

// مدة القراءة المتوقعة بناء على عدد الكلمات
const READING_TIME_THRESHOLD = {
  short: { words: 300, multiplier: 0.5 },
  medium: { words: 800, multiplier: 1 },
  long: { words: 1500, multiplier: 1.5 }
};

interface UserInteraction {
  user_id: string;
  article_id: string;
  interaction_type: keyof typeof INTERACTION_WEIGHTS;
  timestamp: string;
  duration?: number; // بالثواني
  completed?: boolean; // هل أكمل قراءة المقال
  device?: string;
  source?: string; // من أين جاء (home, search, recommendation, etc)
}

interface UserPreferences {
  user_id: string;
  categories: Record<string, number>; // category_id -> weight
  authors: Record<string, number>; // author_id -> weight
  topics: string[]; // كلمات مفتاحية مفضلة
  reading_time: {
    preferred_hours: number[]; // ساعات مفضلة [9, 10, 20, 21]
    average_duration: number; // متوسط وقت القراءة
  };
  last_updated: string;
}

interface LoyaltyUpdate {
  user_id: string;
  points_earned: number;
  action: string;
  details: any;
  timestamp: string;
}

// قراءة وكتابة الملفات
async function readJSON(filename: string): Promise<any> {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return filename.includes('interactions') ? { interactions: [] } : {};
  }
}

async function writeJSON(filename: string, data: any): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    await writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
  }
}

// 🔥 تسجيل تفاعل جديد
export async function recordInteraction(interaction: UserInteraction): Promise<void> {
  try {
    // إزالة شرط بيئة الإنتاج للسماح بحفظ التفاعلات وحساب النقاط
    // if (process.env.NODE_ENV === 'production') {
    //   console.log('Production mode: Skipping file-based interaction recording');
    //   return;
    // }
    
    // 1. حفظ التفاعل
    const interactionsData = await readJSON('user_article_interactions.json');
    const interactions = interactionsData.interactions || [];
    interactions.push({
      ...interaction,
      timestamp: interaction.timestamp || new Date().toISOString()
    });
    await writeJSON('user_article_interactions.json', { interactions });

    // 2. تحديث نقاط الولاء (فقط للمستخدمين المسجلين)
    if (interaction.user_id !== 'guest') {
      await updateLoyaltyPoints(
        interaction.user_id,
        INTERACTION_WEIGHTS[interaction.interaction_type].points,
        `${interaction.interaction_type} على المقال`,
        { article_id: interaction.article_id }
      );

      // 3. تحديث تفضيلات المستخدم
      await updateUserPreferences(interaction);
    }

    // 4. تحديث إحصائيات المقال (للجميع)
    await updateArticleStats(interaction.article_id, interaction.interaction_type);

  } catch (error) {
    console.error('Error recording interaction:', error);
  }
}

// 🎯 تحديث نقاط الولاء
export async function updateLoyaltyPoints(
  userId: string,
  points: number,
  action: string,
  details: any = {}
): Promise<void> {
  try {
    // قراءة النقاط الحالية
    const loyaltyData = await readJSON('user_loyalty_points.json');
    const userLoyalty = loyaltyData[userId] || {
      user_id: userId,
      total_points: 0,
      earned_points: 0,
      redeemed_points: 0,
      history: []
    };

    // تحديث النقاط
    userLoyalty.total_points += points;
    userLoyalty.earned_points += points;
    
    // إضافة للتاريخ
    userLoyalty.history.push({
      points,
      action,
      details,
      timestamp: new Date().toISOString()
    });

    // حفظ التحديث
    loyaltyData[userId] = userLoyalty;
    await writeJSON('user_loyalty_points.json', loyaltyData);

    // تسجيل في السجلات
    await logLoyaltyUpdate({
      user_id: userId,
      points_earned: points,
      action,
      details,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating loyalty points:', error);
  }
}

// 🧠 تحديث تفضيلات المستخدم
export async function updateUserPreferences(interaction: UserInteraction): Promise<void> {
  try {
    // قراءة البيانات الحالية
    const preferences = await readJSON('user_preferences.json');
    const articles = await readJSON('articles.json');
    
    // إيجاد المقال
    const article = articles.articles?.find((a: any) => a.id === interaction.article_id);
    if (!article) return;

    // جلب أو إنشاء تفضيلات المستخدم
    let userPref = preferences[interaction.user_id] || {
      user_id: interaction.user_id,
      categories: {},
      authors: {},
      topics: [],
      reading_time: {
        preferred_hours: [],
        average_duration: 0
      },
      last_updated: new Date().toISOString()
    };

    // تحديث وزن التصنيف
    const weight = INTERACTION_WEIGHTS[interaction.interaction_type].preference;
    const categoryId = article.category_id?.toString();
    if (categoryId) {
      userPref.categories[categoryId] = (userPref.categories[categoryId] || 0) + weight;
    }

    // تحديث وزن المؤلف
    if (article.author?.id) {
      userPref.authors[article.author.id] = (userPref.authors[article.author.id] || 0) + weight;
    }

    // تحديث الساعات المفضلة
    const hour = new Date(interaction.timestamp).getHours();
    if (!userPref.reading_time.preferred_hours.includes(hour)) {
      userPref.reading_time.preferred_hours.push(hour);
    }

    // تحديث متوسط وقت القراءة
    if (interaction.duration) {
      const prevAvg = userPref.reading_time.average_duration || 0;
      const interactionCount = Object.values(userPref.categories).reduce((a: number, b: any) => a + b, 0) as number;
      userPref.reading_time.average_duration = 
        (prevAvg * (interactionCount - 1) + interaction.duration) / interactionCount;
    }

    // تحديث التوقيت
    userPref.last_updated = new Date().toISOString();

    // حفظ التحديث
    preferences[interaction.user_id] = userPref;
    await writeJSON('user_preferences.json', preferences);

  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
}

// 📊 تحديث إحصائيات المقال
export async function updateArticleStats(
  articleId: string,
  interactionType: keyof typeof INTERACTION_WEIGHTS
): Promise<void> {
  try {
    const articles = await readJSON('articles.json');
    const articleIndex = articles.articles?.findIndex((a: any) => a.id === articleId);
    
    if (articleIndex === -1) return;

    const article = articles.articles[articleIndex];
    
    // تحديث الإحصائيات
    article.stats = article.stats || {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      saves: 0,
      read_time_avg: 0
    };

    // زيادة العداد المناسب
    switch (interactionType) {
      case 'view':
        article.stats.views = (article.stats.views || 0) + 1;
        // تحديث views_count أيضاً للتوافق
        article.views_count = (article.views_count || 0) + 1;
        break;
      case 'like':
        article.stats.likes = (article.stats.likes || 0) + 1;
        article.likes_count = (article.likes_count || 0) + 1;
        break;
      case 'share':
        article.stats.shares = (article.stats.shares || 0) + 1;
        article.shares_count = (article.shares_count || 0) + 1;
        break;
      case 'comment':
        article.stats.comments = (article.stats.comments || 0) + 1;
        article.comments_count = (article.comments_count || 0) + 1;
        break;
      case 'save':
        article.stats.saves = (article.stats.saves || 0) + 1;
        article.saves_count = (article.saves_count || 0) + 1;
        break;
    }

    // حفظ التحديث
    articles.articles[articleIndex] = article;
    await writeJSON('articles.json', articles);

  } catch (error) {
    console.error('Error updating article stats:', error);
  }
}

// 🎯 الحصول على المحتوى المخصص
export async function getPersonalizedContent(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const preferences = await readJSON('user_preferences.json');
    const articles = await readJSON('articles.json');
    
    const userPref = preferences[userId];
    if (!userPref || !userPref.categories) {
      // إرجاع أحدث المقالات للمستخدمين الجدد
      return articles.articles?.slice(0, limit) || [];
    }

    // ترتيب التصنيفات حسب التفضيل
    const sortedCategories = Object.entries(userPref.categories)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([id]) => id);

    // جمع المقالات من التصنيفات المفضلة
    const personalizedFeed: any[] = [];
    const seenIds = new Set();

    for (const categoryId of sortedCategories) {
      const categoryArticles = articles.articles?.filter((a: any) => 
        a.category_id?.toString() === categoryId && 
        a.status === 'published' &&
        !seenIds.has(a.id)
      ) || [];

      // أخذ أحدث 3 مقالات من كل تصنيف
      const topArticles = categoryArticles
        .sort((a: any, b: any) => 
          new Date(b.published_at || b.created_at).getTime() - 
          new Date(a.published_at || a.created_at).getTime()
        )
        .slice(0, 3);

      topArticles.forEach((article: any) => {
        seenIds.add(article.id);
        const weight = userPref.categories[categoryId] as number;
        const recommendationReason = weight > 10 ? 'behavior_signal' : 'explicit_interest';
        personalizedFeed.push({
          ...article,
          recommendation_reason: recommendationReason,
          category_weight: weight
        });
      });

      if (personalizedFeed.length >= limit) break;
    }

    // لا نضيف مقالات مؤلفين مفضلة خارج نطاق الاهتمامات التصنيفية
    return personalizedFeed.slice(0, limit);

  } catch (error) {
    console.error('Error getting personalized content:', error);
    return [];
  }
}

// 📝 تسجيل تحديث الولاء
async function logLoyaltyUpdate(update: LoyaltyUpdate): Promise<void> {
  try {
    const logsData = await readJSON('loyalty_updates_log.json');
    const logs = Array.isArray(logsData) ? logsData : (logsData.logs || []);
    logs.push(update);
    await writeJSON('loyalty_updates_log.json', logs);
  } catch (error) {
    console.error('Error logging loyalty update:', error);
  }
}

// 🔍 تحليل سلوك المستخدم
export async function analyzeUserBehavior(userId: string): Promise<any> {
  try {
    const interactionsData = await readJSON('user_article_interactions.json');
    const interactions = interactionsData.interactions || [];
    const userInteractions = interactions.filter((i: any) => i.user_id === userId);

    // تحليل أنماط القراءة
    const readingPatterns = {
      total_interactions: userInteractions.length,
      by_type: {} as Record<string, number>,
      by_hour: {} as Record<number, number>,
      by_day: {} as Record<string, number>,
      average_duration: 0,
      completion_rate: 0
    };

    let totalDuration = 0;
    let completedReads = 0;

    userInteractions.forEach((interaction: any) => {
      // حسب النوع
      readingPatterns.by_type[interaction.interaction_type] = 
        (readingPatterns.by_type[interaction.interaction_type] || 0) + 1;

      // حسب الساعة
      const hour = new Date(interaction.timestamp).getHours();
      readingPatterns.by_hour[hour] = (readingPatterns.by_hour[hour] || 0) + 1;

      // حسب اليوم
      const day = new Date(interaction.timestamp).toLocaleDateString('ar-SA', { weekday: 'long' });
      readingPatterns.by_day[day] = (readingPatterns.by_day[day] || 0) + 1;

      // المدة والإكمال
      if (interaction.duration) {
        totalDuration += interaction.duration;
      }
      if (interaction.completed) {
        completedReads++;
      }
    });

    // حساب المتوسطات
    if (userInteractions.length > 0) {
      readingPatterns.average_duration = totalDuration / userInteractions.length;
      readingPatterns.completion_rate = (completedReads / userInteractions.length) * 100;
    }

    return readingPatterns;

  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    return null;
  }
}

// 🎁 حساب المكافآت بناء على السلوك
export async function calculateBehaviorRewards(userId: string): Promise<number> {
  try {
    const behavior = await analyzeUserBehavior(userId);
    if (!behavior) return 0;

    let bonusPoints = 0;

    // مكافأة على الانتظام
    if (behavior.total_interactions >= 30) {
      bonusPoints += 100; // مكافأة النشاط الشهري
    }

    // مكافأة على معدل الإكمال
    if (behavior.completion_rate >= 80) {
      bonusPoints += 50; // قارئ متفاني
    }

    // مكافأة على التنوع
    const interactionTypes = Object.keys(behavior.by_type).length;
    if (interactionTypes >= 4) {
      bonusPoints += 30; // مستخدم متفاعل
    }

    if (bonusPoints > 0) {
      await updateLoyaltyPoints(
        userId,
        bonusPoints,
        'مكافأة السلوك الإيجابي',
        { 
          total_interactions: behavior.total_interactions,
          completion_rate: behavior.completion_rate,
          interaction_types: interactionTypes
        }
      );
    }

    return bonusPoints;

  } catch (error) {
    console.error('Error calculating behavior rewards:', error);
    return 0;
  }
} 