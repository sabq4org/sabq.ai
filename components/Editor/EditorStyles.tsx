'use client';

export default function EditorStyles() {
  return (
    <style jsx global>{`
      /* أنماط المحرر الأساسية */
      .editor-content .ProseMirror {
        font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        direction: rtl;
        text-align: right;
        padding-top: 2rem !important;
        padding-bottom: 1rem;
        min-height: 500px;
        scroll-padding-top: 2rem;
      }

      /* التأكد من عدم اختفاء المحتوى */
      .editor-content .ProseMirror > *:first-child {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }

      /* إصلاح مشكلة overflow */
      .editor-content {
        overflow-y: auto;
        max-height: calc(100vh - 300px);
        position: relative;
      }

      /* إضافة مؤشر مرئي للمساحة العلوية */
      .editor-content .ProseMirror::before {
        content: '';
        display: block;
        height: 1rem;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }

      /* Placeholder style */
      .editor-content .is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: right;
        color: #9ca3af;
        pointer-events: none;
        height: 0;
      }

      /* Focus styles */
      .editor-content .ProseMirror:focus {
        outline: none;
      }

      /* Typography */
      .editor-content h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        margin-top: 2rem;
      }

      .editor-content h2 {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 0.75rem;
        margin-top: 1.5rem;
      }

      .editor-content h3 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        margin-top: 1rem;
      }

      .editor-content p {
        margin-bottom: 1rem;
        line-height: 1.8;
      }

      /* Lists */
      .editor-content ul,
      .editor-content ol {
        margin: 1rem 0;
        padding-right: 2rem;
      }

      .editor-content ul {
        list-style-type: disc;
      }

      .editor-content ol {
        list-style-type: decimal;
      }

      .editor-content li {
        margin-bottom: 0.5rem;
      }

      /* Blockquote */
      .editor-content blockquote {
        border-right: 4px solid #e5e7eb;
        padding-right: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: #6b7280;
      }

      .dark .editor-content blockquote {
        border-right-color: #4b5563;
        color: #9ca3af;
      }

      /* Code */
      .editor-content code {
        background-color: #f3f4f6;
        color: #1f2937;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-family: 'Courier New', monospace;
        font-size: 0.875em;
        direction: ltr;
      }

      .dark .editor-content code {
        background-color: #374151;
        color: #f3f4f6;
      }

      .editor-content pre {
        background-color: #1f2937;
        color: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin: 1rem 0;
        direction: ltr;
      }

      .dark .editor-content pre {
        background-color: #111827;
      }

      /* Tables */
      .editor-content table {
        border-collapse: collapse;
        margin: 1rem 0;
        width: 100%;
      }

      .editor-content td,
      .editor-content th {
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
      }

      .dark .editor-content td,
      .dark .editor-content th {
        border-color: #4b5563;
      }

      .editor-content th {
        background-color: #f9fafb;
        font-weight: 600;
      }

      .dark .editor-content th {
        background-color: #1f2937;
      }

      /* Links */
      .editor-content a {
        color: #3b82f6;
        text-decoration: underline;
      }

      .editor-content a:hover {
        text-decoration: none;
      }

      .dark .editor-content a {
        color: #60a5fa;
      }

      /* Images */
      .editor-content img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        margin: 1rem 0;
      }

      /* YouTube embeds */
      .editor-content .youtube-video {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
        margin: 1rem 0;
        border-radius: 0.5rem;
      }

      .editor-content .youtube-video iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 0.5rem;
      }

      /* Selection */
      .editor-content .ProseMirror::selection,
      .editor-content .ProseMirror *::selection {
        background-color: #bfdbfe;
      }

      .dark .editor-content .ProseMirror::selection,
      .dark .editor-content .ProseMirror *::selection {
        background-color: #1e40af;
      }

      /* Horizontal rule */
      .editor-content hr {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 2rem 0;
      }

      .dark .editor-content hr {
        border-top-color: #4b5563;
      }

      /* Text alignment */
      .editor-content .ProseMirror [style*="text-align: left"] {
        text-align: left !important;
      }

      .editor-content .ProseMirror [style*="text-align: center"] {
        text-align: center !important;
      }

      .editor-content .ProseMirror [style*="text-align: right"] {
        text-align: right !important;
      }

      .editor-content .ProseMirror [style*="text-align: justify"] {
        text-align: justify !important;
      }
    `}</style>
  );
} 