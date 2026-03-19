import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List user's chat sessions derived from chat_messages
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = createAdminClient();

        // Get distinct sessions from chat_messages
        const { data: messages, error } = await admin
            .from('chat_messages')
            .select('session_id, content, role, created_at')
            .eq('user_id', user.id)
            .not('session_id', 'is', null)
            .order('created_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Group by session_id, take first user message as title
        const sessionMap = new Map<string, { id: string; title: string; updated_at: string }>();
        for (const msg of (messages || [])) {
            if (!msg.session_id) continue;
            if (!sessionMap.has(msg.session_id)) {
                sessionMap.set(msg.session_id, {
                    id: msg.session_id,
                    title: msg.role === 'user' 
                        ? (msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : ''))
                        : 'Chat',
                    updated_at: msg.created_at,
                });
            }
        }

        const sessions = Array.from(sessionMap.values());
        return NextResponse.json({ sessions });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: "Create" a new session — just returns a new UUID
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Generate a new session ID — no DB write needed
        const sessionId = crypto.randomUUID();
        return NextResponse.json({ 
            session: { 
                id: sessionId, 
                title: 'New Chat', 
                updated_at: new Date().toISOString() 
            } 
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
