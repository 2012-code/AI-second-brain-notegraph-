'use client';

import { Note } from '@/types';
import { formatDate } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface Props {
    notes: Note[];
    selectedId: string | null;
    onSelect: (note: Note) => void;
    searchQuery?: string;
}

export default function NoteList({ notes, selectedId, onSelect, searchQuery }: Props) {
    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Sparkles size={48} className="text-[var(--violet)] mb-4 opacity-30" />
                <p className="font-serif text-[24px] text-[var(--text-primary)] mb-2" style={{ fontFamily: "'Cal Sans', sans-serif" }}>
                    {searchQuery ? `Nothing found for '${searchQuery}'` : 'Your second brain awaits'}
                </p>
                <p className="text-[14px] text-[var(--text-secondary)]">
                    {searchQuery ? 'Try different words or browse all notes.' : 'Start capturing your thoughts, ideas, and notes.'}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col pb-4 h-full overflow-y-auto custom-scrollbar pt-4">
            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
            {notes.map((note, i) => {
                const isSelected = selectedId === note.id;
                return (
                    <div key={note.id} onClick={() => onSelect(note)}
                        className={`note-card animate-in ${isSelected ? 'active' : ''}`}
                    >
                        <h3 className="note-card-title">
                            {note.title || 'Untitled'}
                        </h3>

                        <p className="note-card-preview">
                            {note.summary || note.content?.slice(0, 120) || 'Empty note'}
                        </p>

                        {/* Note tags if any */}
                        {(note.tags && note.tags.length > 0) && (
                            <div className="flex gap-1 mb-3 relative z-10 flex-wrap">
                                {note.tags.slice(0, 3).map(t => (
                                    <span key={t} className="tag-pill text-[10px] px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>{t}</span>
                                ))}
                            </div>
                        )}

                        {/* Bottom Row */}
                        <div className="note-card-footer">
                            <div>
                                {note.category ? (
                                    <span className="note-card-category">{note.category}</span>
                                ) : <span />}
                            </div>
                            <span className="note-card-date">
                                {formatDate(note.updated_at)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
