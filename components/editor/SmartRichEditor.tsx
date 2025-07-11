"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { MediaUploader } from './MediaUploader';
import { EditorToolbar } from './EditorToolbar';
import { CollaborationIndicator } from './CollaborationIndicator';

interface SmartRichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  articleId?: string;
  userId?: string;
  userName?: string;
  maxLength?: number;
  enableCollaboration?: boolean;
  className?: string;
}

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    position: number;
    selection?: { from: number; to: number };
  };
}

export default function SmartRichEditor({
  content,
  onChange,
  placeholder = 'ابدأ الكتابة...',
  editable = true,
  articleId,
  userId,
  userName,
  maxLength = 50000,
  enableCollaboration = false,
  className = ''
}: SmartRichEditorProps) {
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // إعداد المحرر
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false
        }
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'editor-image'
        }
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'editor-youtube'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Highlight.configure({
        multicolor: true
      }),
      Typography,
      Placeholder.configure({
        placeholder
      }),
      CharacterCount.configure({
        limit: maxLength
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true
      })
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      
      // حفظ تلقائي
      if (autoSaveEnabled && articleId) {
        debouncedAutoSave(html);
      }
    },
    onCreate: ({ editor }) => {
      // إعداد التحرير الجماعي
      if (enableCollaboration && articleId && userId) {
        initializeCollaboration();
      }
    }
  });

  // حفظ تلقائي مع تأخير
  const debouncedAutoSave = useCallback(
    debounce((content: string) => {
      autoSave(content);
    }, 2000),
    [articleId]
  );

  // تهيئة التحرير الجماعي
  const initializeCollaboration = useCallback(async () => {
    if (!articleId || !userId) return;

    try {
      // إنشاء جلسة تحرير
      const response = await fetch(`/api/articles/${articleId}/collaboration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          user_name: userName
        })
      });

      if (response.ok) {
        const { session_token } = await response.json();
        
        // الاتصال بـ WebSocket للتحرير الجماعي
        connectToCollaborationSocket(session_token);
      }
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
    }
  }, [articleId, userId, userName]);

  // الاتصال بـ WebSocket
  const connectToCollaborationSocket = (sessionToken: string) => {
    // في تطبيق حقيقي، يمكن استخدام WebSocket أو Socket.IO
    // هنا نستخدم Server-Sent Events كبديل مبسط
    const eventSource = new EventSource(
      `/api/articles/${articleId}/collaboration/events?session_token=${sessionToken}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleCollaborationEvent(data);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    // تنظيف الاتصال عند إلغاء التحميل
    return () => {
      eventSource.close();
    };
  };

  // التعامل مع أحداث التحرير الجماعي
  const handleCollaborationEvent = (data: any) => {
    switch (data.type) {
      case 'user_joined':
        setCollaborators(prev => [...prev, data.user]);
        break;
      case 'user_left':
        setCollaborators(prev => prev.filter(u => u.id !== data.user.id));
        break;
      case 'cursor_update':
        setCollaborators(prev => 
          prev.map(u => 
            u.id === data.user.id 
              ? { ...u, cursor: data.cursor }
              : u
          )
        );
        break;
      case 'content_update':
        if (data.user.id !== userId) {
          // تحديث المحتوى من مستخدم آخر
          editor?.commands.setContent(data.content, false);
        }
        break;
    }
  };

  // حفظ تلقائي
  const autoSave = async (content: string) => {
    if (!articleId) return;

    try {
      const response = await fetch(`/api/articles/${articleId}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // إدراج وسائط
  const handleMediaInsert = (mediaData: any) => {
    if (!editor) return;

    switch (mediaData.type) {
      case 'image':
        editor.chain().focus().setImage({ 
          src: mediaData.url,
          alt: mediaData.alt_text || '',
          title: mediaData.caption || ''
        }).run();
        break;
      case 'video':
        if (mediaData.url.includes('youtube.com') || mediaData.url.includes('youtu.be')) {
          editor.chain().focus().setYoutubeVideo({ 
            src: mediaData.url,
            width: 640,
            height: 360
          }).run();
        } else {
          // إدراج فيديو HTML5
          editor.chain().focus().insertContent(`
            <video controls style="max-width: 100%;">
              <source src="${mediaData.url}" type="${mediaData.mime_type}">
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          `).run();
        }
        break;
      case 'audio':
        editor.chain().focus().insertContent(`
          <audio controls style="width: 100%;">
            <source src="${mediaData.url}" type="${mediaData.mime_type}">
            متصفحك لا يدعم تشغيل الصوت.
          </audio>
        `).run();
        break;
    }

    setShowMediaUploader(false);
  };

  // إدراج رابط
  const handleLinkInsert = () => {
    const url = window.prompt('أدخل الرابط:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  // إدراج جدول
  const handleTableInsert = () => {
    editor?.chain().focus().insertTable({ 
      rows: 3, 
      cols: 3, 
      withHeaderRow: true 
    }).run();
  };

  // تنظيف عند الإلغاء
  useEffect(() => {
    return () => {
      if (enableCollaboration && articleId && userId) {
        // إنهاء جلسة التحرير
        fetch(`/api/articles/${articleId}/collaboration`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
      }
    };
  }, [enableCollaboration, articleId, userId]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل المحرر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`smart-rich-editor ${className}`}>
      {/* شريط الأدوات */}
      <EditorToolbar
        editor={editor}
        onMediaClick={(type) => {
          setMediaType(type);
          setShowMediaUploader(true);
        }}
        onLinkClick={handleLinkInsert}
        onTableClick={handleTableInsert}
        characterCount={editor.storage.characterCount.characters()}
        maxLength={maxLength}
      />

      {/* مؤشر التحرير الجماعي */}
      {enableCollaboration && (
        <CollaborationIndicator
          collaborators={collaborators}
          isConnected={isConnected}
          lastSaved={lastSaved}
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={setAutoSaveEnabled}
        />
      )}

      {/* منطقة التحرير */}
      <div className="editor-container">
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-none focus:outline-none"
        />
      </div>

      {/* إحصائيات المحرر */}
      <div className="editor-stats flex justify-between items-center mt-4 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
        <div className="flex space-x-4 rtl:space-x-reverse">
          <span>
            الكلمات: {editor.storage.characterCount.words()}
          </span>
          <span>
            الأحرف: {editor.storage.characterCount.characters()}/{maxLength}
          </span>
        </div>
        
        {lastSaved && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              آخر حفظ: {lastSaved.toLocaleTimeString('ar-SA')}
            </span>
          </div>
        )}
      </div>

      {/* رافع الوسائط */}
      {showMediaUploader && (
        <MediaUploader
          type={mediaType}
          onUploaded={handleMediaInsert}
          onClose={() => setShowMediaUploader(false)}
        />
      )}

      {/* أنماط CSS للمحرر */}
      <style jsx>{`
        .smart-rich-editor {
          @apply border rounded-lg bg-white shadow-sm;
        }
        
        .editor-container {
          @apply min-h-[300px] p-4;
        }
        
        .editor-container :global(.ProseMirror) {
          @apply outline-none;
        }
        
        .editor-container :global(.editor-image) {
          @apply max-w-full h-auto rounded-lg shadow-sm;
        }
        
        .editor-container :global(.editor-youtube) {
          @apply w-full max-w-2xl mx-auto rounded-lg shadow-sm;
        }
        
        .editor-container :global(.editor-link) {
          @apply text-blue-600 hover:text-blue-800 underline;
        }
        
        .editor-container :global(table) {
          @apply border-collapse border border-gray-300 w-full;
        }
        
        .editor-container :global(td, th) {
          @apply border border-gray-300 px-3 py-2;
        }
        
        .editor-container :global(th) {
          @apply bg-gray-50 font-semibold;
        }
        
        .editor-container :global(.task-list) {
          @apply list-none pl-0;
        }
        
        .editor-container :global(.task-item) {
          @apply flex items-start space-x-2 rtl:space-x-reverse;
        }
        
        .editor-container :global(.task-item input) {
          @apply mt-1;
        }
      `}</style>
    </div>
  );
}

// دالة مساعدة للتأخير
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 