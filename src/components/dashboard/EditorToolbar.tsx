'use client';

import { Editor } from '@tiptap/react';
import { Loader2 } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  isPreview: boolean;
  onTogglePreview: () => void;
  onOrganize: () => void;
  onSummarize: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
  isOrganizing: boolean;
  isSummarizing: boolean;
}

export default function EditorToolbar({
  editor,
  isPreview,
  onTogglePreview,
  onOrganize,
  onSummarize,
  onToggleExpand,
  isExpanded,
  isOrganizing,
  isSummarizing,
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      {/* ── AI Actions ── */}
      <button
        className="editor-action-btn disabled:opacity-50"
        onClick={onOrganize}
        disabled={isOrganizing || isSummarizing}
      >
        {isOrganizing ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        )}
        {isOrganizing ? 'Organizing...' : 'Organize'}
      </button>

      <button
        className="editor-action-btn disabled:opacity-50"
        onClick={onSummarize}
        disabled={isOrganizing || isSummarizing}
      >
        {isSummarizing ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="7" y2="10"/>
            <line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="21" y1="14" x2="3" y2="14"/>
            <line x1="21" y1="18" x2="7" y2="18"/>
          </svg>
        )}
        {isSummarizing ? 'Summarizing...' : 'Summarize'}
      </button>

      <button className="editor-action-btn" onClick={onToggleExpand}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isExpanded ? (
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
          ) : (
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          )}
        </svg>
        {isExpanded ? 'Exit' : 'Expand'}
      </button>

      {/* ── Divider ── */}
      <div className="toolbar-divider" />

      {/* ── Text Formatting ── */}
      <button
        className={`editor-format-btn ${editor?.isActive('bold') ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>

      <button
        className={`editor-format-btn ${editor?.isActive('italic') ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>

      <button
        className={`editor-format-btn ${editor?.isActive('underline') ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }}
        title="Underline (Ctrl+U)"
      >
        <u>U</u>
      </button>

      <button
        className={`editor-format-btn ${editor?.isActive('highlight') ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHighlight().run(); }}
        title="Highlight"
      >
        ✦
      </button>

      {/* ── Divider ── */}
      <div className="toolbar-divider" />

      {/* ── Headings ── */}
      <button
        className={`editor-format-btn ${editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run(); }}
        title="Heading 1"
      >
        H1
      </button>

      <button
        className={`editor-format-btn ${editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run(); }}
        title="Heading 2"
      >
        H2
      </button>

      {/* ── Lists ── */}
      <button
        className={`editor-format-btn ${editor?.isActive('bulletList') ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
        title="Bullet List"
      >
        •—
      </button>

      <button
        className={`editor-format-btn ${editor?.isActive('orderedList') ? 'is-active' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
        title="Numbered List"
      >
        1.
      </button>

      {/* ── Divider ── */}
      <div className="toolbar-divider" />

      {/* ── Preview Toggle ── */}
      <button
        className={`editor-format-btn ${isPreview ? 'is-active' : ''}`}
        onClick={onTogglePreview}
        title={isPreview ? 'Switch to Edit' : 'Switch to Preview'}
      >
        {isPreview ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview
          </>
        )}
      </button>
    </div>
  );
}
