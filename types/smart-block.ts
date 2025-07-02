export interface SmartBlock {
  id: string;
  name: string;
  type: 'smart' | 'custom' | 'html' | 'hero' | 'carousel' | 'grid' | 'list' | 'ticker' | 'trending';
  displayType?: string;
  position: 'topBanner' | 'afterHighlights' | 'afterCards' | 'beforePersonalization' | 'beforeFooter';
  status: 'active' | 'inactive';
  order: number;
  articlesCount?: number;
  keywords?: string[];
  category?: string;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    secondaryColor?: string;
    accentColor?: string;
    borderColor?: string;
  };
  settings?: {
    subtitle?: string;
    showViewCount?: boolean;
    showAuthor?: boolean;
    showDate?: boolean;
    showCategory?: boolean;
    layout?: string;
    columns?: number;
    [key: string]: any;
  };
  customHtml?: string;
  padding?: string;
  margin?: string;
  bgColor?: string;
  visibility?: 'all' | 'guest' | 'user';
  maxItems?: number;
  createdAt: string;
  updatedAt: string;
} 