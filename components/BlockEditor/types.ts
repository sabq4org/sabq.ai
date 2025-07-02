export type BlockType = 
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'video'
  | 'quote'
  | 'list'
  | 'code'
  | 'divider'
  | 'tweet'
  | 'link'
  | 'table';

export interface BlockData {
  paragraph?: { text: string; alignment?: 'left' | 'center' | 'right' | 'justify' };
  heading?: { text: string; level: 1 | 2 | 3 | 4 | 5 | 6; alignment?: 'left' | 'center' | 'right' };
  image?: { url: string; alt?: string; caption?: string; width?: number; height?: number };
  video?: { url: string; caption?: string; provider?: 'youtube' | 'vimeo' | 'other' };
  quote?: { text: string; author?: string; alignment?: 'left' | 'center' | 'right' };
  list?: { items: string[]; ordered?: boolean };
  code?: { code: string; language?: string };
  divider?: { style?: 'solid' | 'dashed' | 'dotted' };
  tweet?: { url: string; id?: string };
  link?: { url: string; text?: string; preview?: boolean };
  table?: { rows: string[][]; headers?: string[] };
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
  order: number;
}

export interface AIAction {
  type: 'generate' | 'improve' | 'expand' | 'summarize' | 'translate' | 'rephrase';
  blockId: string;
  content?: string;
}

export interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onAIAction?: (action: AIAction) => Promise<void>;
  placeholder?: string;
  readOnly?: boolean;
} 