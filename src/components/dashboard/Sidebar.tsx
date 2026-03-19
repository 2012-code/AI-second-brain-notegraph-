'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Note } from '@/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Home, Search, Folder, Star, Archive, Settings, LogOut, ChevronLeft, ChevronRight, Menu, Clock, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    notes: Note[];
    onNotesChange: (notes: Note[]) => void;
    onSelectNote: (note: Note) => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export default function Sidebar({ notes, onNotesChange, onSelectNote, activeFilter, onFilterChange }: Props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();
    const supabase = createClient();

    // Aggregate all tags from notes
    const tagCounts: Record<string, number> = {};
    notes.forEach(n => (n.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

    const handleNewNote = async () => {
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: '', title: 'New Note' }),
            });
            const data = await res.json();

            if (data.note) {
                onNotesChange([data.note as Note, ...notes]);
                onSelectNote(data.note);
                onFilterChange('all');
            } else if (data.error) {
                toast.error(data.error);
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Failed to create note');
        }
    };

    const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      toast.error('Failed to sign out');
    }
  };

    const navItems = [
        { label: 'All Notes', icon: Home, filter: 'all' },
        { label: 'Today', icon: Clock, filter: 'today' },
        { label: 'Favorites', icon: Star, filter: 'favorites' },
        { label: 'Archive', icon: Archive, filter: 'archived' },
    ];

    const galaxyIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="3" cy="6" r="2"/>
            <circle cx="21" cy="6" r="2"/>
            <circle cx="3" cy="18" r="2"/>
            <circle cx="21" cy="18" r="2"/>
            <line x1="5" y1="7" x2="10" y2="10"/>
            <line x1="19" y1="7" x2="14" y2="10"/>
            <line x1="5" y1="17" x2="10" y2="14"/>
            <line x1="19" y1="17" x2="14" y2="14"/>
        </svg>
    );

    // Compute counts
    const getCounts = (filter: string) => {
        switch (filter) {
            case 'all': return notes.filter(n => !n.is_archived).length;
            case 'today': return notes.filter(n => new Date(n.created_at).toDateString() === new Date().toDateString()).length;
            case 'favorites': return notes.filter(n => n.is_favorite).length;
            case 'archived': return notes.filter(n => n.is_archived).length;
            default: return 0;
        }
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo-icon">
                    <Sparkles size={14} className="text-white" />
                </div>
                <span className="logo-text">NoteGraph</span>
            </div>

            {/* New Note Button */}
            <button onClick={handleNewNote} className="new-note-button">
                <Sparkles size={14} /> New Note
            </button>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col space-y-1 mt-2">
                {navItems.map(item => {
                    const isActive = activeFilter === item.filter;
                    const count = getCounts(item.filter);

                    return (
                        <button
                            key={item.filter}
                            onClick={() => onFilterChange(item.filter)}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon />
                            {item.label}
                            {count > 0 && (
                                <span className="ml-auto text-[10px] opacity-50 font-mono">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Galaxy nav item */}
                <button
                    onClick={() => onFilterChange('galaxy')}
                    className={`nav-link ${activeFilter === 'galaxy' ? 'active' : ''}`}
                >
                    {galaxyIcon()}
                    Galaxy
                </button>

                {/* Daily Summary nav item */}
                <button
                    onClick={() => onFilterChange('daily')}
                    className={`nav-link ${activeFilter === 'daily' ? 'active' : ''}`}
                    style={activeFilter === 'daily' ? { color: '#FCD34D', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' } : {}}
                >
                    <Sparkles size={16} />
                    Daily Summary
                </button>

                {/* Tags Section */}
                <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="sidebar-section-label">TAGS</div>
                    <div className="tags-container">
                        {topTags.length === 0 ? (
                            <p className="px-2 text-[11px] text-[var(--text-faint)]">No tags yet</p>
                        ) : (
                            topTags.map(([tag]) => (
                                <span key={tag} className="tag-chip cursor-pointer">
                                    {tag}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="sidebar-footer">
                    <Link href="/settings" className="nav-link">
                        <Settings /> Settings
                    </Link>
                    <button onClick={handleSignOut} className="nav-link w-full text-left" style={{ color: 'rgba(244,244,255,0.55)' }}>
                        <LogOut /> Sign Out
                    </button>
                </div>
            </nav>
        </aside>
    );
}
