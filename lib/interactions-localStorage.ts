// نظام التفاعلات المحلي (localStorage only)
// يعمل في جميع البيئات بدون قاعدة بيانات

interface LocalInteraction {
  userId: string;
  articleId: string;
  liked: boolean;
  saved: boolean;
  shared: boolean;
  likeTimestamp?: string;
  saveTimestamp?: string;
  shareTimestamp?: string;
  lastUpdated: string;
}

interface UserStats {
  totalLikes: number;
  totalSaves: number;
  totalShares: number;
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastActivity: string;
}

const STORAGE_KEYS = {
  INTERACTIONS: 'sabq_interactions',
  USER_STATS: 'sabq_user_stats',
  POINTS_HISTORY: 'sabq_points_history'
};

// حفظ التفاعل
export function saveLocalInteraction(
  userId: string, 
  articleId: string, 
  type: 'like' | 'save' | 'share' | 'unlike' | 'unsave',
  metadata?: any
): { success: boolean; points: number; message: string } {
  try {
    // 1. جلب التفاعلات المحفوظة
    const interactions = getLocalInteractions();
    const key = `${userId}_${articleId}`;
    
    // حفظ احتياطي بمعرف المقال فقط (للضيوف)
    const articleKey = `article_${articleId}_likes`;
    let articleLikes = parseInt(localStorage.getItem(articleKey) || '0');
    
    // 2. جلب أو إنشاء التفاعل
    let interaction = interactions[key] || {
      userId,
      articleId,
      liked: false,
      saved: false,
      shared: false,
      lastUpdated: new Date().toISOString()
    };

    // 3. حساب النقاط
    const pointsMap = {
      'like': 1,
      'save': 1,
      'share': 3,
      'unlike': -1,
      'unsave': -1
    };

    const points = pointsMap[type as keyof typeof pointsMap] || 0;
    
    // 4. التحقق من التفاعل المكرر
    if (type === 'like' && interaction.liked) {
      return { success: false, points: 0, message: 'تم الإعجاب مسبقاً' };
    }
    if (type === 'save' && interaction.saved) {
      return { success: false, points: 0, message: 'تم الحفظ مسبقاً' };
    }

    // 5. تحديث التفاعل
    switch (type) {
      case 'like':
        interaction.liked = true;
        interaction.likeTimestamp = new Date().toISOString();
        articleLikes++;
        break;
      case 'unlike':
        interaction.liked = false;
        articleLikes = Math.max(0, articleLikes - 1);
        break;
      case 'save':
        interaction.saved = true;
        interaction.saveTimestamp = new Date().toISOString();
        break;
      case 'unsave':
        interaction.saved = false;
        break;
      case 'share':
        interaction.shared = true;
        interaction.shareTimestamp = new Date().toISOString();
        break;
    }

    interaction.lastUpdated = new Date().toISOString();

    // 6. حفظ التفاعل المحدث
    interactions[key] = interaction;
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    
    // حفظ العدد الاحتياطي للإعجابات
    localStorage.setItem(articleKey, articleLikes.toString());

    // 7. تحديث إحصائيات المستخدم
    updateUserStats(userId, type, points);

    // 8. إضافة للسجل
    addToPointsHistory(userId, articleId, type, points);

    return {
      success: true,
      points: Math.max(0, points),
      message: points > 0 ? `حصلت على ${points} نقطة!` : 'تم التحديث'
    };

  } catch (error) {
    console.error('خطأ في حفظ التفاعل:', error);
    return { success: false, points: 0, message: 'حدث خطأ' };
  }
}

// جلب تفاعلات المستخدم مع مقال معين
export function getUserArticleInteraction(userId: string, articleId: string): {
  liked: boolean;
  saved: boolean;
  shared: boolean;
} {
  console.log('=== getUserArticleInteraction ===');
  console.log('userId:', userId);
  console.log('articleId:', articleId);
  
  const interactions = getLocalInteractions();
  const key = `${userId}_${articleId}`;
  const interaction = interactions[key];
  
  console.log('key:', key);
  console.log('interaction found:', interaction);
  
  // البحث أيضاً بمعرف المقال فقط كنسخة احتياطية
  const articleLikesKey = `article_${articleId}_likes`;
  const articleLikes = localStorage.getItem(articleLikesKey);
  console.log('article likes backup:', articleLikes);

  return {
    liked: interaction?.liked || false,
    saved: interaction?.saved || false,
    shared: interaction?.shared || false
  };
}

// تحديث تفاعل المستخدم مع مقال معين
export function updateUserArticleInteraction(
  userId: string, 
  articleId: string, 
  updates: {
    liked?: boolean;
    saved?: boolean;
    shared?: boolean;
  }
): void {
  try {
    const interactions = getLocalInteractions();
    const key = `${userId}_${articleId}`;
    
    // جلب أو إنشاء التفاعل
    let interaction = interactions[key] || {
      userId,
      articleId,
      liked: false,
      saved: false,
      shared: false,
      lastUpdated: new Date().toISOString()
    };

    // تطبيق التحديثات
    if (updates.liked !== undefined) {
      interaction.liked = updates.liked;
      if (updates.liked) {
        interaction.likeTimestamp = new Date().toISOString();
      }
    }
    
    if (updates.saved !== undefined) {
      interaction.saved = updates.saved;
      if (updates.saved) {
        interaction.saveTimestamp = new Date().toISOString();
      }
    }
    
    if (updates.shared !== undefined) {
      interaction.shared = updates.shared;
      if (updates.shared) {
        interaction.shareTimestamp = new Date().toISOString();
      }
    }

    interaction.lastUpdated = new Date().toISOString();

    // حفظ التفاعل المحدث
    interactions[key] = interaction;
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    
  } catch (error) {
    console.error('خطأ في تحديث التفاعل:', error);
  }
}

// جلب جميع التفاعلات
function getLocalInteractions(): { [key: string]: LocalInteraction } {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
    console.log('Raw interactions data:', stored?.substring(0, 100) + '...');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error parsing interactions:', error);
    return {};
  }
}

// تحديث إحصائيات المستخدم
function updateUserStats(userId: string, action: string, points: number) {
  try {
    const stats = getUserStats(userId);
    
    // تحديث العدادات
    if (action === 'like') stats.totalLikes++;
    else if (action === 'unlike') stats.totalLikes = Math.max(0, stats.totalLikes - 1);
    else if (action === 'save') stats.totalSaves++;
    else if (action === 'unsave') stats.totalSaves = Math.max(0, stats.totalSaves - 1);
    else if (action === 'share') stats.totalShares++;

    // تحديث النقاط
    stats.totalPoints = Math.max(0, stats.totalPoints + points);
    
    // تحديث المستوى
    if (stats.totalPoints >= 2000) stats.tier = 'platinum';
    else if (stats.totalPoints >= 500) stats.tier = 'gold';
    else if (stats.totalPoints >= 100) stats.tier = 'silver';
    else stats.tier = 'bronze';

    stats.lastActivity = new Date().toISOString();

    // حفظ الإحصائيات
    const allStats = getAllUserStats();
    allStats[userId] = stats;
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(allStats));

  } catch (error) {
    console.error('خطأ في تحديث الإحصائيات:', error);
  }
}

// جلب إحصائيات مستخدم
export function getUserStats(userId: string): UserStats {
  const allStats = getAllUserStats();
  return allStats[userId] || {
    totalLikes: 0,
    totalSaves: 0,
    totalShares: 0,
    totalPoints: 0,
    tier: 'bronze',
    lastActivity: new Date().toISOString()
  };
}

// جلب جميع الإحصائيات
function getAllUserStats(): { [userId: string]: UserStats } {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// إضافة للسجل
function addToPointsHistory(userId: string, articleId: string, action: string, points: number) {
  try {
    const history = getPointsHistory();
    
    history.push({
      userId,
      articleId,
      action,
      points,
      timestamp: new Date().toISOString()
    });

    // الاحتفاظ بآخر 100 عملية فقط
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    localStorage.setItem(STORAGE_KEYS.POINTS_HISTORY, JSON.stringify(history));

  } catch (error) {
    console.error('خطأ في حفظ السجل:', error);
  }
}

// جلب سجل النقاط
export function getPointsHistory(userId?: string): any[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POINTS_HISTORY);
    const history = stored ? JSON.parse(stored) : [];
    
    if (userId) {
      return history.filter((h: any) => h.userId === userId);
    }
    
    return history;
  } catch {
    return [];
  }
}

// تنظيف البيانات القديمة (أكثر من 30 يوم)
export function cleanOldData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // تنظيف السجل
    const history = getPointsHistory();
    const recentHistory = history.filter(h => 
      new Date(h.timestamp) > thirtyDaysAgo
    );
    localStorage.setItem(STORAGE_KEYS.POINTS_HISTORY, JSON.stringify(recentHistory));

  } catch (error) {
    console.error('خطأ في تنظيف البيانات:', error);
  }
}

// ترحيل البيانات من التنسيق القديم
export function migrateOldData() {
  try {
    // البحث عن البيانات القديمة
    const keys = Object.keys(localStorage);
    const interactions: { [key: string]: LocalInteraction } = {};
    
    keys.forEach(key => {
      if (key.startsWith('article_') && key.includes('_interactions')) {
        // استخراج معرف المقال
        const articleId = key.replace('article_', '').replace('_interactions', '');
        
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const userId = localStorage.getItem('userId') || 'anonymous';
          
          interactions[`${userId}_${articleId}`] = {
            userId,
            articleId,
            liked: data.liked || false,
            saved: data.saved || false,
            shared: data.shared || false,
            lastUpdated: new Date().toISOString()
          };
        } catch {}
      }
    });

    // حفظ البيانات المرحلة
    if (Object.keys(interactions).length > 0) {
      localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
      console.log(`تم ترحيل ${Object.keys(interactions).length} تفاعل`);
    }

  } catch (error) {
    console.error('خطأ في ترحيل البيانات:', error);
  }
} 