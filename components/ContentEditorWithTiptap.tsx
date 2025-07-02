'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Image as ImageIcon, Sparkles
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

// Dynamic import for the Editor to avoid SSR issues
const Editor = dynamic(() => import('./Editor/Editor'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-lg" />
});

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'quote' | 'image' | 'video' | 'tweet' | 'list' | 'link' | 'highlight';
  content: any;
  order: number;
}

interface ContentEditorProps {
  formData: {
    title: string;
    subtitle: string;
    description: string;
    category_id: number;
    content_blocks: ContentBlock[];
    keywords: string[];
    featured_image?: string;
    featured_image_alt?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  categories: any[];
  onGenerateTitle?: () => void;
  onGenerateDescription?: () => void;
  aiLoading?: { [key: string]: boolean };
}

export default function ContentEditorWithTiptap({
  formData,
  setFormData,
  categories,
  onGenerateTitle,
  onGenerateDescription,
  aiLoading = {}
}: ContentEditorProps) {
  const { darkMode } = useDarkModeContext();
  const editorRef = useRef<any>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<string>('');
  const [aiLoading2, setAiLoading2] = useState(false);

  // تحويل content_blocks إلى HTML/JSON للمحرر
  const convertBlocksToEditorContent = () => {
    if (!formData.content_blocks || formData.content_blocks.length === 0) {
      return '';
    }

    let html = '';
    formData.content_blocks.forEach(block => {
      switch (block.type) {
        case 'paragraph':
          html += `<p>${block.content.text || ''}</p>`;
          break;
        case 'heading':
          const level = block.content.level || 2;
          html += `<h${level}>${block.content.text || ''}</h${level}>`;
          break;
        case 'quote':
          html += `<blockquote>${block.content.text || ''}</blockquote>`;
          break;
        case 'list':
          const items = block.content.items || [];
          html += `<ul>${items.map((item: string) => `<li>${item}</li>`).join('')}</ul>`;
          break;
        case 'image':
          html += `<img src="${block.content.url}" alt="${block.content.alt || ''}" />`;
          break;
        default:
          // للأنواع الأخرى، نضيف كفقرة
          html += `<p>${JSON.stringify(block.content)}</p>`;
      }
    });

    return html;
  };

  // تحويل محتوى المحرر إلى content_blocks
  const convertEditorToBlocks = (editorData: any) => {
    const blocks: ContentBlock[] = [];
    let order = 0;

    if (editorData.json && editorData.json.content) {
      editorData.json.content.forEach((node: any) => {
        order++;
        const id = `block_${Date.now()}_${order}`;

        switch (node.type) {
          case 'paragraph':
            if (node.content && node.content.length > 0) {
              blocks.push({
                id,
                type: 'paragraph',
                content: { text: node.content.map((c: any) => c.text || '').join('') },
                order
              });
            }
            break;
          
          case 'heading':
            if (node.content && node.content.length > 0) {
              blocks.push({
                id,
                type: 'heading',
                content: { 
                  text: node.content.map((c: any) => c.text || '').join(''),
                  level: node.attrs?.level || 2
                },
                order
              });
            }
            break;
          
          case 'blockquote':
            if (node.content && node.content.length > 0) {
              const text = node.content.map((p: any) => 
                p.content ? p.content.map((c: any) => c.text || '').join('') : ''
              ).join('\n');
              blocks.push({
                id,
                type: 'quote',
                content: { text },
                order
              });
            }
            break;
          
          case 'bulletList':
          case 'orderedList':
            const items: string[] = [];
            node.content.forEach((li: any) => {
              if (li.content && li.content.length > 0) {
                const itemText = li.content.map((p: any) => 
                  p.content ? p.content.map((c: any) => c.text || '').join('') : ''
                ).join('');
                items.push(itemText);
              }
            });
            if (items.length > 0) {
              blocks.push({
                id,
                type: 'list',
                content: { items, ordered: node.type === 'orderedList' },
                order
              });
            }
            break;
          
          case 'image':
            blocks.push({
              id,
              type: 'image',
              content: { 
                url: node.attrs?.src || '',
                alt: node.attrs?.alt || ''
              },
              order
            });
            break;
          
          // يمكن إضافة المزيد من الأنواع هنا
        }
      });
    }

    return blocks;
  };

  // معالج تغيير المحتوى
  const handleEditorChange = (content: any) => {
    const blocks = convertEditorToBlocks(content);
    setFormData((prev: any) => ({
      ...prev,
      content_blocks: blocks
    }));
  };

  // معالج إجراءات الذكاء الاصطناعي
  const handleAIAction = async (action: string, content: string) => {
    setAiAction(action);
    setAiLoading2(true);

    try {
      const response = await fetch('/api/ai/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, content })
      });

      const data = await response.json();
      
      if (data.result && window.editorInsertAIResult) {
        window.editorInsertAIResult(data.result);
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('حدث خطأ في معالجة طلب الذكاء الاصطناعي');
    } finally {
      setAiLoading2(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {/* العنوان */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              العنوان الرئيسي
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="اكتب عنواناً جذاباً للمقال..."
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                maxLength={100}
              />
              {onGenerateTitle && (
                <button
                  onClick={onGenerateTitle}
                  disabled={aiLoading.title}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50"
                  title="توليد عنوان بالذكاء الاصطناعي"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-left">
              {formData.title.length}/100
            </div>
          </div>

          {/* العنوان الفرعي */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              العنوان الفرعي (اختياري)
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="أضف عنواناً فرعياً إن أردت..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* الوصف */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              وصف المقال
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب وصفاً مختصراً يظهر في محركات البحث..."
                rows={3}
                maxLength={160}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
              {onGenerateDescription && (
                <button
                  onClick={onGenerateDescription}
                  disabled={aiLoading.description}
                  className="absolute left-2 top-2 p-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50"
                  title="توليد وصف بالذكاء الاصطناعي"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-left">
              {formData.description.length}/160
            </div>
          </div>

          {/* التصنيف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                التصنيف
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, category_id: parseInt(e.target.value) }))}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-100' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="">اختر التصنيف</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* صورة البارزة */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                الصورة البارزة
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.featured_image || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="رابط الصورة البارزة..."
                  className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button className="px-4 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* المحرر */}
      <div className="p-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
          محتوى المقال
        </label>
        <Editor
          ref={editorRef}
          content={convertBlocksToEditorContent()}
          onChange={handleEditorChange}
          placeholder="ابدأ كتابة محتوى مقالك هنا..."
          enableAI={true}
          onAIAction={handleAIAction}
        />
      </div>

      {/* مؤشر حالة الذكاء الاصطناعي */}
      {aiLoading2 && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>جارٍ معالجة طلب الذكاء الاصطناعي...</span>
        </div>
      )}
    </div>
  );
}

// تعريف نوع لـ window
declare global {
  interface Window {
    editorInsertAIResult?: (result: string) => void;
  }
} 