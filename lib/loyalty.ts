// نظام الولاء المركزي
export interface LoyaltyLevel {
  name: 'برونزي' | 'فضي' | 'ذهبي' | 'سفير';
  englishName: 'bronze' | 'silver' | 'gold' | 'ambassador';
  color: string;
  bgColor: string;
  icon: string;
  minPoints: number;
  nextLevel?: number;
}

// تعريف مستويات العضوية
export const LOYALTY_LEVELS: Record<string, LoyaltyLevel> = {
  bronze: {
    name: 'برونزي',
    englishName: 'bronze',
    color: '#CD7F32',
    bgColor: 'bg-orange-100',
    icon: '🥉',
    minPoints: 0,
    nextLevel: 101
  },
  silver: {
    name: 'فضي',
    englishName: 'silver',
    color: '#C0C0C0',
    bgColor: 'bg-gray-100',
    icon: '🥈',
    minPoints: 101,
    nextLevel: 501
  },
  gold: {
    name: 'ذهبي',
    englishName: 'gold',
    color: '#FFD700',
    bgColor: 'bg-yellow-100',
    icon: '🥇',
    minPoints: 501,
    nextLevel: 2001
  },
  ambassador: {
    name: 'سفير',
    englishName: 'ambassador',
    color: '#9333EA',
    bgColor: 'bg-purple-100',
    icon: '👑',
    minPoints: 2001,
    nextLevel: undefined
  }
};

/**
 * الدالة المركزية لحساب مستوى العضوية بناءً على النقاط
 * @param points عدد نقاط الولاء
 * @returns معلومات مستوى العضوية
 */
export function getMembershipLevel(points: number): LoyaltyLevel {
  const safePoints = points || 0;
  
  if (safePoints >= 2001) return LOYALTY_LEVELS.ambassador;
  if (safePoints >= 501) return LOYALTY_LEVELS.gold;
  if (safePoints >= 101) return LOYALTY_LEVELS.silver;
  return LOYALTY_LEVELS.bronze;
}

/**
 * حساب النسبة المئوية للتقدم نحو المستوى التالي
 * @param points النقاط الحالية
 * @returns النسبة المئوية (0-100)
 */
export function getProgressToNextLevel(points: number): number {
  const currentLevel = getMembershipLevel(points);
  
  if (!currentLevel.nextLevel) return 100; // سفير - أعلى مستوى
  
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsNeededForNextLevel = currentLevel.nextLevel - currentLevel.minPoints;
  
  return Math.min(100, Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100));
}

/**
 * حساب النقاط المتبقية للمستوى التالي
 * @param points النقاط الحالية
 * @returns عدد النقاط المتبقية
 */
export function getPointsToNextLevel(points: number): number | null {
  const currentLevel = getMembershipLevel(points);
  
  if (!currentLevel.nextLevel) return null; // سفير - أعلى مستوى
  
  return currentLevel.nextLevel - points;
}

/**
 * الحصول على معلومات المستوى بالاسم الإنجليزي
 * @param levelName اسم المستوى بالإنجليزي
 * @returns معلومات المستوى أو null
 */
export function getLevelByName(levelName: string): LoyaltyLevel | null {
  return LOYALTY_LEVELS[levelName] || null;
} 