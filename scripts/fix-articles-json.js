const fs = require('fs');
const path = require('path');

console.log('🔧 إنشاء ملف articles.json جديد...');

// إنشاء بيانات تجريبية صحيحة
const articlesData = {
  "articles": [
    {
      "id": "article-1",
      "title": "مقال تجريبي 1",
      "slug": "test-article-1",
      "content": "محتوى المقال التجريبي الأول",
      "excerpt": "ملخص المقال",
      "author_id": "author-1",
      "category_id": 1,
      "status": "published",
      "featured_image": "/images/placeholder.jpg",
      "seo_title": "مقال تجريبي 1",
      "seo_description": "وصف المقال التجريبي",
      "seo_keywords": ["تجريبي", "مقال"],
      "is_breaking": false,
      "is_featured": true,
      "is_pinned": false,
      "publish_at": "2025-01-01T00:00:00.000Z",
      "published_at": "2025-01-01T00:00:00.000Z",
      "views_count": 10,
      "reading_time": 2,
      "content_blocks": [
        {
          "id": "block-1",
          "type": "paragraph",
          "data": {
            "paragraph": {
              "text": "محتوى المقال التجريبي الأول"
            }
          },
          "order": 0
        }
      ],
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "is_deleted": false,
      "author": "محرر تجريبي",
      "stats": {
        "views": 10,
        "likes": 0,
        "shares": 0,
        "comments": 0,
        "saves": 0,
        "read_time_avg": 0
      },
      "featured_image_alt": "صورة تعبيرية",
      "author_name": "محرر تجريبي",
      "author_avatar": null,
      "category_name": "عام"
    }
  ],
  "total": 1,
  "generated_at": new Date().toISOString()
};

// حفظ الملف
const filePath = path.join(__dirname, '..', 'data', 'articles.json');
fs.writeFileSync(filePath, JSON.stringify(articlesData, null, 2), 'utf8');

console.log('✅ تم إنشاء ملف articles.json جديد صحيح');

// التحقق من صحة JSON
try {
  JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('✅ JSON صحيح');
} catch (error) {
  console.error('❌ خطأ في JSON:', error.message);
} 