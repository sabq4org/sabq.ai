'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import CharacterCount from '@tiptap/extension-character-count';
import History from '@tiptap/extension-history';
import { useEffect, forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import EditorToolbar from './EditorToolbar';
import EditorStyles from './EditorStyles';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditorProps {
  content?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  enableAI?: boolean;
  onAIAction?: (action: string, content: string) => void;
  autoSaveKey?: string; // مفتاح للحفظ في localStorage
  autoSaveInterval?: number; // فترة الحفظ التلقائي بالمللي ثانية
}

export interface EditorRef {
  getContent: () => any;
  getHTML: () => string;
  setContent: (content: any) => void;
  clearContent: () => void;
  undo: () => void;
  redo: () => void;
}

const Editor = forwardRef<EditorRef, EditorProps>(({
  content = '',
  onChange,
  placeholder = 'ابدأ كتابة مقالك هنا...',
  enableAI = true,
  onAIAction,
  autoSaveKey = 'editor-draft',
  autoSaveInterval = 30000 // 30 ثانية
}, ref) => {
  const { darkMode } = useDarkModeContext();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const previousContentRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        history: false // نعطل History الافتراضي لنستخدم النسخة المحسنة
      }),
      History.configure({
        depth: 100, // عدد التراجعات المحفوظة
        newGroupDelay: 500 // تأخير تجميع التغييرات
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto'
        }
      }),
      Youtube.configure({
        modestBranding: true,
        HTMLAttributes: {
          class: 'rounded-lg overflow-hidden'
        }
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline hover:no-underline',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 px-4 py-2'
        }
      }),
      Color,
      TextStyle,
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert max-w-full focus:outline-none min-h-[500px] px-6 py-4 ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`,
        dir: 'rtl',
        spellcheck: 'false',
        style: 'padding-top: 1rem;'
      }
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      onChange?.({ json, html });
      
      // حفظ المحتوى السابق للكشف عن الحذف الكامل
      const currentContent = editor.getText();
      if (previousContentRef.current && currentContent.length < previousContentRef.current.length / 2) {
        // إذا تم حذف أكثر من نصف المحتوى، اعرض رسالة الاستعادة
        setShowRestorePrompt(true);
      }
      previousContentRef.current = currentContent;
    },
  });

  // الحفظ التلقائي
  const autoSave = useCallback(() => {
    if (editor && autoSaveKey) {
      const content = editor.getHTML();
      if (content && content.length > 50) { // حفظ فقط إذا كان هناك محتوى ذو معنى
        localStorage.setItem(autoSaveKey, JSON.stringify({
          content,
          timestamp: new Date().toISOString()
        }));
        setLastSaved(new Date());
        console.log('تم الحفظ التلقائي');
      }
    }
  }, [editor, autoSaveKey]);

  // إعداد الحفظ التلقائي
  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveTimerRef.current = setInterval(autoSave, autoSaveInterval);
      
      // حفظ عند مغادرة الصفحة
      const handleBeforeUnload = () => {
        autoSave();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [autoSave, autoSaveInterval]);

  // التحقق من وجود مسودة محفوظة عند التحميل
  useEffect(() => {
    if (autoSaveKey && editor && !content) {
      const savedDraft = localStorage.getItem(autoSaveKey);
      if (savedDraft) {
        try {
          const { content: savedContent, timestamp } = JSON.parse(savedDraft);
          const savedDate = new Date(timestamp);
          const hoursSinceLastSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastSave < 24) { // إذا كانت المسودة أقل من 24 ساعة
            toast((t) => (
              <div className="flex flex-col gap-2">
                <p>توجد مسودة محفوظة من {savedDate.toLocaleString('ar-SA')}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      editor.commands.setContent(savedContent);
                      toast.dismiss(t.id);
                      toast.success('تم استعادة المسودة');
                    }}
                  >
                    استعادة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem(autoSaveKey);
                      toast.dismiss(t.id);
                    }}
                  >
                    تجاهل
                  </Button>
                </div>
              </div>
            ), { duration: 10000 });
          }
        } catch (error) {
          console.error('خطأ في قراءة المسودة المحفوظة:', error);
        }
      }
    }
  }, [autoSaveKey, editor, content]);

  // إضافة الوظائف المرجعية
  useImperativeHandle(ref, () => ({
    getContent: () => editor?.getJSON(),
    getHTML: () => editor?.getHTML() || '',
    setContent: (newContent) => {
      if (editor && newContent) {
        if (typeof newContent === 'string') {
          editor.commands.setContent(newContent);
        } else {
          editor.commands.setContent(newContent);
        }
        // التمرير إلى أعلى المحرر بعد تحميل المحتوى
        setTimeout(() => {
          const editorElement = document.querySelector('.editor-content .ProseMirror');
          if (editorElement) {
            editorElement.scrollTop = 0;
          }
        }, 100);
      }
    },
    clearContent: () => editor?.commands.clearContent(),
    undo: () => editor?.commands.undo(),
    redo: () => editor?.commands.redo()
  }));

  // التمرير إلى أعلى المحرر عند تحميل المحتوى لأول مرة
  useEffect(() => {
    if (editor && content) {
      setTimeout(() => {
        const editorElement = document.querySelector('.editor-content .ProseMirror');
        if (editorElement) {
          editorElement.scrollTop = 0;
        }
      }, 100);
    }
  }, [editor, content]);

  // معالج لإجراءات الذكاء الاصطناعي
  const handleAIAction = (action: string) => {
    if (!editor) return;
    
    const selection = editor.state.selection;
    const { from, to } = selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    
    if (onAIAction) {
      onAIAction(action, selectedText || editor.getText());
    }
  };

  // إدراج نتيجة الذكاء الاصطناعي
  const insertAIResult = (result: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    if (from !== to) {
      // استبدال النص المحدد
      editor.chain().focus().deleteRange({ from, to }).insertContent(result).run();
    } else {
      // إدراج في موضع المؤشر
      editor.chain().focus().insertContent(result).run();
    }
  };

  // تعريض دالة insertAIResult للاستخدام الخارجي
  useEffect(() => {
    if (window && editor) {
      (window as any).editorInsertAIResult = insertAIResult;
    }
  }, [editor]);

  // معالج لاستعادة المحتوى المحذوف
  const handleRestore = () => {
    if (editor) {
      editor.commands.undo();
      setShowRestorePrompt(false);
      toast.success('تم استعادة المحتوى');
    }
  };

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;
      
      // Ctrl/Cmd + S للحفظ
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        autoSave();
        toast.success('تم حفظ المسودة');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, autoSave]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <EditorStyles />
      <div className={`relative rounded-lg border-2 overflow-hidden transition-all duration-300 ${
        darkMode 
          ? 'bg-gray-900 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        {/* شريط الاستعادة */}
        {showRestorePrompt && (
          <div className={`p-3 flex items-center justify-between ${
            darkMode ? 'bg-red-900/20 border-b border-red-800' : 'bg-red-50 border-b border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                هل تريد استعادة المحتوى المحذوف؟
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRestore}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                استعادة
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRestorePrompt(false)}
              >
                تجاهل
              </Button>
            </div>
          </div>
        )}
        
        <EditorToolbar 
          editor={editor} 
          enableAI={enableAI}
          onAIAction={handleAIAction}
        />
        
        <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <EditorContent 
            editor={editor} 
            className="editor-content"
          />
          
          {/* شريط المعلومات السفلي */}
          <div className={`flex items-center justify-between px-4 py-2 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {/* مؤشر عدد الكلمات */}
            <div className={`text-xs ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {editor.storage.characterCount?.words() || 0} كلمة • {editor.storage.characterCount?.characters() || 0} حرف
            </div>
            
            {/* أزرار التراجع والحفظ */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
                </span>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  autoSave();
                  toast.success('تم حفظ المسودة');
                }}
                className="h-7 px-2"
                title="حفظ (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1 border-r pr-2 mr-2 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.commands.undo()}
                  disabled={!editor.can().undo()}
                  className="h-7 px-2"
                  title="تراجع (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.commands.redo()}
                  disabled={!editor.can().redo()}
                  className="h-7 px-2"
                  title="إعادة (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

Editor.displayName = 'Editor';

export default Editor; 