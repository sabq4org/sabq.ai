import Script from 'next/script';

interface ArticleJsonLdProps {
  article: {
    id: string;
    title: string;
    summary?: string;
    content?: string;
    featured_image?: string;
    author?: string | { name: string };
    author_name?: string;
    reporter?: string;
    reporter_name?: string;
    published_at?: string;
    created_at?: string;
    updated_at?: string;
    category_name?: string;
    seo_keywords?: string | string[];
  };
}

export default function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  // استخراج اسم المؤلف
  let authorName = 'فريق التحرير';
  if (article.author) {
    if (typeof article.author === 'string') {
      authorName = article.author;
    } else if (article.author.name) {
      authorName = article.author.name;
    }
  } else if (article.author_name) {
    authorName = article.author_name;
  } else if (article.reporter || article.reporter_name) {
    authorName = article.reporter || article.reporter_name || 'فريق التحرير';
  }

  // استخراج الكلمات المفتاحية
  let keywords: string[] = [];
  if (article.seo_keywords) {
    if (typeof article.seo_keywords === 'string') {
      keywords = article.seo_keywords.split(',').map(k => k.trim());
    } else if (Array.isArray(article.seo_keywords)) {
      keywords = article.seo_keywords;
    }
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary || article.content?.substring(0, 160) || article.title,
    "image": article.featured_image ? [article.featured_image] : ["https://sabq.org/default-news-image.jpg"],
    "datePublished": article.published_at || article.created_at,
    "dateModified": article.updated_at || article.published_at || article.created_at,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": `https://sabq.org/author/${encodeURIComponent(authorName)}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "صحيفة سبق الإلكترونية",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sabq.org/logo.png",
        "width": 600,
        "height": 60
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://sabq.org/article/${article.id}`
    },
    "articleSection": article.category_name || "أخبار",
    "keywords": keywords.join(", "),
    "inLanguage": "ar",
    "isAccessibleForFree": true,
    "potentialAction": {
      "@type": "ReadAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://sabq.org/article/${article.id}`,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/IOSPlatform",
          "http://schema.org/AndroidPlatform"
        ]
      }
    }
  };

  return (
    <Script
      id="article-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd)
      }}
      strategy="afterInteractive"
    />
  );
} 