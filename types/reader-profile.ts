// أنواع ملف القارئ الذكي
export interface ReaderProfile {
  userId: string;
  personality: ReaderPersonality;
  traits: ReaderTrait[];
  stats: ReaderStats;
  lastUpdated: Date;
}

export interface ReaderStats {
  totalArticlesRead: number;
  totalInteractions: number;
  dailyReadingAverage: number;
  streakDays: number;
  loyaltyPoints: number;
  favoriteCategories: CategoryPreference[];
  interactionBreakdown: InteractionBreakdown;
}

export interface InteractionBreakdown {
  views: number;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
}

export interface CategoryPreference {
  name: string;
  percentage: number;
}

export interface ReaderPersonality {
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

export interface ReaderTrait {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

// أنواع إضافية للتوافق مع الكود القديم
export interface ReaderInsight {
  id: string;
  profileId: string;
  type: 'achievement' | 'milestone' | 'recommendation' | 'tip';
  title: string;
  description: string;
  icon: string;
  date: Date;
}

export interface AuthorPreference {
  authorId: string;
  authorName: string;
  readCount: number;
} 