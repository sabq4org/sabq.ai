'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import BlockEditor from './BlockEditor/BlockEditor';
import { Block, AIAction } from './BlockEditor/types';

interface ContentEditorProps {
  formData: {
    title: string;
    subtitle: string;
    description: string;
    category_id: string | number;
    content_blocks: Block[];
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

export default function ContentEditorWithBlocks({
  formData,
  setFormData,
  categories,
  onGenerateTitle,
  onGenerateDescription,
  aiLoading = {}
}: ContentEditorProps) {
  const { darkMode } = useDarkModeContext();
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);

  // تحويل البلوكات القديمة إلى تنسيق البلوكات الجديد إذا لزم الأمر
  const convertToBlocks = useCallback((blocks: any[]): Block[] => {
    if (!blocks || blocks.length === 0) {
      // استخدام معرف ثابت للبلوك الافتراضي
      return [{
        id: 'default_block_0',
        type: 'paragraph',
        data: { paragraph: { text: '' } },
        order: 0
      }];
    }
    
    // إذا كانت البلوكات بالتنسيق الصحيح، أعدها كما هي
    if (blocks[0]?.id && blocks[0]?.type && blocks[0]?.data) {
      return blocks;
    }
    
    // تحويل من التنسيق القديم باستخدام معرفات ثابتة
    return blocks.map((block, index) => {
      if (block.type && block.content) {
        const data: any = {};
        data[block.type] = block.content;
        return {
          id: `converted_block_${index}`,
          type: block.type,
          data,
          order: index
        };
      }
      return {
        id: `default_block_${index}`,
        type: 'paragraph',
        data: { paragraph: { text: '' } },
        order: index
      };
    });
  }, []);

  const handleBlocksChange = (blocks: Block[]) => {
    console.log('ContentEditorWithBlocks - handleBlocksChange:', blocks);
    setFormData((prev: any) => ({
      ...prev,
      content_blocks: blocks
    }));
  };

  const handleAIAction = useCallback(async (action: AIAction) => {
    setAiProcessing(action.blockId);
    
    try {
      const block = formData.content_blocks.find(b => b.id === action.blockId);
      if (!block) return;

      // استخراج النص بناءً على نوع البلوك
      let contentText = '';
      const blockData = block.data[block.type];
      if (blockData && typeof blockData === 'object' && 'text' in blockData) {
        contentText = blockData.text || '';
      }

      const response = await fetch('/api/ai/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action.type,
          content: contentText,
          type: block.type
        })
      });

      const data = await response.json();
      
      if (data.result) {
        // تحديث البلوك بالنتيجة
        const updatedBlocks = formData.content_blocks.map(b => {
          if (b.id === action.blockId) {
            const newData = { ...b.data };
            if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') {
              const existingData = newData[b.type] || {};
              if (b.type === 'heading') {
                newData[b.type] = { 
                  ...existingData, 
                  text: data.result, 
                  level: (existingData as any).level || 2 
                };
              } else {
                newData[b.type] = { ...existingData, text: data.result };
              }
            }
            return { ...b, data: newData };
          }
          return b;
        });
        
        handleBlocksChange(updatedBlocks);
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('حدث خطأ في معالجة طلب الذكاء الاصطناعي');
    } finally {
      setAiProcessing(null);
    }
  }, [formData.content_blocks]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl">
      {/* محرر البلوكات */}
      <div className="p-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
          محتوى المقال
        </label>
        
        <BlockEditor
          blocks={useMemo(() => convertToBlocks(formData.content_blocks), [formData.content_blocks, convertToBlocks])}
          onChange={handleBlocksChange}
          onAIAction={handleAIAction}
          placeholder="ابدأ كتابة محتوى مقالك أو اضغط على + لإضافة بلوك..."
          readOnly={false}
        />
      </div>

      {/* مؤشر حالة الذكاء الاصطناعي */}
      {aiProcessing && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>جارٍ معالجة طلب الذكاء الاصطناعي...</span>
        </div>
      )}
    </div>
  );
} 