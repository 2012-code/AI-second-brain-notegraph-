'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Note } from '@/types';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NoteList from '@/components/dashboard/NoteList';
import KnowledgeGalaxy from '@/components/dashboard/KnowledgeGalaxy';
import { Search, Sparkles } from 'lucide-react';
import { debounce } from '@/lib/utils';
import dynamic from 'next/dynamic';

const NoteEditor = dynamic(() => import('@/components/dashboard/NoteEditor'), { ssr: false });
import DailySummary from '@/components/dashboard/DailySummary';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SUMMARY_STYLES = []; // Assuming this was the intended declaration for SUMMARY_STYLES
function DashboardContent() {
    const searchParams = useSearchParams();
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Note[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [isExpanded, setIsExpanded] = useState(false);
    const tag = searchParams.get('tag');
    const noteParam = searchParams.get('note');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const params = new URLSearchParams({ filter: 'all' });
            if (tag) params.set('tag', tag);
            const res = await fetch(`/api/notes?${params}`);
            const data = await res.json();
            if (data.notes) {
                setNotes(data.notes);
                if (noteParam) {
                    const found = data.notes.find((n: Note) => n.id === noteParam);
                    if (found) setSelectedNote(found);
                } else if (data.notes.length > 0 && !selectedNote) {
                    setSelectedNote(data.notes[0]);
                }
            }
            setLoading(false);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tag]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
                e.preventDefault();
                setIsExpanded(prev => !prev);
            }
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    const doSearch = useCallback(debounce(async (q: string) => {
        if (!q.trim()) { setSearchResults(null); return; }
        const res = await fetch(`/api/notes/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.notes || []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300), []);

    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        doSearch(val);
    };

    const handleNewNote = async () => {
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: '', title: '' }),
        });
        const data = await res.json();
        if (data.note) {
            setNotes(prev => [data.note, ...prev]);
            setSelectedNote(data.note);
            setActiveFilter('all');
        }
    };

    const handleNoteUpdate = (updated: Note) => {
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
        if (selectedNote?.id === updated.id) setSelectedNote(updated);
    };

    const handleNoteDelete = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (selectedNote?.id === id) {
            const remaining = notes.filter(n => n.id !== id);
            setSelectedNote(remaining[0] || null);
        }
    };

    // Apply active filter
    const filteredNotes = notes.filter(note => {
        switch (activeFilter) {
            case 'today': {
                const today = new Date();
                const noteDate = new Date(note.created_at);
                return (
                    noteDate.getDate() === today.getDate() &&
                    noteDate.getMonth() === today.getMonth() &&
                    noteDate.getFullYear() === today.getFullYear()
                );
            }
            case 'favorites':
                return note.is_favorite === true;
            case 'archived':
                return note.is_archived === true;
            case 'all':
            default:
                return !note.is_archived;
        }
    });

    const displayNotes = searchResults !== null ? searchResults : filteredNotes;

    return (
        <DashboardShell
            notes={notes}
            selectedNote={selectedNote}
            onNotesChange={setNotes}
            onSelectNote={setSelectedNote}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            isExpanded={isExpanded}
        >
            {activeFilter === 'daily' ? (
                <DailySummary />
            ) : activeFilter === 'galaxy' ? (
                <KnowledgeGalaxy
                    notes={notes}
                    onSelectNote={(note) => {
                        setSelectedNote(note);
                        setActiveFilter('all');
                    }}
                />
            ) : (
                <>
                    {/* Note List Panel */}
                    <div className={`notes-list-panel flex flex-col ${isExpanded ? 'hidden' : ''}`}>
                        <div className="px-4 pt-4 pb-3 shrink-0 border-b border-[var(--border-subtle)]">
                            <div className="relative">
                                <Search size={16} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search your notes..."
                                    value={searchQuery}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border-default)] rounded-[12px] h-[40px] pl-[38px] pr-[16px] text-[13px] text-white outline-none focus:border-[var(--violet)] focus:ring-2 focus:ring-[var(--violet-glow)] transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {loading ? (
                                <div className="space-y-2 px-4 pt-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] h-[110px] rounded-[12px]" />
                                    ))}
                                </div>
                            ) : (
                                <NoteList
                                    notes={displayNotes}
                                    selectedId={selectedNote?.id || null}
                                    onSelect={setSelectedNote}
                                    searchQuery={searchQuery}
                                />
                            )}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className={`editor-panel ${isExpanded ? 'full-width' : ''}`}>
                        {selectedNote ? (
                            <NoteEditor
                                key={selectedNote.id}
                                note={selectedNote}
                                onUpdate={handleNoteUpdate}
                                onDelete={handleNoteDelete}
                                isExpanded={isExpanded}
                                onToggleExpand={() => setIsExpanded(!isExpanded)}
                            />
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <Sparkles className="text-white" />
                                </div>
                                <h2 className="empty-state-title">Your second brain awaits</h2>
                                <p className="empty-state-subtitle">
                                    Start capturing your thoughts, ideas, and notes. AI will organize everything automatically.
                                </p>
                                <button onClick={handleNewNote} className="empty-state-btn">
                                    Write your first note
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DashboardShell>
    );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-background-primary">
                <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
