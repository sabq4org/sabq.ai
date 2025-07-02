'use client';

import React from 'react';
import { Quote, Image as ImageIcon } from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'quote' | 'image' | 'video' | 'tweet' | 'list' | 'link' | 'highlight';
  content: any;
  order: number;
}

interface ArticleContentRendererProps {
  contentBlocks: ContentBlock[];
  fallbackContent?: string;
  className?: string;
}

const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({ 
  contentBlocks, 
  fallbackContent,
  className = ''
}) => {
  // إذا لم توجد content blocks، استخدم النص العادي
  if (!contentBlocks || contentBlocks.length === 0) {
    if (fallbackContent) {
      // تحويل النص العادي إلى فقرات
      const paragraphs = fallbackContent.split('\n\n').filter(p => p.trim());
      return (
        <div className={`prose prose-lg max-w-none ${className}`} style={{ direction: 'rtl' }}>
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="leading-relaxed mb-6 text-gray-700">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      );
    }
    return (
      <div className="text-center py-8 text-gray-500">
        <p>لا يوجد محتوى متاح للعرض</p>
      </div>
    );
  }

  // ترتيب البلوكات حسب order
  const sortedBlocks = [...contentBlocks].sort((a, b) => a.order - b.order);

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p className="leading-relaxed mb-6 text-gray-700">
            {block.content.text}
          </p>
        );

      case 'heading':
        const level = block.content.level || 2;
        const headingClass = "font-bold mt-8 mb-4 text-gray-800";
        
        switch (level) {
          case 1:
            return <h1 className={headingClass}>{block.content.text}</h1>;
          case 2:
            return <h2 className={headingClass}>{block.content.text}</h2>;
          case 3:
            return <h3 className={headingClass}>{block.content.text}</h3>;
          case 4:
            return <h4 className={headingClass}>{block.content.text}</h4>;
          case 5:
            return <h5 className={headingClass}>{block.content.text}</h5>;
          case 6:
            return <h6 className={headingClass}>{block.content.text}</h6>;
          default:
            return <h2 className={headingClass}>{block.content.text}</h2>;
        }

      case 'quote':
        return (
          <blockquote className="border-r-4 border-blue-500 bg-blue-50 p-6 my-6 rounded-lg">
            <div className="flex items-start gap-4">
              <Quote className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-800 italic text-lg leading-relaxed">
                  "{block.content.text}"
                </p>
                {block.content.author && (
                  <cite className="block mt-3 text-sm text-gray-600 font-medium">
                    — {block.content.author}
                  </cite>
                )}
              </div>
            </div>
          </blockquote>
        );

      case 'image':
        return (
          <figure className="my-8">
            {block.content.url ? (
              <img
                src={block.content.url}
                alt={block.content.alt || 'صورة'}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>صورة غير متاحة</p>
                </div>
              </div>
            )}
            {block.content.caption && (
              <figcaption className="text-sm text-gray-600 text-center mt-3 italic">
                {block.content.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'list':
        const ListTag = block.content.ordered ? 'ol' : 'ul';
        return (
          <ListTag className={`my-6 pr-6 ${block.content.ordered ? 'list-decimal' : 'list-disc'}`}>
            {(block.content.items || []).map((item: string, index: number) => (
              <li key={index} className="mb-2 text-gray-700 leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        );

      default:
        return (
          <div className="my-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600 text-sm">
              نوع محتوى غير مدعوم: {block.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`} style={{ direction: 'rtl' }}>
      {sortedBlocks.map((block) => (
        <div key={block.id}>
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
};

export default ArticleContentRenderer;