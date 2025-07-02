'use client';

import React, { useState } from 'react';
import {
  GripVertical, ArrowUp, ArrowDown, Trash2, Plus,
  Sparkles, Copy, MoreVertical, Wand2, RefreshCw, Languages, Hash
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { AIAction } from './types';

interface BlockToolbarProps {
  blockId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onAddAfter: () => void;
  onAIAction?: (action: AIAction) => void;
  onDuplicate: () => void;
  isDragging?: boolean;
  dragHandleProps?: any; // من react-beautiful-dnd
}

export default function BlockToolbar({
  blockId,
  isFirst,
  isLast,
  onMove,
  onDelete,
  onAddAfter,
  onAIAction,
  onDuplicate,
  isDragging,
  dragHandleProps
}: BlockToolbarProps) {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { darkMode } = useDarkModeContext();

  const aiActions = [
    { type: 'generate' as const, label: 'توليد محتوى', icon: Wand2 },
    { type: 'improve' as const, label: 'تحسين النص', icon: Sparkles },
    { type: 'expand' as const, label: 'توسيع المحتوى', icon: Plus },
    { type: 'summarize' as const, label: 'تلخيص', icon: Hash },
    { type: 'rephrase' as const, label: 'إعادة صياغة', icon: RefreshCw },
    { type: 'translate' as const, label: 'ترجمة', icon: Languages }
  ];

  const handleAIAction = (type: AIAction['type']) => {
    if (onAIAction) {
      onAIAction({ type, blockId });
    }
    setShowAIMenu(false);
  };

  return (
    <div className={`absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
      isDragging ? 'opacity-100' : ''
    }`} style={{ zIndex: 999999 }}>
      {/* Drag Handle */}
      <button
        {...(dragHandleProps || {})}
        className={`p-1.5 rounded cursor-move ${
          darkMode 
            ? 'hover:bg-gray-700 text-gray-500' 
            : 'hover:bg-gray-100 text-gray-400'
        }`}
        title="اسحب لإعادة الترتيب"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Move Up */}
      <button
        onClick={() => onMove('up')}
        disabled={isFirst}
        className={`p-1.5 rounded transition-colors ${
          isFirst 
            ? 'opacity-30 cursor-not-allowed' 
            : darkMode 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="نقل لأعلى"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {/* Move Down */}
      <button
        onClick={() => onMove('down')}
        disabled={isLast}
        className={`p-1.5 rounded transition-colors ${
          isLast 
            ? 'opacity-30 cursor-not-allowed' 
            : darkMode 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
        }`}
        title="نقل لأسفل"
      >
        <ArrowDown className="w-4 h-4" />
      </button>

      {/* AI Actions */}
      {onAIAction && (
        <div className="relative">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            className={`p-1.5 rounded transition-colors ${
              darkMode 
                ? 'hover:bg-purple-900 text-purple-400' 
                : 'hover:bg-purple-100 text-purple-600'
            }`}
            title="إجراءات الذكاء الاصطناعي"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {showAIMenu && (
            <div 
              className={`absolute left-full ml-2 top-0 w-48 rounded-lg shadow-xl z-[9999] ai-menu-dropdown ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}
              style={{ zIndex: 999999 }}
            >
              {aiActions.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => handleAIAction(type)}
                  className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* More Actions */}
      <div className="relative">
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`p-1.5 rounded transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="المزيد"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMoreMenu && (
          <div 
            className={`absolute left-full ml-2 top-0 w-40 rounded-lg shadow-xl z-[9999] block-toolbar-dropdown ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            style={{ zIndex: 999999 }}
          >
            <button
              onClick={() => {
                onAddAfter();
                setShowMoreMenu(false);
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة بلوك بعد</span>
            </button>
            
            <button
              onClick={() => {
                onDuplicate();
                setShowMoreMenu(false);
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-200' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>تكرار البلوك</span>
            </button>
            
            <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            
            <button
              onClick={() => {
                onDelete();
                setShowMoreMenu(false);
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                darkMode 
                  ? 'hover:bg-red-900 text-red-400' 
                  : 'hover:bg-red-50 text-red-600'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف البلوك</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 