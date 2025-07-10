# دليل الواجهة الأمامية
## Frontend Documentation

### المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [البنية والهيكل](#البنية-والهيكل)
3. [المكونات الأساسية](#المكونات-الأساسية)
4. [إدارة الحالة](#إدارة-الحالة)
5. [التصميم والأنماط](#التصميم-والأنماط)
6. [التفاعل والأحداث](#التفاعل-والأحداث)
7. [الأداء والتحسين](#الأداء-والتحسين)
8. [اختبار المكونات](#اختبار-المكونات)

## نظرة عامة

الواجهة الأمامية لـ **Sabq AI CMS** مبنية باستخدام:

- **Next.js 15** - إطار عمل React مع SSR/SSG
- **TypeScript** - للأمان النوعي والتطوير المحسن
- **Tailwind CSS** - للتصميم السريع والمرن
- **React Hooks** - لإدارة الحالة والتأثيرات الجانبية

### الميزات الرئيسية

✅ **واجهة متجاوبة** - تدعم جميع أحجام الشاشات  
✅ **إمكانية الوصول** - متوافقة مع معايير WCAG 2.1  
✅ **أداء محسن** - تحميل كسول وتحسينات متقدمة  
✅ **دعم RTL** - واجهة عربية كاملة  
✅ **وضع مظلم/فاتح** - تبديل المظاهر  
✅ **تحليلات متقدمة** - تتبع سلوك المستخدم  

## البنية والهيكل

```
components/
├── ui/                    # مكونات واجهة المستخدم الأساسية
│   ├── Button.tsx         # أزرار مختلفة الأنواع
│   ├── Input.tsx          # حقول الإدخال الشاملة
│   ├── Card.tsx           # بطاقات المحتوى
│   ├── Modal.tsx          # النوافذ المنبثقة
│   └── ...
├── navigation/            # مكونات التنقل
│   ├── Navbar.tsx         # شريط التنقل الرئيسي
│   ├── Sidebar.tsx        # الشريط الجانبي
│   ├── Breadcrumb.tsx     # مسار التنقل
│   └── ...
├── feed/                  # مكونات الخلاصة والمحتوى
│   ├── ArticleFeed.tsx    # خلاصة المقالات
│   ├── ArticleCard.tsx    # بطاقة المقال
│   ├── CommentList.tsx    # قائمة التعليقات
│   └── ...
├── forms/                 # نماذج الإدخال
│   ├── LoginForm.tsx      # نموذج تسجيل الدخول
│   ├── RegisterForm.tsx   # نموذج التسجيل
│   ├── ArticleForm.tsx    # نموذج إنشاء المقال
│   └── ...
├── layout/                # مكونات التخطيط
│   ├── Header.tsx         # رأس الصفحة
│   ├── Footer.tsx         # تذييل الصفحة
│   ├── Layout.tsx         # التخطيط الرئيسي
│   └── ...
└── shared/                # مكونات مشتركة
    ├── LoadingSpinner.tsx # مؤشر التحميل
    ├── ErrorBoundary.tsx  # معالج الأخطاء
    ├── SearchBox.tsx      # مربع البحث
    └── ...
```

## المكونات الأساسية

### 1. مكون الإدخال (Input)

مكون شامل لجميع أنواع الإدخال مع دعم التحقق والتخصيص:

```typescript
import { Input, ValidationRules } from '@/components/ui/Input';

// استخدام بسيط
<Input
  type="email"
  name="email"
  label="البريد الإلكتروني"
  placeholder="أدخل بريدك الإلكتروني"
  required
/>

// مع التحقق المخصص
const emailValidation = [
  ValidationRules.required('البريد الإلكتروني مطلوب'),
  ValidationRules.email('صيغة البريد الإلكتروني غير صحيحة')
];

<Input
  type="email"
  name="email"
  label="البريد الإلكتروني"
  validation={emailValidation}
  onChange={(value) => setEmail(value)}
/>

// حقل كلمة المرور مع قوة كلمة المرور
<PasswordInput
  name="password"
  label="كلمة المرور"
  showStrengthMeter
  minLength={8}
  required
/>
```

#### أنواع الإدخال المدعومة

- `text` - نص عادي
- `email` - بريد إلكتروني مع تحقق
- `password` - كلمة مرور مع إخفاء/إظهار
- `number` - أرقام مع تحكم min/max
- `textarea` - نص متعدد الأسطر
- `select` - قائمة منسدلة
- `checkbox` - مربعات اختيار
- `radio` - أزرار اختيار
- `search` - بحث مع اقتراحات

### 2. شريط التنقل (Navbar)

شريط تنقل متجاوب مع دعم القوائم المنسدلة والبحث:

```typescript
import { Navbar } from '@/components/navigation/Navbar';

const navItems = [
  {
    id: 'home',
    label: 'الرئيسية',
    href: '/',
    icon: '🏠'
  },
  {
    id: 'news',
    label: 'الأخبار',
    href: '/news',
    children: [
      { id: 'local', label: 'محليات', href: '/news/local' },
      { id: 'world', label: 'العالم', href: '/news/world' }
    ]
  }
];

<Navbar
  brand={{ name: 'سبق AI', logo: '/logo.png' }}
  navItems={navItems}
  showSearch={true}
  showUserMenu={true}
  onNavClick={(item) => trackNavigation(item)}
/>
```

#### ميزات شريط التنقل

- **متجاوب**: قائمة هامبرغر للشاشات الصغيرة
- **بحث مدمج**: مع اقتراحات فورية
- **قوائم منسدلة**: متعددة المستويات
- **إدارة المستخدم**: تسجيل دخول/خروج
- **إشعارات**: عداد الإشعارات الجديدة
- **تخصيص المظهر**: تبديل فاتح/مظلم

### 3. خلاصة المقالات (ArticleFeed)

مكون عرض المقالات مع تخطيطات متعددة:

```typescript
import { ArticleFeed, useArticles } from '@/components/feed/ArticleFeed';

function NewsPage() {
  const { articles, loading, error } = useArticles({
    category: 'news',
    sortBy: 'publishedAt',
    pageSize: 12
  });

  return (
    <ArticleFeed
      articles={articles}
      loading={loading}
      error={error}
      config={{
        layout: 'cards',
        columns: 3,
        showImages: true,
        showExcerpt: true,
        enableInfiniteScroll: true
      }}
      title="آخر الأخبار"
      onArticleClick={(article) => trackArticleView(article)}
    />
  );
}
```

#### تخطيطات الخلاصة

- **cards**: بطاقات مع صور
- **list**: قائمة خطية
- **grid**: شبكة منتظمة
- **masonry**: تخطيط بحجم متغير

## إدارة الحالة

### 1. React Hooks

استخدام hooks مخصصة لإدارة الحالة:

```typescript
// useAuth - إدارة المصادقة
import { useAuth } from '@/hooks/useAuth';

function Profile() {
  const { user, login, logout, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return <LoginForm onLogin={login} />;
  }
  
  return (
    <div>
      <h1>مرحباً، {user.fullName}</h1>
      <button onClick={logout}>تسجيل الخروج</button>
    </div>
  );
}

// useLocalStorage - التخزين المحلي
import { useLocalStorage } from '@/hooks/useLocalStorage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'ar');
  
  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">فاتح</option>
        <option value="dark">مظلم</option>
      </select>
    </div>
  );
}
```

### 2. Context API

سياقات للبيانات المشتركة:

```typescript
// AuthContext
import { createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // منطق المصادقة...
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ThemeContext
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## التصميم والأنماط

### 1. نظام التصميم

```css
/* المتغيرات الأساسية */
:root {
  /* الألوان الأساسية */
  --color-primary: #3b82f6;
  --color-secondary: #6b7280;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* ألوان النص */
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  
  /* ألوان الخلفية */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  
  /* الخطوط */
  --font-family-primary: 'Cairo', 'Segoe UI', system-ui, sans-serif;
  --font-family-monospace: 'Fira Code', 'Monaco', monospace;
  
  /* الأحجام */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* الحدود */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.375rem;
  --border-radius-lg: 0.5rem;
  
  /* الظلال */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* الوضع المظلم */
[data-theme="dark"] {
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #374151;
  --color-bg-tertiary: #4b5563;
}
```

### 2. مكونات Tailwind المخصصة

```css
/* components.css */
@layer components {
  /* الأزرار */
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
  }
  
  /* البطاقات */
  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .card-header {
    @apply px-6 py-4 border-b border-gray-200;
  }
  
  .card-body {
    @apply px-6 py-4;
  }
  
  /* النماذج */
  .form-input {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500;
  }
  
  .form-label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  
  /* التنقل */
  .nav-link {
    @apply text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors;
  }
  
  .nav-link-active {
    @apply text-blue-600 bg-blue-50;
  }
}
```

### 3. الرسوم المتحركة

```css
/* animations.css */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-in-up {
  animation: slideInUp 0.3s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## التفاعل والأحداث

### 1. تتبع التحليلات

```typescript
// تتبع الأحداث التلقائي
import { analyticsManager } from '@/lib/analytics';

// تتبع النقرات
function TrackableButton({ children, eventName, ...props }) {
  const handleClick = async (event) => {
    await analyticsManager.trackEvent({
      type: 'click',
      category: 'ui',
      action: 'button_click',
      label: eventName
    });
    
    props.onClick?.(event);
  };
  
  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

// تتبع مشاهدة الصفحات
function usePageView(pageName) {
  useEffect(() => {
    analyticsManager.trackPageView(window.location.href, pageName);
  }, [pageName]);
}
```

### 2. إدارة الأخطاء

```typescript
// Error Boundary
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // تسجيل الخطأ في نظام المراقبة
    analyticsManager.trackError(error, 'error_boundary');
    console.error('Error Boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>حدث خطأ غير متوقع</h2>
          <p>نعتذر عن هذا الخطأ. تم تسجيله وسيتم إصلاحه قريباً.</p>
          <button onClick={() => window.location.reload()}>
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// استخدام Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* مسارات التطبيق */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### 3. التحميل التدريجي

```typescript
// تحميل كسول للمكونات
import { lazy, Suspense } from 'react';

const ArticleEditor = lazy(() => import('@/components/ArticleEditor'));
const Dashboard = lazy(() => import('@/components/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/editor" element={<ArticleEditor />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}

// تحميل الصور التدريجي
function LazyImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={className}>
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {!loaded && <div className="animate-pulse bg-gray-200 w-full h-full" />}
    </div>
  );
}
```

## الأداء والتحسين

### 1. تحسين العرض

```typescript
// React.memo للمكونات الثابتة
const ArticleCard = React.memo(({ article, onLike }) => {
  return (
    <div className="article-card">
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <button onClick={() => onLike(article.id)}>
        {article.likesCount} ❤️
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // مقارنة مخصصة
  return prevProps.article.id === nextProps.article.id &&
         prevProps.article.likesCount === nextProps.article.likesCount;
});

// useMemo للحسابات المعقدة
function ArticleStats({ articles }) {
  const stats = useMemo(() => {
    const totalViews = articles.reduce((sum, article) => sum + article.views, 0);
    const avgViews = totalViews / articles.length;
    const topCategory = getMostFrequentCategory(articles);
    
    return { totalViews, avgViews, topCategory };
  }, [articles]);
  
  return (
    <div>
      <p>إجمالي المشاهدات: {stats.totalViews}</p>
      <p>متوسط المشاهدات: {stats.avgViews}</p>
      <p>التصنيف الأكثر: {stats.topCategory}</p>
    </div>
  );
}

// useCallback للدوال
function ArticleList({ articles, onArticleSelect }) {
  const handleSelect = useCallback((articleId) => {
    const article = articles.find(a => a.id === articleId);
    onArticleSelect(article);
  }, [articles, onArticleSelect]);
  
  return (
    <div>
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### 2. إدارة الحالة المحسنة

```typescript
// useReducer للحالة المعقدة
const articlesReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        articles: action.payload,
        lastUpdated: Date.now()
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_ARTICLE':
      return {
        ...state,
        articles: [action.payload, ...state.articles]
      };
    case 'UPDATE_ARTICLE':
      return {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.id ? action.payload : article
        )
      };
    default:
      return state;
  }
};

function useArticles() {
  const [state, dispatch] = useReducer(articlesReducer, {
    articles: [],
    loading: false,
    error: null,
    lastUpdated: null
  });
  
  const fetchArticles = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const articles = await api.getArticles();
      dispatch({ type: 'FETCH_SUCCESS', payload: articles });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message });
    }
  }, []);
  
  return { ...state, fetchArticles };
}
```

### 3. التخزين المؤقت

```typescript
// Cache Hook
function useCache(key, fetcher, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { ttl = 5 * 60 * 1000 } = options; // 5 دقائق افتراضي
  
  useEffect(() => {
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (Date.now() - parsed.timestamp < ttl) {
        setData(parsed.data);
        return;
      }
    }
    
    setLoading(true);
    fetcher()
      .then(result => {
        setData(result);
        localStorage.setItem(key, JSON.stringify({
          data: result,
          timestamp: Date.now()
        }));
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key, fetcher, ttl]);
  
  return { data, loading, error };
}

// استخدام Cache
function UserProfile({ userId }) {
  const { data: user, loading, error } = useCache(
    `user:${userId}`,
    () => api.getUser(userId),
    { ttl: 10 * 60 * 1000 } // 10 دقائق
  );
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <UserCard user={user} />;
}
```

## اختبار المكونات

### 1. اختبارات الوحدة

```typescript
// ArticleCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleCard } from '@/components/ArticleCard';

const mockArticle = {
  id: '1',
  title: 'مقال تجريبي',
  excerpt: 'هذا مقال للاختبار',
  author: { name: 'كاتب تجريبي' },
  publishedAt: new Date('2024-01-01')
};

describe('ArticleCard', () => {
  test('يعرض عنوان المقال', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('مقال تجريبي')).toBeInTheDocument();
  });
  
  test('يستدعي onLike عند النقر على زر الإعجاب', () => {
    const mockOnLike = jest.fn();
    render(<ArticleCard article={mockArticle} onLike={mockOnLike} />);
    
    fireEvent.click(screen.getByRole('button', { name: /إعجاب/i }));
    expect(mockOnLike).toHaveBeenCalledWith(mockArticle.id);
  });
  
  test('يعرض تاريخ النشر بالتنسيق الصحيح', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('1 يناير 2024')).toBeInTheDocument();
  });
});
```

### 2. اختبارات التكامل

```typescript
// ArticleFeed.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ArticleFeed } from '@/components/ArticleFeed';
import { mockApi } from '@/tests/mocks/api';

jest.mock('@/lib/api', () => mockApi);

describe('ArticleFeed Integration', () => {
  test('يحمل ويعرض المقالات من API', async () => {
    mockApi.getArticles.mockResolvedValue([
      { id: '1', title: 'مقال 1' },
      { id: '2', title: 'مقال 2' }
    ]);
    
    render(<ArticleFeed />);
    
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('مقال 1')).toBeInTheDocument();
      expect(screen.getByText('مقال 2')).toBeInTheDocument();
    });
  });
  
  test('يعرض رسالة خطأ عند فشل التحميل', async () => {
    mockApi.getArticles.mockRejectedValue(new Error('فشل التحميل'));
    
    render(<ArticleFeed />);
    
    await waitFor(() => {
      expect(screen.getByText(/فشل التحميل/)).toBeInTheDocument();
    });
  });
});
```

### 3. اختبارات الأداء

```typescript
// Performance.test.tsx
import { render } from '@testing-library/react';
import { ArticleFeed } from '@/components/ArticleFeed';

describe('ArticleFeed Performance', () => {
  test('يعرض 1000 مقال في أقل من 1000ms', () => {
    const articles = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      title: `مقال ${i}`,
      excerpt: `محتوى المقال ${i}`
    }));
    
    const startTime = performance.now();
    render(<ArticleFeed articles={articles} />);
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(1000);
  });
  
  test('لا يعيد العرض عند تغيير props غير مؤثرة', () => {
    const mockRender = jest.fn();
    const articles = [{ id: '1', title: 'مقال' }];
    
    const { rerender } = render(
      <ArticleFeed articles={articles} onRender={mockRender} />
    );
    
    // تغيير prop غير مؤثر
    rerender(
      <ArticleFeed articles={articles} className="new-class" onRender={mockRender} />
    );
    
    expect(mockRender).toHaveBeenCalledTimes(1);
  });
});
```

## أفضل الممارسات

### 1. بنية المكونات

```typescript
// مثال على مكون منظم بشكل جيد
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  ...props
}) => {
  // منطق المكون
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (disabled || loading) return;
    onClick?.(event);
  }, [disabled, loading, onClick]);
  
  // فئات CSS
  const classes = classNames(
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    {
      'btn--disabled': disabled,
      'btn--loading': loading
    }
  );
  
  // العرض
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};

// PropTypes للتحقق من الخصائص
Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func
};
```

### 2. إدارة الأخطاء

```typescript
// Hook لمعالجة الأخطاء
function useErrorHandler() {
  const [error, setError] = useState(null);
  
  const handleError = useCallback((error: Error, context?: string) => {
    console.error('Error:', error, 'Context:', context);
    
    // تسجيل في نظام المراقبة
    analyticsManager.trackError(error, context);
    
    // عرض رسالة للمستخدم
    setError({
      message: 'حدث خطأ غير متوقع',
      details: error.message,
      context
    });
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => setError(null), 5000);
  }, []);
  
  const clearError = useCallback(() => setError(null), []);
  
  return { error, handleError, clearError };
}

// استخدام معالج الأخطاء
function DataComponent() {
  const { error, handleError, clearError } = useErrorHandler();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(error => handleError(error, 'fetchData'));
  }, [handleError]);
  
  if (error) {
    return (
      <ErrorAlert
        message={error.message}
        onDismiss={clearError}
      />
    );
  }
  
  return <div>{/* عرض البيانات */}</div>;
}
```

### 3. التحميل والحالات

```typescript
// Hook للحالات المختلفة
function useAsyncState(asyncFunction) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });
  
  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      throw error;
    }
  }, [asyncFunction]);
  
  return { ...state, execute };
}

// مكون يستخدم حالات متعددة
function UserProfile({ userId }) {
  const { data: user, loading, error, execute } = useAsyncState(fetchUser);
  
  useEffect(() => {
    execute(userId);
  }, [userId, execute]);
  
  // حالة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="mr-2">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }
  
  // حالة الخطأ
  if (error) {
    return (
      <ErrorState
        title="فشل في تحميل الملف الشخصي"
        message={error.message}
        onRetry={() => execute(userId)}
      />
    );
  }
  
  // حالة عدم وجود بيانات
  if (!user) {
    return (
      <EmptyState
        title="المستخدم غير موجود"
        message="لم يتم العثور على الملف الشخصي المطلوب"
      />
    );
  }
  
  // عرض البيانات
  return (
    <div className="user-profile">
      <Avatar src={user.avatar} name={user.name} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}
```

---

**آخر تحديث**: ديسمبر 2024  
**الإصدار**: 1.0.0  
**المحرر**: فريق تطوير سبق AI 