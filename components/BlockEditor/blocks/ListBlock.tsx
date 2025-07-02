'use client';

import React, { useState } from 'react';
import { List, ListOrdered, Plus, Trash2 } from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';

interface ListBlockProps {
  data: { items: string[]; ordered?: boolean };
  onChange: (data: any) => void;
  readOnly?: boolean;
}

export default function ListBlock({ data, onChange, readOnly = false }: ListBlockProps) {
  const { darkMode } = useDarkModeContext();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...data.items];
    newItems[index] = value;
    onChange({ 
      list: { 
        ...data, 
        items: newItems 
      } 
    });
  };

  const handleAddItem = () => {
    onChange({ 
      list: { 
        ...data, 
        items: [...data.items, ''] 
      } 
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    onChange({ 
      list: { 
        ...data, 
        items: newItems.length > 0 ? newItems : [''] 
      } 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newItems = [...data.items];
      newItems.splice(index + 1, 0, '');
      onChange({ 
        list: { 
          ...data, 
          items: newItems 
        } 
      });
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-list-item]`);
        const nextInput = inputs[index + 1] as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }, 0);
    } else if (e.key === 'Backspace' && data.items[index] === '' && data.items.length > 1) {
      e.preventDefault();
      handleRemoveItem(index);
      setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-list-item]`);
        const prevInput = inputs[Math.max(0, index - 1)] as HTMLInputElement;
        if (prevInput) prevInput.focus();
      }, 0);
    }
  };

  const toggleListType = () => {
    onChange({ 
      list: { 
        ...data, 
        ordered: !data.ordered 
      } 
    });
  };

  if (readOnly) {
    const ListTag = data.ordered ? 'ol' : 'ul';
    return (
      <ListTag className={`${
        data.ordered ? 'list-decimal' : 'list-disc'
      } pr-6 space-y-1 ${
        darkMode ? 'text-gray-200' : 'text-gray-800'
      }`}>
        {data.items.filter(item => item.trim()).map((item, index) => (
          <li key={index} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ListTag>
    );
  }

  return (
    <div className="space-y-2">
      {/* List type toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={toggleListType}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={data.ordered ? 'تحويل إلى قائمة نقطية' : 'تحويل إلى قائمة رقمية'}
        >
          {data.ordered ? <ListOrdered className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {data.ordered ? 'قائمة رقمية' : 'قائمة نقطية'}
        </span>
      </div>

      {/* List items */}
      <div className="space-y-1">
        {data.items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-start gap-2 group"
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
          >
            <span className={`mt-2 w-6 text-sm ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {data.ordered ? `${index + 1}.` : '•'}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              placeholder="عنصر القائمة..."
              data-list-item
              className={`flex-1 px-2 py-1 bg-transparent outline-none transition-all ${
                darkMode 
                  ? 'text-gray-200 placeholder-gray-600' 
                  : 'text-gray-800 placeholder-gray-400'
              } ${
                focusedIndex === index 
                  ? darkMode 
                    ? 'border-b border-gray-700' 
                    : 'border-b border-gray-300'
                  : 'border-b border-transparent'
              }`}
            />
            {data.items.length > 1 && focusedIndex === index && (
              <button
                onClick={() => handleRemoveItem(index)}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="حذف العنصر"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add item button */}
      <button
        onClick={handleAddItem}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          darkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }`}
      >
        <Plus className="w-3 h-3" />
        <span>إضافة عنصر</span>
      </button>
    </div>
  );
} 