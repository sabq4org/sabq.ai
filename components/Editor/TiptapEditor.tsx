'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import toast from 'react-hot-toast';

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string, json: any) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const [savedContent, setSavedContent] = useState('');
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Underline,
      Link.configure({
        HTMLAttributes: {
          class: 'text-primary',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      CharacterCount.configure({
        limit: 1000,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'ابدأ بكتابة محتوى المقال هنا...',
        includeChildren: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full border-collapse',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 font-bold p-2 border border-gray-300 dark:border-gray-600',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'p-2 border border-gray-300 dark:border-gray-600',
        },
      }),
    ],
    content: content || `<p>${placeholder || 'ابدأ بكتابة محتوى المقال هنا...'}</p>`,
    immediatelyRender: false, // حل مشكلة SSR
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none p-6 min-h-[400px] focus:outline-none dark:prose-invert',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      const text = editor.getText();
      setCharCount(text.length);
      
      if (onChange) {
        onChange(html, json);
      }
    },
  });

  // تحديث المحتوى عند تغيير الـ prop
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const json = editor.getJSON();
    setSavedContent(html);
    
    // يمكن إضافة استدعاء API هنا لحفظ المحتوى
    console.log('HTML:', html);
    console.log('JSON:', json);
  };

  const addImage = () => {
    const url = prompt('أدخل رابط الصورة:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const uploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // إظهار رسالة تحميل
          const loadingText = 'جاري رفع الصورة...';
          editor?.chain().focus().insertContent(`<p>${loadingText}</p>`).run();

          // رفع الصورة إلى الخادم
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            // حذف رسالة التحميل وإدراج الصورة
            editor?.chain().focus().undo().setImage({ src: data.url }).run();
          } else {
            // في حالة الفشل، استخدام FileReader كحل بديل
            const reader = new FileReader();
            reader.onload = (e) => {
              const url = e.target?.result as string;
              editor?.chain().focus().undo().setImage({ src: url }).run();
            };
            reader.readAsDataURL(file);
          }
        } catch (error) {
          console.error('خطأ في رفع الصورة:', error);
          alert('حدث خطأ في رفع الصورة');
        }
      }
    };
    input.click();
  };

  const addTweet = () => {
    const tweetUrl = prompt('أدخل رابط التغريدة:');
    if (tweetUrl) {
      // استخراج معرف التغريدة من الرابط
      const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];
      if (tweetId) {
        const embedHtml = `
          <div class="twitter-embed" contenteditable="false">
            <blockquote class="twitter-tweet" data-lang="ar" dir="rtl">
              <a href="${tweetUrl}">تحميل التغريدة...</a>
            </blockquote>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          </div>
        `;
        editor?.chain().focus().insertContent(embedHtml).run();
      }
    }
  };

  if (!editor) return null;

  return (
    <div className="w-full">
      {/* شريط الأدوات */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-t-lg p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2 items-center">
          {/* أزرار التنسيق الأساسية */}
          <div className="flex gap-1 border-l pl-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              title="عريض"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              title="مائل"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M8 20h4m3-16L9 20" />
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('underline') ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              title="تحته خط"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a5 5 0 0010 0V4M5 20h14" />
              </svg>
            </button>
          </div>

          {/* أزرار العناوين */}
          <div className="flex gap-1 border-l pl-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
            >
              H3
            </button>
          </div>

          {/* أزرار القوائم */}
          <div className="flex gap-1 border-l pl-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              title="قائمة نقطية"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              title="قائمة مرقمة"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </button>
          </div>

          {/* أزرار إضافية */}
          <div className="flex gap-1 border-l pl-2">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              title="اقتباس"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
            
            <button
              onClick={addImage}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="إدراج صورة برابط"
            >
              🔗
            </button>

            <button
              onClick={uploadImage}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="رفع صورة من الجهاز"
            >
              📷
            </button>
            
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="إدراج جدول"
            >
              📊
            </button>

            {editor.isActive('table') && (
              <>
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                  title="إضافة عمود"
                >
                  +📏
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                  title="إضافة صف"
                >
                  +📐
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="p-2 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors text-sm"
                  title="حذف الجدول"
                >
                  🗑️
                </button>
              </>
            )}

            <button
              onClick={addTweet}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="إدراج تغريدة"
            >
              🐦
            </button>

            <button
              onClick={() => {
                const videoUrl = prompt('أدخل رابط الفيديو (YouTube/Vimeo):');
                if (videoUrl) {
                  let embedUrl = '';
                  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  } else if (videoUrl.includes('vimeo.com')) {
                    const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
                    embedUrl = `https://player.vimeo.com/video/${videoId}`;
                  }
                  
                  if (embedUrl) {
                    const embedHtml = `<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                      <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
                    </div>`;
                    editor?.chain().focus().insertContent(embedHtml).run();
                  }
                }
              }}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="إدراج فيديو"
            >
              🎥
            </button>

            <button
              onClick={() => {
                const emoji = prompt('أدخل الرمز التعبيري أو اختر من: 😀 😎 👍 ❤️ 🎉 🔥 💡 ⭐');
                if (emoji) {
                  editor?.chain().focus().insertContent(emoji).run();
                }
              }}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="إدراج رمز تعبيري"
            >
              😊
            </button>
          </div>

          {/* زر الحفظ */}
          <div className="mr-auto flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {charCount} حرف
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              💾 حفظ المحتوى
            </button>
          </div>
        </div>
      </div>

      {/* منطقة المحرر */}
      <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-900">
        <EditorContent editor={editor} />
      </div>

      {/* معاينة المحتوى المحفوظ */}
      {savedContent && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-bold mb-3 text-lg">📄 معاينة المحتوى المحفوظ:</h3>
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: savedContent }} 
          />
        </div>
      )}
    </div>
  );
} 