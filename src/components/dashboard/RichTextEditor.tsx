'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  isPreview: boolean;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  isPreview,
  placeholder = 'Start writing your thoughts...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content: content || '',
    editable: !isPreview,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
        dir: 'auto',
      },
    },
  });

  // Update content when note changes (e.g. switching notes)
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentHTML = editor.getHTML();
      if (content !== currentHTML) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  // Toggle editable based on preview mode
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!isPreview);
    }
  }, [isPreview, editor]);

  return (
    <div className={`rich-editor-wrapper ${isPreview ? 'preview-mode' : 'edit-mode'}`}>
      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  );
}

export { useEditor };
export type { RichTextEditorProps };
