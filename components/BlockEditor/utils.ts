import { Block, BlockType, BlockData } from './types';

let blockCounter = 0;

export const generateBlockId = (): string => {
  // استخدام معرف فريد بطريقة آمنة لـ SSR
  const timestamp = typeof window !== 'undefined' ? Date.now() : 0;
  const id = `block_${timestamp}_${blockCounter++}_${Math.random().toString(36).substring(2, 9)}`;
  return id;
};

export const createBlock = (type: BlockType, data?: Partial<BlockData>, order?: number): Block => {
  const defaultData: BlockData = {
    paragraph: { text: '' },
    heading: { text: '', level: 2 },
    image: { url: '', alt: '' },
    video: { url: '' },
    quote: { text: '' },
    list: { items: [''] },
    code: { code: '', language: 'javascript' },
    divider: { style: 'solid' },
    tweet: { url: '' },
    link: { url: '', text: '' },
    table: { rows: [['', ''], ['', '']], headers: ['العمود 1', 'العمود 2'] }
  };

  return {
    id: generateBlockId(),
    type,
    data: { [type]: { ...defaultData[type], ...data?.[type] } } as BlockData,
    order: order ?? 0
  };
};

export const reorderBlocks = (blocks: Block[], fromIndex: number, toIndex: number): Block[] => {
  const result = Array.from(blocks);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  // Update order property
  return result.map((block, index) => ({
    ...block,
    order: index
  }));
};

export const moveBlock = (blocks: Block[], blockId: string, direction: 'up' | 'down'): Block[] => {
  const index = blocks.findIndex(b => b.id === blockId);
  if (index === -1) return blocks;
  
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= blocks.length) return blocks;
  
  return reorderBlocks(blocks, index, newIndex);
};

export const insertBlockAfter = (blocks: Block[], afterId: string, newBlock: Block): Block[] => {
  const index = blocks.findIndex(b => b.id === afterId);
  if (index === -1) return [...blocks, newBlock];
  
  const result = [...blocks];
  result.splice(index + 1, 0, newBlock);
  
  // Update order property
  return result.map((block, index) => ({
    ...block,
    order: index
  }));
};

export const deleteBlock = (blocks: Block[], blockId: string): Block[] => {
  const result = blocks.filter(b => b.id !== blockId);
  
  // Update order property
  return result.map((block, index) => ({
    ...block,
    order: index
  }));
};

export const updateBlock = (blocks: Block[], blockId: string, data: Partial<BlockData>): Block[] => {
  return blocks.map(block => 
    block.id === blockId 
      ? { ...block, data: { ...block.data, ...data } }
      : block
  );
};

export const getBlockIcon = (type: BlockType): string => {
  const icons: Record<BlockType, string> = {
    paragraph: 'Type',
    heading: 'Heading',
    image: 'Image',
    video: 'Video',
    quote: 'Quote',
    list: 'List',
    code: 'Code',
    divider: 'Minus',
    tweet: 'Twitter',
    link: 'Link',
    table: 'Table'
  };
  return icons[type] || 'Type';
};

export const getBlockTitle = (type: BlockType): string => {
  const titles: Record<BlockType, string> = {
    paragraph: 'فقرة',
    heading: 'عنوان',
    image: 'صورة',
    video: 'فيديو',
    quote: 'اقتباس',
    list: 'قائمة',
    code: 'كود',
    divider: 'فاصل',
    tweet: 'تغريدة',
    link: 'رابط',
    table: 'جدول'
  };
  return titles[type] || 'فقرة';
}; 