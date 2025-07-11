"use client";

import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Video,
  Music,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Palette,
  CheckSquare
} from 'lucide-react';

interface EditorToolbarProps {
  editor: any;
  onMediaClick: (type: 'image' | 'video' | 'audio') => void;
  onLinkClick: () => void;
  onTableClick: () => void;
  characterCount: number;
  maxLength: number;
}

export function EditorToolbar({
  editor,
  onMediaClick,
  onLinkClick,
  onTableClick,
  characterCount,
  maxLength
}: EditorToolbarProps) {
  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    title, 
    children 
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" />
  );

  return (
    <div className="border-b bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-1">
        {/* التراجع والإعادة */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="تراجع"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="إعادة"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* العناوين */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="عنوان 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="عنوان 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="عنوان 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* تنسيق النص */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="عريض"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="مائل"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="تسطير"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="يتوسطه خط"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="تمييز"
        >
          <Palette className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* محاذاة النص */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="محاذاة يسار"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="محاذاة وسط"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="محاذاة يمين"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="ضبط"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* القوائم */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="قائمة نقطية"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="قائمة مرقمة"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="قائمة مهام"
        >
          <CheckSquare className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* اقتباس وكود */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="اقتباس"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="كتلة كود"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* الوسائط والروابط */}
        <ToolbarButton
          onClick={() => onMediaClick('image')}
          title="إدراج صورة"
        >
          <Image className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => onMediaClick('video')}
          title="إدراج فيديو"
        >
          <Video className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => onMediaClick('audio')}
          title="إدراج ملف صوتي"
        >
          <Music className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={onLinkClick}
          isActive={editor.isActive('link')}
          title="إدراج رابط"
        >
          <Link className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={onTableClick}
          title="إدراج جدول"
        >
          <Table className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* عداد الأحرف */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600 mr-auto rtl:ml-auto">
          <span className={characterCount > maxLength ? 'text-red-600' : ''}>
            {characterCount.toLocaleString('ar-SA')} / {maxLength.toLocaleString('ar-SA')}
          </span>
          <span>حرف</span>
        </div>
      </div>

      {/* شريط أدوات الجدول (يظهر عند تحديد جدول) */}
      {editor.isActive('table') && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t">
          <span className="text-sm text-gray-600 ml-2 rtl:mr-2">أدوات الجدول:</span>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="إضافة عمود قبل"
          >
            <span className="text-xs">+عمود</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="إضافة صف قبل"
          >
            <span className="text-xs">+صف</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="حذف عمود"
          >
            <span className="text-xs">-عمود</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="حذف صف"
          >
            <span className="text-xs">-صف</span>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="حذف جدول"
          >
            <span className="text-xs">حذف</span>
          </ToolbarButton>
        </div>
      )}
    </div>
  );
} 