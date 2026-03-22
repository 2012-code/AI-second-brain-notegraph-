'use client';

import { useState, useRef, useEffect } from 'react';
import { Note } from '@/types';
import { Sparkles, BookOpen, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    session_id?: string;
    created_at?: string;
    referencedNotes?: { id: string; title: string }[];
}

const SUGGESTIONS = [
    'What are my main recurring themes?',
    'Summarize my notes from this week',
    'What did I write about productivity?',
    'What ideas are connected to my latest note?',
];

interface Props {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    currentNote: Note | null;
    notes: Note[];
}

export default function AIChatPanel({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSidebarOpen = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onToggleSidebar = () => { },
    currentNote = null,
    notes = []
}: Partial<Props>) {
    const supabase = createClient();
    const [aiView, setAiView] = useState<'chat' | 'history'>('chat');
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [chatSessionsError, setChatSessionsError] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const saveChatTitle = async (sessionId: string) => {
        if (!editTitle.trim()) {
            setEditingSessionId(null);
            return;
        }
        try {
            const res = await fetch(`/api/chat/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle.trim() }),
            });
            const data = await res.json();
            if (!data.error) {
                setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editTitle.trim() } : s));
            }
        } catch (err) {
            console.error('Failed to rename chat:', err);
        }
        setEditingSessionId(null);
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (aiView === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, aiView]);

    const loadChatSessions = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) return;

            const { data: sessions, error } = await supabase
                .from('chat_sessions')
                .select('id, title, created_at, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(30);

            if (error) {
                console.error('Error loading sessions:', error.message);
                return;
            }

            setChatSessions(sessions || []);

        } catch (err) {
            console.error('Unexpected error loading sessions:', err);
        }
    };

    const createNewChat = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { toast.error('You must be logged in'); return; }

            const res = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, title: 'New Chat' }),
            });
            const data = await res.json();

            if (data.error) {
                toast.error('Failed to create chat: ' + data.error);
                return;
            }

            setCurrentSessionId(data.session.id);
            setChatMessages([]);
            setAiView('chat');
            toast.success('New chat started!');
        } catch (err: unknown) {
            toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const loadSessionMessages = async (sessionId: string) => {
        if (!sessionId) return;

        try {
            // Step 1: Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                console.error('Auth error loading messages:', userError);
                return;
            }

            // Step 2: Fetch messages for this session
            const { data: messages, error: messagesError } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (messagesError) {
                console.error('Error loading messages:', messagesError.message);
                // Show error in UI
                setChatMessages([{
                    id: 'error',
                    role: 'assistant',
                    content: 'Could not load this conversation. Please try again.',
                    created_at: new Date().toISOString(),
                }]);
                return;
            }

            // Step 3: Set messages — even if empty array
            console.log(`Loaded ${messages?.length || 0} messages for session ${sessionId}`);
            setChatMessages(messages || []);

            // Step 4: Switch to chat view
            setCurrentSessionId(sessionId);
            setAiView('chat');

        } catch (err) {
            console.error('Unexpected error loading messages:', err);
        }
    };

    const handleSendMessage = async (text?: string) => {
        const userMessage = (text || aiInput).trim();
        if (!userMessage || isAiThinking) return;

        setAiInput('');
        setIsAiThinking(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Create session if none exists
            let sessionId = currentSessionId;
            if (!sessionId) {
                const sessionTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
                
                const res = await fetch('/api/chat/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, title: sessionTitle }),
                });
                const sessionData = await res.json();

                if (sessionData.error) {
                    toast.error('Failed to create chat session: ' + sessionData.error);
                    setIsAiThinking(false);
                    return;
                }

                sessionId = sessionData.session.id;
                setCurrentSessionId(sessionId);
            }

            // Add user message to UI immediately
            const userMsg: Message = { 
                id: Date.now().toString(),
                role: 'user', 
                content: userMessage, 
                session_id: sessionId ?? undefined,
                created_at: new Date().toISOString()
            };
            setChatMessages(prev => [...prev, userMsg]);

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId,
                    noteContext: notes,
                    sessionMessages: chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await response.json();
            const aiResponse = data.response || data.message || 'Sorry, I could not process that.';

            // Add AI response to UI
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                session_id: sessionId ?? undefined,
                created_at: new Date().toISOString(),
                referencedNotes: data.referencedNotes,
            };
            setChatMessages(prev => [...prev, aiMsg]);

        } catch (err: unknown) {
            console.error('Chat error:', err);
            setChatMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
                created_at: new Date().toISOString()
            }]);
            toast.error('AI error: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div className="ai-panel">
            {/* AI Panel Header with History Toggle */}
            <div className="ai-panel-header">
                <div className="ai-panel-header-top">
                    <div className="ai-panel-icon">
                        <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                        <div className="ai-panel-title">AI Assistant</div>
                        <div className="ai-panel-subtitle">{notes.length} notes in memory</div>
                    </div>
                </div>

                {/* View toggle */}
                <div className="ai-view-toggle">
                    <button
                        className={`ai-toggle-btn ${aiView === 'chat' ? 'active' : ''}`}
                        onClick={() => setAiView('chat')}
                    >
                        Chat
                    </button>
                    <button
                        className={`ai-toggle-btn ${aiView === 'history' ? 'active' : ''}`}
                        onClick={async () => {
                            await loadChatSessions(); // Always reload fresh when tab clicked
                            setAiView('history');
                        }}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Chat view */}
            {aiView === 'chat' && (
                <div className="ai-chat-view h-full flex flex-col flex-1 overflow-hidden">
                    {/* New Chat button */}
                    <button className="new-chat-btn" onClick={createNewChat}>
                        + New Chat
                    </button>

                    {/* Messages */}
                    <div className="ai-messages flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {chatMessages.length === 0 && (
                            <div className="ai-suggestions">
                                <div className="ai-suggestions-label">ASK ME ANYTHING</div>
                                {SUGGESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        className="ai-suggestion-btn"
                                        onClick={() => handleSendMessage(q)}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {chatMessages.map((msg, i) => (
                            <div key={msg.id || i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.role === 'user' ? (
                                    <div className="ai-message-user">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <div className="ai-message-assistant">
                                        <div className="prose-ai whitespace-pre-wrap">{msg.content}</div>

                                        {msg.referencedNotes && msg.referencedNotes.length > 0 && (
                                            <div className="mt-3 pt-3 flex flex-wrap gap-1.5 items-center border-t border-[var(--border-subtle)]">
                                                <BookOpen size={11} className="text-[var(--cyan)] mr-1 opacity-70" />
                                                {msg.referencedNotes.map(n => (
                                                    <button
                                                        key={n.id}
                                                        className="note-reference"
                                                        title="Open referenced note"
                                                    >
                                                        {n.title || 'Untitled'}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isAiThinking && (
                            <div className="ai-thinking">
                                <div className="ai-message-assistant !py-3 !px-4 flex items-center gap-1.5">
                                    <div className="ai-thinking-dot" />
                                    <div className="ai-thinking-dot" />
                                    <div className="ai-thinking-dot" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-2" />
                    </div>

                    {/* Input */}
                    <div className="ai-input-wrapper">
                        <textarea
                            ref={inputRef}
                            className="ai-input"
                            placeholder="Ask about your notes..."
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            rows={1}
                        />
                        <button 
                            className="ai-send-btn disabled:opacity-50" 
                            onClick={() => handleSendMessage()}
                            disabled={!aiInput.trim() || isAiThinking}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* History view */}
            {aiView === 'history' && (
                <div className="ai-history-view">
                    <div className="ai-history-header">
                        <span className="ai-suggestions-label">CHAT HISTORY</span>
                        <button className="new-chat-btn-sm" onClick={createNewChat}>
                            + New
                        </button>
                    </div>

                    {chatSessionsError && (
                        <div className="p-4 text-xs text-red-400">Error: {chatSessionsError}</div>
                    )}

                    {chatSessions.length === 0 && !chatSessionsError ? (
                        <div className="ai-history-empty">
                            <p>No chat history yet</p>
                            <button className="new-chat-btn" onClick={createNewChat}>
                                Start your first chat
                            </button>
                        </div>
                    ) : (
                        <div className="ai-history-list">
                            {chatSessions.map(session => (
                                <div
                                    key={session.id}
                                    className={`group ai-history-item-container flex items-center justify-between w-full p-2 mb-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors ${currentSessionId === session.id ? 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]' : 'border border-transparent'}`}
                                >
                                    {editingSessionId === session.id ? (
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={() => saveChatTitle(session.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveChatTitle(session.id);
                                                if (e.key === 'Escape') setEditingSessionId(null);
                                            }}
                                            className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-sm text-white w-full mr-2 focus:outline-none focus:border-[var(--violet)]"
                                            autoFocus
                                        />
                                    ) : (
                                        <button
                                            className="text-left flex-1"
                                            onClick={() => loadSessionMessages(session.id)}
                                        >
                                            <div className="ai-history-item-title text-[13px] text-[rgba(255,255,255,0.9)]">{session.title}</div>
                                            <div className="ai-history-item-date text-[11px] text-[rgba(255,255,255,0.4)] mt-1" suppressHydrationWarning>
                                                {isMounted ? new Date(session.updated_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : ''}
                                            </div>
                                        </button>
                                    )}
                                    {editingSessionId !== session.id && (
                                        <button
                                            className="text-[rgba(255,255,255,0.4)] hover:text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-[rgba(255,255,255,0.1)] ml-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingSessionId(session.id);
                                                setEditTitle(session.title);
                                            }}
                                            title="Rename chat"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
