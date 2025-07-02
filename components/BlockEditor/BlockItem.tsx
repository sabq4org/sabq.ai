'use client';

import React, { useState } from 'react';
import { Block, BlockData, AIAction } from './types';
import { moveBlock, deleteBlock, updateBlock, createBlock, insertBlockAfter, getBlockTitle } from './utils';
import BlockToolbar from './BlockToolbar';
import BlockMenu from './BlockMenu';
import { ParagraphBlock, HeadingBlock, ImageBlock, VideoBlock, QuoteBlock, ListBlock, DividerBlock, TweetBlock, LinkBlock, TableBlock } from './blocks';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { Code } from 'lucide-react';

interface BlockItemProps {
  block: Block;
  blocks: Block[];
  index: number;
  onChange: (blocks: Block[]) => void;
  onAIAction?: (action: AIAction) => Promise<void>;
  readOnly?: boolean;
  autoFocus?: boolean;
  dragHandleProps?: any; // من react-beautiful-dnd
}

export default function BlockItem({
  block,
  blocks,
  index,
  onChange,
  onAIAction,
  readOnly = false,
  autoFocus = false,
  dragHandleProps
}: BlockItemProps) {
  const { darkMode } = useDarkModeContext();
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (direction: 'up' | 'down') => {
    onChange(moveBlock(blocks, block.id, direction));
  };

  const handleDelete = () => {
    onChange(deleteBlock(blocks, block.id));
  };

  const handleAddAfter = () => {
    const newBlock = createBlock('paragraph', {}, block.order + 1);
    onChange(insertBlockAfter(blocks, block.id, newBlock));
  };

  const handleDuplicate = () => {
    const newBlock = {
      ...block,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: block.order + 1
    };
    onChange(insertBlockAfter(blocks, block.id, newBlock));
  };

  const handleUpdate = (data: Partial<BlockData>) => {
    console.log('BlockItem handleUpdate called:', { blockId: block.id, data });
    onChange(updateBlock(blocks, block.id, data));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('BlockItem handleKeyDown:', e.key);
    // Enter key - create new paragraph block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddAfter();
    }
    
    // Backspace at start - delete if empty
    if (e.key === 'Backspace') {
      const target = e.target as any;
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        const blockData = block.data[block.type] as any;
        if (!blockData?.text && !blockData?.url) {
          e.preventDefault();
          handleDelete();
        }
      }
    }
  };

  const handleAIActionWrapper = async (action: AIAction) => {
    if (onAIAction) {
      await onAIAction(action);
    }
  };

  const renderBlock = () => {
    const blockData = block.data[block.type] || {};
    
    switch (block.type) {
      case 'paragraph':
        return (
          <ParagraphBlock
            data={blockData as any}
            onChange={handleUpdate}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            autoFocus={autoFocus}
          />
        );
      
      case 'heading':
        return (
          <HeadingBlock
            data={blockData as any}
            onChange={handleUpdate}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            autoFocus={autoFocus}
          />
        );
      
      case 'image':
        return (
          <ImageBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      case 'video':
        return (
          <VideoBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      case 'quote':
        return (
          <QuoteBlock
            data={blockData as any}
            onChange={handleUpdate}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            autoFocus={autoFocus}
          />
        );
      
      case 'list':
        return (
          <ListBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      case 'divider':
        return (
          <DividerBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      case 'tweet':
        return (
          <TweetBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      case 'link':
        return (
          <LinkBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      case 'table':
        return (
          <TableBlock
            data={blockData as any}
            onChange={handleUpdate}
            readOnly={readOnly}
          />
        );
      
      // البلوكات غير المكتملة
      case 'code':
        return (
          <div className={`p-6 rounded-lg text-center border-2 border-dashed ${
            darkMode 
              ? 'bg-gray-800/50 text-gray-400 border-gray-700' 
              : 'bg-gray-50 text-gray-600 border-gray-300'
          }`}>
            <div className="mb-2">
              <Code className="w-8 h-8 mx-auto opacity-50" />
            </div>
            <p className="font-medium mb-1">بلوك {getBlockTitle(block.type)}</p>
            <p className="text-sm opacity-75">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
            <button
              onClick={handleDelete}
              className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-red-900/50 hover:bg-red-900 text-red-400'
                  : 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            >
              حذف البلوك
            </button>
          </div>
        );

      // البلوكات الأخرى غير المعرّفة
      default:
        return (
          <div className={`p-4 rounded-lg text-center ${
            darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}>
            بلوك غير معرف: {block.type}
          </div>
        );
    }
  };

  return (
    <div 
      className={`group relative ${
        isDragging ? 'opacity-50' : ''
      }`}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {/* Block content */}
      <div className={`relative px-4 py-2 rounded-lg transition-colors ${
        darkMode 
          ? 'hover:bg-gray-800/50' 
          : 'hover:bg-gray-50/50'
      }`}>
        {renderBlock()}
      </div>

      {/* Toolbar - visible on hover */}
      {!readOnly && (
        <BlockToolbar
          blockId={block.id}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
          onMove={handleMove}
          onDelete={handleDelete}
          onAddAfter={handleAddAfter}
          onAIAction={onAIAction ? handleAIActionWrapper : undefined}
          onDuplicate={handleDuplicate}
          isDragging={isDragging}
          dragHandleProps={dragHandleProps}
        />
      )}

      {/* Add block button between blocks */}
      {!readOnly && (
        <div className="relative h-0 group/add">
          <div className="absolute inset-x-0 -bottom-4 h-8 flex items-center justify-center opacity-0 group-hover/add:opacity-100 transition-opacity">
            <BlockMenu
              onSelect={(type) => {
                const newBlock = createBlock(type, {}, block.order + 1);
                onChange(insertBlockAfter(blocks, block.id, newBlock));
              }}
              trigger={
                <button className={`px-2 py-1 rounded-full transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
} 