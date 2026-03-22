'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import AIChatPanel from '@/components/dashboard/AIChatPanel';
import { Note } from '@/types';
import { PanelRightOpen, PanelRightClose, Menu, X, MessageSquare, ChevronLeft } from 'lucide-react';

interface DashboardShellProps {
    children: React.ReactNode;
    notes: Note[];
    selectedNote: Note | null;
    onNotesChange: (notes: Note[]) => void;
    onSelectNote: (note: Note) => void;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    isExpanded: boolean;
    // Mobile navigation helpers (passed down so page.tsx can wire up back button)
    onMobileBack?: () => void;
    mobileShowEditor?: boolean;
}

export default function DashboardShell({ children, notes, selectedNote, onNotesChange, onSelectNote, activeFilter, onFilterChange, isExpanded, onMobileBack, mobileShowEditor }: DashboardShellProps) {
    const [aiPanelOpen, setAiPanelOpen] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const check = () => {
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setIsTablet(width >= 640 && width < 1024);

            if (width < 640) {
                setSidebarOpen(false);
                setAiPanelOpen(false);
            } else if (width < 1024) {
                setSidebarOpen(true);
                setAiPanelOpen(false);
            } else {
                setSidebarOpen(true);
                setAiPanelOpen(true);
            }
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return (
        <div className="h-screen w-full relative overflow-hidden bg-transparent">

            {/* Main Content Area — flexbox row */}
            <div
                className="h-full flex min-w-0 transition-[margin] duration-300 ease-in-out"
                style={{
                    marginLeft: sidebarOpen && !isMobile && !isExpanded ? '240px' : '0px',
                    marginRight: aiPanelOpen && !isMobile && !isTablet && !isExpanded ? '300px' : '0px'
                }}
            >
                {/* Mobile Hamburger Button — only show when notes list is visible */}
                {isMobile && !sidebarOpen && !mobileShowEditor && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="absolute top-4 left-4 z-40 p-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-all bg-[var(--bg-glass)] backdrop-blur-md"
                    >
                        <Menu size={16} />
                    </button>
                )}

                {/* Mobile Back Button — shown when editor is visible on mobile */}
                {isMobile && mobileShowEditor && onMobileBack && (
                    <button
                        onClick={onMobileBack}
                        className="absolute top-4 left-4 z-40 p-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-all bg-[var(--bg-glass)] backdrop-blur-md flex items-center gap-1.5 text-[13px] font-medium"
                        title="Back to notes"
                    >
                        <ChevronLeft size={16} /> Notes
                    </button>
                )}

                {/* Main View children (NoteList + Editor) */}
                <div className="flex-1 w-full h-full flex min-w-0">
                    {children}
                </div>

                {/* Toggle AI Panel Button (Desktop/Tablet) */}
                {!isMobile && (
                    <button
                        onClick={() => setAiPanelOpen(!aiPanelOpen)}
                        className="fixed top-4 z-40 p-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-all bg-[var(--bg-glass)] backdrop-blur-md shadow-md"
                        style={{ right: aiPanelOpen ? '316px' : '16px' }}
                        title={aiPanelOpen ? 'Close AI panel' : 'Open AI panel'}
                    >
                        {aiPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    </button>
                )}
            </div>

            {/* Sidebar Container — fixed left */}
            <div
                className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isExpanded ? 'hidden' : ''}`}
            >
                <Sidebar notes={notes} onNotesChange={onNotesChange} onSelectNote={onSelectNote} activeFilter={activeFilter} onFilterChange={onFilterChange} />

                {/* Mobile Close Sidebar */}
                {isMobile && sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-4 right-4 p-2 text-white bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] z-[60]"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* AI Chat Panel Container — fixed right */}
            <div
                className={`fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-in-out ${aiPanelOpen ? 'translate-x-0' : 'translate-x-full'} ${isExpanded ? 'hidden' : ''}`}
                style={{ width: isMobile || isTablet ? '100%' : '300px', maxWidth: isMobile ? '100%' : '300px' }}
            >
                <AIChatPanel currentNote={selectedNote} notes={notes} />
                {(isMobile || isTablet) && aiPanelOpen && (
                    <button
                        onClick={() => setAiPanelOpen(false)}
                        className="absolute top-4 right-4 p-2 text-white bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] z-[60]"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Mobile AI Panel Floating Toggle */}
            {(isMobile || isTablet) && !aiPanelOpen && (
                <button
                    onClick={() => setAiPanelOpen(true)}
                    className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[linear-gradient(135deg,var(--violet)0%,var(--cyan)100%)] text-white flex items-center justify-center shadow-[0_4px_20px_var(--violet-glow)] transition-transform hover:scale-105"
                >
                    <MessageSquare size={20} />
                </button>
            )}

            {/* Mobile/Tablet Overlay Backgrounds */}
            {((isMobile && sidebarOpen) || ((isMobile || isTablet) && aiPanelOpen)) && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => {
                        if (isMobile) setSidebarOpen(false);
                        setAiPanelOpen(false);
                    }}
                />
            )}
        </div>
    );
}

