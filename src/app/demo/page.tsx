'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Note } from '@/types';
import { Sparkles, Send, X, Code, Play } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const DEMO_NOTES: Partial<Note>[] = [
    {
        id: 'demo-1', title: 'Atomic Habits — Key Insights',
        content: 'Habits are the compound interest of self-improvement. Small 1% improvements compound remarkably over time. The key insight: identity change comes before behavior change. "I am a writer" vs "I want to write." Four laws of behavior change: Make it obvious, attractive, easy, satisfying.',
        tags: ['books', 'productivity', 'habits'], category: 'Learning',
        summary: 'Notes on habit formation from Atomic Habits - identity-based change and the four laws.',
        is_favorite: true, is_archived: false, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'demo-2', title: 'Coffee Subscription Box Idea',
        content: 'Business idea: curated coffee subscription targeting 25-40 year old professionals. Monthly box with 2-3 single-origin coffees, a tasting guide, and brewing tips. Differentiation: partner directly with specific farms, tell the story behind each coffee. Target price: $35-45/month. MVP: start with local roasters.',
        tags: ['business', 'ideas', 'entrepreneurship'], category: 'Ideas',
        summary: 'Business idea for a premium coffee subscription box with farm partnerships.',
        is_favorite: false, is_archived: false, created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        id: 'demo-3', title: 'Q1 Planning Notes',
        content: 'Q1 main priorities: 1) Launch the mobile app MVP, 2) Grow paid user base to 500, 3) Close first enterprise deal. Key metrics to track: DAU, churn rate, NPS. Risk: engineering bandwidth constrained by two departures. Mitigation: bring in contractor for mobile, defer non-critical features.',
        tags: ['work', 'planning', 'q1'], category: 'Work',
        summary: 'Q1 planning session priorities: mobile MVP, user growth to 500, first enterprise deal.',
        is_favorite: false, is_archived: false, created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
        id: 'demo-4', title: 'Productivity vs Choosing Better',
        content: 'Random thought: what if productivity isn\'t about doing more but choosing better? The most productive people I know don\'t work more hours — they work on different things. Essentialism: the disciplined pursuit of less. Question to ask: "What is the highest point of contribution I can make?" Everything else is noise.',
        tags: ['thoughts', 'productivity', 'philosophy'], category: 'Personal',
        summary: 'Reflection on productivity being about better choices, not more work.',
        is_favorite: true, is_archived: false, created_at: new Date(Date.now() - 345600000).toISOString(), updated_at: new Date(Date.now() - 345600000).toISOString(),
    },
    {
        id: 'demo-5', title: 'Sleep & Creativity Research',
        content: 'Studies show REM sleep consolidates creative connections formed during waking hours. Edison and Dali both used hypnagogic states (falling asleep) to access creative insight — holding objects to wake themselves at the moment of sleep onset. Practical implication: creative problems benefit from "sleeping on it" literally.',
        tags: ['research', 'creativity', 'sleep', 'science'], category: 'Research',
        summary: 'Research on how REM sleep consolidates creative connections and problem-solving.',
        is_favorite: false, is_archived: false, created_at: new Date(Date.now() - 432000000).toISOString(), updated_at: new Date(Date.now() - 432000000).toISOString(),
    },
];

export default function DemoPage() {
    const [selectedNote, setSelectedNote] = useState<Partial<Note>>(DEMO_NOTES[0]);
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [preview, setPreview] = useState(false);

    const sendChat = async (text?: string) => {
        const msg = (text || chatInput).trim();
        if (!msg) return;
        setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
        setChatInput('');
        setChatLoading(true);

        await new Promise(r => setTimeout(r, 1200));

        const demoResponses: Record<string, string> = {
            'themes': 'Looking at your notes, your main recurring themes are **productivity & focus** (Atomic Habits, Deep Work), **entrepreneurship** (coffee subscription idea, side project plan), and **creativity & learning** (sleep research, Cal Newport). There\'s a meaningful thread connecting how the *mind works best* across all of them.',
            'productivity': 'You\'ve written about productivity from multiple angles. In your "Productivity vs Choosing Better" note, you reflect that it\'s about *selecting the right work* rather than doing more. This connects to Cal Newport\'s Deep Work concept in your other note.',
            'default': `Based on your notes, I found some relevant insights. Your notes show a pattern of connecting ideas across domains — like sleep science connecting to creativity and productivity. You have ${DEMO_NOTES.filter(n => n.category === 'Ideas').length} idea notes.`,
        };

        const key = msg.toLowerCase().includes('theme') ? 'themes' :
            msg.toLowerCase().includes('product') ? 'productivity' : 'default';

        setChatMessages(prev => [...prev, { role: 'assistant', content: demoResponses[key] }]);
        setChatLoading(false);
    };

    return (
        <div className="min-h-screen bg-background-primary flex flex-col overflow-hidden">
            {/* Top Bar (Demo Banner) */}
            <div
                className="h-[40px] w-full flex items-center justify-between px-6 shrink-0 z-50 text-white font-sans text-[13px]"
                style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
            >
                <div className="flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>You&apos;re viewing demo data. Sign up free to use your own notes.</span>
                </div>
                <Link
                    href="/signup"
                    className="bg-white text-accent-primary font-medium rounded-[6px] px-[16px] py-[6px] transition-all hover:bg-opacity-90 leading-none flex items-center"
                >
                    Sign Up Free
                </Link>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Mini (Just for demo to show list) */}
                <div className="w-[300px] flex-shrink-0 h-full flex flex-col border-r border-border bg-background-primary z-0 pt-4">
                    <div className="px-6 mb-4">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles size={16} className="text-accent-primary" />
                            <span className="font-serif text-[20px] text-text-primary tracking-tight">NoteGraph</span>
                        </div>
                        <p className="text-[14px] text-text-primary mb-1">Demo Notebook</p>
                        <p className="text-[12px] text-text-muted">Explore how AI connects your ideas.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4">
                        {DEMO_NOTES.map((note) => {
                            const isSelected = selectedNote.id === note.id;
                            return (
                                <button
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className={`text-left px-4 py-4 mx-4 mb-2 rounded-[10px] transition-all duration-150 border block bg-background-secondary ${isSelected
                                        ? 'border-accent-primary bg-background-tertiary'
                                        : 'border-border hover:border-border-light hover:bg-background-tertiary hover:-translate-y-[1px]'
                                        }`}
                                >
                                    <h3 className="font-serif text-[16px] text-text-primary mb-1 truncate">{note.title}</h3>
                                    <p className="text-[13px] text-text-secondary leading-[1.5] line-clamp-2 mb-3">{note.summary}</p>
                                    <div className="flex items-center justify-between">
                                        <div>{note.category && <span className="category-pill">{note.category}</span>}</div>
                                        <span className="text-[11px] text-text-muted">{formatDate(note.updated_at || '')}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Note Editor Area */}
                <div className="flex-1 flex flex-col h-full bg-background-primary relative">
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-[720px] mx-auto w-full px-[24px] sm:px-[48px] py-[40px] flex flex-col min-h-full">
                            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {selectedNote.category && <span className="category-pill">{selectedNote.category}</span>}
                                    {selectedNote.tags?.map(t => <span key={t} className="tag-pill">{t}</span>)}
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <button onClick={() => setPreview(!preview)} className={`p-1.5 rounded-lg transition-all ${preview ? 'text-accent-primary' : 'text-text-muted hover:text-text-secondary'}`} title={preview ? "Edit Mode" : "Preview Mode"}>
                                        {preview ? <Code size={16} /> : <Play size={16} />}
                                    </button>
                                </div>
                            </div>

                            {!preview && (
                                <div className="flex items-center gap-2 mb-8 pb-4 border-b border-border">
                                    {['Organize', 'Summarize', 'Expand'].map(a => (
                                        <button
                                            key={a}
                                            onClick={() => setAiResult(`Demo: AI would ${a.toLowerCase()} this note in the full version.`)}
                                            className="btn-ghost-action"
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <input
                                type="text"
                                readOnly
                                value={selectedNote.title || ''}
                                className="w-full bg-transparent text-[32px] font-serif text-text-primary placeholder-text-muted outline-none mb-6 border-none"
                            />

                            <div className="flex-1 w-full relative pb-16">
                                {aiResult && (
                                    <div className="bg-background-tertiary border border-accent-secondary/30 border-l-[3px] border-l-accent-secondary rounded-[4px_12px_12px_12px] p-[12px] mb-6 text-[13px] text-text-primary flex items-start gap-3">
                                        <Sparkles size={14} className="text-accent-secondary shrink-0 mt-0.5" />
                                        <span className="flex-1 pt-0.5">{aiResult}</span>
                                        <button onClick={() => setAiResult(null)} className="text-text-muted hover:text-text-secondary"><X size={14} /></button>
                                    </div>
                                )}

                                {preview ? (
                                    <article className="prose-ai max-w-none">
                                        <ReactMarkdown>{selectedNote.content || ''}</ReactMarkdown>
                                    </article>
                                ) : (
                                    <textarea
                                        readOnly
                                        className="note-editor"
                                        value={selectedNote.content}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-background-primary/90 backdrop-blur-sm border-t border-border px-6 py-2 flex items-center justify-between text-[12px] text-text-muted">
                        <span className="flex items-center gap-1.5 text-status-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span> Saved
                        </span>
                        <span>Demo Mode - Read Only</span>
                    </div>
                </div>

                {/* AI Chat Panel */}
                <div className="ai-panel z-10">
                    <div className="ai-panel-header">
                        <div className="ai-panel-header-top">
                            <div className="ai-panel-icon">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <span className="ai-panel-title">AI Assistant</span>
                        </div>
                        <p className="ai-panel-subtitle">{DEMO_NOTES.length} notes in memory</p>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {chatMessages.length === 0 && (
                            <div className="p-4 space-y-3 mt-2">
                                <div className="ai-suggestions-label">Ask me anything</div>
                                <div className="flex flex-col gap-2">
                                    {['What are my main recurring themes?', 'What did I write about productivity?'].map(s => (
                                        <button key={s} onClick={() => sendChat(s)} className="ai-suggestion-btn">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="p-4 space-y-4">
                            {chatMessages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                                    {m.role === 'user' ? (
                                        <div className="ai-message-user">
                                            {m.content}
                                        </div>
                                    ) : (
                                        <div className="ai-message-assistant">
                                            <div className="prose-ai whitespace-pre-wrap">{m.content}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <div className="ai-message-assistant !py-3 !px-4 flex items-center gap-1.5">
                                        <div className="ai-thinking-dot" />
                                        <div className="ai-thinking-dot" />
                                        <div className="ai-thinking-dot" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="ai-input-wrapper">
                        <div className="relative">
                            <textarea
                                value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                                placeholder="Ask about your notes..." rows={1} className="ai-input"
                            />
                            <button
                                onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading}
                                className="ai-send-btn disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={14} className="ml-0.5 text-white" />
                            </button>
                        </div>
                        {chatMessages.length > 0 && (
                            <div className="flex justify-end mt-2 pr-1">
                                <button onClick={() => setChatMessages([])} className="text-[11px] text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1">
                                    <X size={10} /> Clear chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
