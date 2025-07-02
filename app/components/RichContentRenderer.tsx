'use client';

import React from 'react';
import { Play, Quote } from 'lucide-react';

interface Block {
  id?: string;
  type: string;
  data?: any;
  content?: string;
  text?: string;
  level?: number;
  items?: string[];
  ordered?: boolean;
  style?: string;
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
  author?: string;
  code?: string;
  embed?: string;
}

interface RichContentRendererProps {
  content: string;
  className?: string;
}

export default function RichContentRenderer({ content, className = '' }: RichContentRendererProps) {
  
  // دالة لتحويل روابط YouTube إلى embed
  const getVideoEmbed = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  // دالة لعرض البلوك حسب نوعه
  const renderBlock = (block: Block, index: number) => {
    const blockType = block.type;
    const blockData = block.data?.[blockType] || block.data || {};
    
    switch (blockType) {
      case 'paragraph':
        const paragraphText = blockData.text || block.text || block.content || '';
        if (!paragraphText) return null;
        
        // معالجة النص لدعم التنسيقات البسيطة
        const formattedText = paragraphText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
        
        return (
          <p 
            key={block.id || index} 
            className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        );
      
      case 'heading':
        const headingText = blockData.text || block.text || block.content || '';
        const level = blockData.level || block.level || 2;
        if (!headingText) return null;
        
        const headingClasses = {
          1: "text-4xl font-bold mt-12 mb-6 text-gray-900 dark:text-white heading-1",
          2: "text-3xl font-bold mt-10 mb-5 text-gray-900 dark:text-white heading-2",
          3: "text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white heading-3",
          4: "text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white heading-4",
          5: "text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white heading-5",
          6: "text-base font-bold mt-3 mb-2 text-gray-900 dark:text-white heading-6"
        };
        
        // استخدام React.createElement بدلاً من JSX dynamic tags
        return React.createElement(
          `h${level}`,
          {
            key: block.id || index,
            className: headingClasses[level as keyof typeof headingClasses] || headingClasses[2]
          },
          headingText
        );
      
      case 'quote':
        const quoteText = blockData.text || block.text || block.content || '';
        if (!quoteText) return null;
        
        return (
          <blockquote key={block.id || index} className="relative my-10 px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl border-r-4 border-blue-500 shadow-lg">
            <Quote className="absolute -top-3 -right-3 w-10 h-10 text-blue-200 dark:text-blue-800" />
            <p className="relative z-10 text-lg text-gray-700 dark:text-gray-300 italic leading-relaxed">
              {quoteText}
            </p>
            {blockData.author && (
              <cite className="block mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium not-italic">
                — {blockData.author}
              </cite>
            )}
          </blockquote>
        );
      
      case 'list':
        const listItems = blockData.items || block.items || [];
        const isOrdered = blockData.style === 'ordered' || block.ordered;
        if (listItems.length === 0) return null;
        
        const ListTag = isOrdered ? 'ol' : 'ul';
        return (
          <ListTag 
            key={block.id || index} 
            className={`mb-6 space-y-2 ${isOrdered ? 'list-decimal' : 'list-disc'} list-inside mr-6`}
          >
            {listItems.map((item: string, i: number) => (
              <li key={i} className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        );
      
      case 'image':
        const imageUrl = blockData.url || blockData.file?.url || block.url || block.src;
        if (!imageUrl) return null;
        
        return (
          <figure key={block.id || index} className="my-10">
            <div className="relative rounded-2xl overflow-hidden shadow-xl group">
              <img
                src={imageUrl}
                alt={blockData.alt || block.alt || ''}
                className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* تأثير التكبير عند الهوفر */}
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </div>
            {(blockData.caption || block.caption) && (
              <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4 italic">
                {blockData.caption || block.caption}
              </figcaption>
            )}
          </figure>
        );
      
      case 'video':
        const videoUrl = blockData.url || block.url || block.src;
        if (!videoUrl) return null;
        
        return (
          <figure key={block.id || index} className="my-10">
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-lg opacity-80">
                  <Play className="w-10 h-10 text-gray-700 dark:text-gray-300 mr-1" />
                </div>
              </div>
              <iframe
                src={getVideoEmbed(videoUrl)}
                className="w-full aspect-video"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            {(blockData.caption || block.caption) && (
              <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4 italic">
                {blockData.caption || block.caption}
              </figcaption>
            )}
          </figure>
        );
      
      case 'divider':
        return (
          <hr key={block.id || index} className="my-12 border-t-2 border-gray-200 dark:border-gray-700 w-1/2 mx-auto relative">
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-50 dark:bg-gray-900 px-4 text-gray-400 dark:text-gray-600">
              ◆ ◆ ◆
            </span>
          </hr>
        );
      
      case 'code':
        const codeText = blockData.code || block.code || blockData.text || '';
        const language = blockData.language || 'javascript';
        if (!codeText) return null;
        
        return (
          <div key={block.id || index} className="my-6 relative">
            <div className="absolute top-0 right-0 px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-br-lg rounded-tl-lg">
              {language}
            </div>
            <pre className="p-6 pt-10 bg-gray-900 dark:bg-gray-950 rounded-2xl overflow-x-auto shadow-xl">
              <code className="text-gray-100 text-sm font-mono leading-relaxed">
                {codeText}
              </code>
            </pre>
          </div>
        );
      
      case 'table':
        const tableData = blockData.content || block.content || [];
        if (!tableData.length) return null;
        
        return (
          <div key={block.id || index} className="my-8 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 shadow-lg rounded-lg overflow-hidden">
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tableData.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'embed':
        const embedUrl = blockData.url || block.url || '';
        const embedCode = blockData.embed || block.embed || '';
        
        if (embedCode) {
          return (
            <div 
              key={block.id || index} 
              className="my-8 rounded-2xl overflow-hidden shadow-xl"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          );
        }
        
        if (embedUrl) {
          // دعم تضمين تويتر
          if (embedUrl.includes('twitter.com') || embedUrl.includes('x.com')) {
            return (
              <div key={block.id || index} className="my-8 flex justify-center">
                <blockquote className="twitter-tweet">
                  <a href={embedUrl}>Loading tweet...</a>
                </blockquote>
              </div>
            );
          }
          
          // تضمينات أخرى
          return (
            <div key={block.id || index} className="my-8 rounded-2xl overflow-hidden shadow-xl">
              <iframe
                src={embedUrl}
                className="w-full h-96"
                allowFullScreen
              />
            </div>
          );
        }
        return null;
      
      case 'columns':
        const columns = blockData.columns || [];
        if (!columns.length) return null;
        
        return (
          <div key={block.id || index} className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns.map((column: any, colIndex: number) => (
              <div key={colIndex} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                {column.blocks?.map((subBlock: Block, subIndex: number) => 
                  renderBlock(subBlock, `${index}-${colIndex}-${subIndex}` as any)
                )}
              </div>
            ))}
          </div>
        );
      
      case 'callout':
        const calloutText = blockData.text || block.text || '';
        const calloutType = blockData.type || 'info';
        if (!calloutText) return null;
        
        const calloutStyles = {
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-900 dark:text-yellow-100',
          error: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-100',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900 dark:text-green-100'
        };
        
        return (
          <div 
            key={block.id || index} 
            className={`my-6 p-6 rounded-xl border-r-4 ${calloutStyles[calloutType as keyof typeof calloutStyles] || calloutStyles.info}`}
          >
            <p className="text-lg leading-relaxed">{calloutText}</p>
          </div>
        );
      
      default:
        // للبلوكات غير المدعومة، نحاول عرض النص إن وجد
        const defaultText = blockData.text || block.text || block.content || '';
        if (!defaultText) return null;
        
        return (
          <p key={block.id || index} className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {defaultText}
          </p>
        );
    }
  };
  
  try {
    // محاولة تحليل المحتوى كـ JSON blocks
    const blocks = JSON.parse(content);
    
    if (Array.isArray(blocks)) {
      return (
        <div className={`article-content ${className}`} lang="ar" dir="rtl">
          {blocks.map((block: Block, index: number) => renderBlock(block, index))}
          
          {/* إضافة سكربت تويتر إذا كان هناك تضمينات تويتر */}
          {blocks.some(block => block.type === 'embed' && (block.data?.url || block.url || '').includes('twitter.com')) && (
            <script async src="https://platform.twitter.com/widgets.js" charSet="utf-8"></script>
          )}
        </div>
      );
    }
  } catch (e) {
    // إذا فشل التحليل، المحتوى ليس JSON
    console.log('Content is not JSON blocks, rendering as HTML');
  }
  
  // عرض المحتوى كـ HTML إذا لم يكن JSON
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: content }}
      className={`article-content prose prose-lg prose-gray dark:prose-invert max-w-none ${className}`}
      lang="ar"
      dir="rtl"
    />
  );
} 