import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chat, generateEmbedding } from '@/lib/groq';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { message, sessionMessages, sessionId } = await request.json();
        if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

        const admin = createAdminClient();

        // Use provided session or generate a new one
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            activeSessionId = crypto.randomUUID();
        }

        // Generate embedding for the question
        const queryEmbedding = await generateEmbedding(message);

        // Search for relevant notes using pgvector
        const { data: relevantNotes } = await admin.rpc('match_notes', {
            query_embedding: JSON.stringify(queryEmbedding),
            match_threshold: 0.3,
            match_count: 5,
            p_user_id: user.id,
        });

        // Fallback: get recent notes if no semantic matches
        let notesContext = relevantNotes || [];
        if (notesContext.length === 0) {
            const { data: recentNotes } = await admin
                .from('notes')
                .select('id, title, content, summary, tags, created_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(5);
            notesContext = recentNotes || [];
        }

        const notesText = notesContext
            .map((n: any) => `Title: ${n.title || 'Untitled'}\nContent: ${n.content?.slice(0, 500)}\nDate: ${n.created_at}`)
            .join('\n---\n');

        const systemPrompt = `You are a personal AI assistant for Cerebro, with access to the user's private notes and knowledge base. 

Answer using ONLY information from their notes. If the answer isn't in their notes, say so clearly.
Always cite which note(s) you reference using [Note: "title"] format.
Be conversational, helpful, and specific.

CRITICAL INSTRUCTION: You must detect the language of the user's message (e.g., Arabic, English) and respond fluency in that EXACT SAME language. If the user writes in Arabic, you MUST reply in Arabic.

User's relevant notes:
${notesText || 'No notes found yet.'}`;

        // Build conversation history
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...(sessionMessages || []).slice(-6),
            { role: 'user' as const, content: message },
        ];

        const response = await chat(messages, { maxTokens: 1024 });

        // Save to chat history with session_id
        await admin.from('chat_messages').insert([
            { user_id: user.id, role: 'user', content: message, referenced_note_ids: null, session_id: activeSessionId },
            { user_id: user.id, role: 'assistant', content: response, referenced_note_ids: notesContext.map((n: any) => n.id), session_id: activeSessionId },
        ]);

        // Update session timestamp
        if (activeSessionId) {
            await admin.from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', activeSessionId);
        }

        return NextResponse.json({
            response,
            referencedNotes: notesContext.map((n: any) => ({ id: n.id, title: n.title || 'Untitled' })),
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
