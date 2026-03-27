'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Note } from '@/types';
import { Star, Archive, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate, debounce } from '@/lib/utils';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import PlaceholderExt from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { EditorContent } from '@tiptap/react';
import { marked } from 'marked';
import EditorToolbar from './EditorToolbar';

interface Props {
  note: Note;
  onUpdate: (updated: Note) => void;
  onDelete: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function NoteEditor({ note, onUpdate, onDelete, isExpanded = false, onToggleExpand }: Props) {
  const [title, setTitle] = useState(note.title || '');
  const latestTitle = useRef(note.title || '');
  const isOrganizingRef = useRef(false);
  const onUpdatePropsRef = useRef(onUpdate);

  // Keep refs in sync with state/props
  useEffect(() => {
    latestTitle.current = title;
  }, [title]);

  useEffect(() => {
    onUpdatePropsRef.current = onUpdate;
  }, [onUpdate]);

    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [isPreview, setIsPreview] = useState(false);
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryText, setSummaryText] = useState('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const autoSave = useCallback(
        debounce(async (id: string, html: string, t: string) => {
            setSaveStatus('saving');
            try {
                const res = await fetch(`/api/notes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: html, title: t || null }),
                });
                const data = await res.json();
      if (data.note) {
        onUpdatePropsRef.current(data.note);
        setSaveStatus('saved');
      }
            } catch {
                setSaveStatus('unsaved');
            }
        }, 1500),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            PlaceholderExt.configure({
                placeholder: 'Start writing your thoughts...',
                emptyEditorClass: 'is-editor-empty',
            }),
            Typography,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            Highlight.configure({ multicolor: false }),
        ],
        content: note.content ? (note.content.trim().startsWith('<') ? note.content : marked.parse(note.content) as string) : '',
        editable: !isPreview,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose-ai focus:outline-none',
        dir: 'auto',
      },
    },
  });

  // Manage Tiptap update listener in a useEffect to avoid stale closures
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (isOrganizingRef.current) return;
      setSaveStatus('unsaved');
      autoSave(note.id, editor.getHTML(), latestTitle.current);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, note.id, autoSave]);

    // Update content when switching notes
    useEffect(() => {
        if (editor && note) {
            const html = note.content ? (note.content.trim().startsWith('<') ? note.content : marked.parse(note.content) as string) : '';
            if (editor.getHTML() !== html) {
                editor.commands.setContent(html);
                setTitle(note.title || '');
                latestTitle.current = note.title || '';
            }
        }
    }, [note.id, note.content, note.title, note, editor]);
    
    // Toggle editable when preview mode changes
    const handleTogglePreview = () => {
        const next = !isPreview;
        setIsPreview(next);
        editor?.setEditable(!next);
    };

    const handleTitleChange = (val: string) => {
        setTitle(val);
        latestTitle.current = val;
        setSaveStatus('unsaved');
        autoSave(note.id, editor?.getHTML() || '', val);
    };

    const handleFavorite = async () => {
        const res = await fetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_favorite: !note.is_favorite }),
        });
        const data = await res.json();
        if (data.note) { onUpdate(data.note); toast.success(data.note.is_favorite ? 'Added to favorites' : 'Removed from favorites'); }
    };

    const handleArchive = async () => {
        const res = await fetch(`/api/notes/${note.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_archived: !note.is_archived }),
        });
        const data = await res.json();
        if (data.note) { onUpdate(data.note); toast.success(data.note.is_archived ? 'Archived' : 'Unarchived'); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this note permanently?')) return;
        await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
        onDelete(note.id);
        toast.success('Note deleted');
    };

    const handleOrganize = async () => {
        const textContent = editor?.getText() || '';
        if (!textContent.trim() || textContent.trim().length < 10) {
            toast.error('Add some content first');
            return;
        }
    setIsOrganizing(true);
    isOrganizingRef.current = true;
    try {
      const res = await fetch('/api/ai/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, content: textContent }),
      });
      const data = await res.json();
      if (data.organized) {
        // Update title and Ref before content to ensure onUpdate (if it fires) sees the new title
        if (data.organized.title) {
          setTitle(data.organized.title);
          latestTitle.current = data.organized.title;
        }

        // Set HTML content into editor
        if (data.organized.organizedContent && editor) {
          editor.commands.setContent(data.organized.organizedContent);
        }

        onUpdatePropsRef.current({
          ...note,
          title: data.organized.title || note.title,
          tags: data.organized.tags || note.tags,
          category: data.organized.category || note.category,
        });

        toast.success('Note organized! ✦');
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (e: unknown) {
      toast.error('Organize error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsOrganizing(false);
      // Small delay before enabling autoSave again to let all cascaded events settle
      setTimeout(() => {
        isOrganizingRef.current = false;
      }, 500);
    }
    };

    const handleSummarize = async () => {
        const textContent = editor?.getText() || '';
        if (!textContent.trim()) { toast.error('Add some content first'); return; }
        setIsSummarizing(true);
        try {
            const res = await fetch('/api/ai/summarize-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: textContent }),
            });
            const data = await res.json();
            if (data.summary) {
                setSummaryText(data.summary);
                toast.success('Summary generated!');
            } else {
                setSummaryText('Could not generate summary.');
            }
        } catch (e: unknown) {
            toast.error('Summarize error: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsSummarizing(false);
        }
    };

    const wordCount = editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0;

    return (
        <div className="flex-1 flex flex-col h-full relative z-0">

            {/* Toolbar */}
            <EditorToolbar
                editor={editor}
                isPreview={isPreview}
                onTogglePreview={handleTogglePreview}
                onOrganize={handleOrganize}
                onSummarize={handleSummarize}
                onToggleExpand={() => onToggleExpand?.()}
                isExpanded={isExpanded}
                isOrganizing={isOrganizing}
                isSummarizing={isSummarizing}
            />

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="editor-content">

                    {/* Tags / Category */}
                    {(note.category || (note.tags && note.tags.length > 0)) && (
                        <div className="flex items-center gap-2 flex-wrap mb-6">
                            {note.category && <span className="editor-category-badge">{note.category}</span>}
                            {note.tags?.map(t => <span key={t} className="editor-tag">{t}</span>)}
                        </div>
                    )}

                    {/* Title */}
                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Untitled"
                            value={title}
                            onChange={e => handleTitleChange(e.target.value)}
                            className="note-editor-title flex-1"
                            dir="auto"
                        />
                        <button onClick={handleFavorite} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${note.is_favorite ? 'text-[var(--warning)]' : 'text-[var(--text-muted)] hover:text-white'}`} title="Favorite">
                            <Star size={17} fill={note.is_favorite ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={handleArchive} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white transition-all flex-shrink-0" title="Archive">
                            <Archive size={17} />
                        </button>
                        <button onClick={handleDelete} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] transition-all flex-shrink-0" title="Delete">
                            <Trash2 size={17} />
                        </button>
                    </div>

                    {/* Tiptap Rich-Text Editor */}
                    <div className={`rich-editor-wrapper ${isPreview ? 'preview-mode' : 'edit-mode'}`}>
                        <EditorContent editor={editor} className="rich-editor-content" />
                    </div>

                    {/* AI Summary Box */}
                    {summaryText && (
                        <div className="ai-summary-box mt-8">
                            <div className="ai-summary-header">
                                <span className="ai-summary-icon">✦</span>
                                <span className="ai-summary-label">AI Summary</span>
                            </div>
                            <p className="ai-summary-text">{summaryText}</p>
                            <button className="ai-summary-close" onClick={() => setSummaryText('')}>
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Status Bar */}
            <div className="editor-status-bar">
                <div className="flex items-center gap-2">
                    {saveStatus === 'saving' ? (
                        <span className="flex items-center gap-1.5 text-[var(--warning)] text-xs">Saving...</span>
                    ) : saveStatus === 'saved' ? (
                        <span className="saved-indicator"><span className="saved-dot"></span> Saved</span>
                    ) : (
                        <span className="text-xs opacity-40">Unsaved changes</span>
                    )}
                </div>
                <div className="h-1 w-1 rounded-full bg-[var(--border-strong)]" />
                <div className="flex items-center gap-4">
                    <span>{wordCount} words</span>
                    <span>Updated {formatDate(note.updated_at)}</span>
                </div>
            </div>
        </div>
    );
}
