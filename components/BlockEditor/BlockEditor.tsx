'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DroppableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Block, BlockEditorProps, AIAction, BlockType } from './types';
import { createBlock, reorderBlocks } from './utils';
import BlockItem from './BlockItem';
import BlockMenu from './BlockMenu';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { Plus } from 'lucide-react';

export default function BlockEditor({
  blocks,
  onChange,
  onAIAction,
  placeholder = 'ابدأ الكتابة أو اضغط "/" لإضافة بلوك...',
  readOnly = false
}: BlockEditorProps) {
  const { darkMode } = useDarkModeContext();
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const handleBlocksChange = (newBlocks: Block[]) => {
    setLocalBlocks(newBlocks);
    onChange(newBlocks);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newBlocks = reorderBlocks(
      localBlocks,
      result.source.index,
      result.destination.index
    );

    handleBlocksChange(newBlocks);
  };

  const handleAddFirstBlock = (type: BlockType) => {
    const newBlock = createBlock(type, {}, 0);
    handleBlocksChange([newBlock]);
  };

  const handleAIActionWrapper = async (action: AIAction) => {
    if (onAIAction) {
      await onAIAction(action);
    }
  };

  // If no blocks, show empty state
  if (localBlocks.length === 0 && !readOnly) {
    return (
      <div className={`min-h-[400px] rounded-xl border-2 border-dashed p-8 ${
        darkMode 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-gray-50 border-gray-300'
      }`}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`mb-4 p-4 rounded-full ${
            darkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <Plus className={`w-8 h-8 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
          
          <h3 className={`text-lg font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            ابدأ إنشاء المحتوى
          </h3>
          
          <p className={`mb-6 ${
            darkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {placeholder}
          </p>
          
          <BlockMenu
            onSelect={handleAddFirstBlock}
            trigger={
              <button className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}>
                إضافة أول بلوك
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="space-y-4">
        {localBlocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            blocks={localBlocks}
            index={index}
            onChange={handleBlocksChange}
            readOnly={true}
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="blocks">
        {(provided: DroppableProvided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`min-h-[400px] space-y-2 p-4 rounded-xl relative ${
              darkMode 
                ? 'bg-gray-900' 
                : 'bg-gray-50'
            }`}
            style={{ zIndex: 1 }}
          >
            {localBlocks.map((block, index) => (
              <Draggable key={block.id} draggableId={block.id} index={index}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={provided.draggableProps.style}
                    className={snapshot.isDragging ? 'opacity-50' : ''}
                  >
                    <BlockItem
                      block={block}
                      blocks={localBlocks}
                      index={index}
                      onChange={handleBlocksChange}
                      onAIAction={onAIAction ? handleAIActionWrapper : undefined}
                      autoFocus={index === localBlocks.length - 1}
                      dragHandleProps={provided.dragHandleProps}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Add block at end */}
            <div className="pt-4 pb-8">
              <BlockMenu
                onSelect={(type) => {
                  const newBlock = createBlock(type, {}, localBlocks.length);
                  handleBlocksChange([...localBlocks, newBlock]);
                }}
                trigger={
                  <button className={`w-full py-3 rounded-lg border-2 border-dashed transition-colors ${
                    darkMode 
                      ? 'border-gray-700 hover:border-gray-600 text-gray-500 hover:text-gray-400' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500'
                  }`}>
                    <Plus className="w-5 h-5 mx-auto" />
                  </button>
                }
              />
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
} 