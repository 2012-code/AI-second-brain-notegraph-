import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding, chat } from '@/lib/groq';

// GET: list notes, POST: create note
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'all';
        const tag = searchParams.get('tag');
        const sort = searchParams.get('sort') || 'recent';

        let query = supabase
            .from('notes')
            .select('id, title, content, summary, category, tags, key_topics, is_favorite, is_archived, created_at, updated_at')
            .eq('user_id', user.id);

        if (filter === 'today') {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            query = query.gte('created_at', today.toISOString()).eq('is_archived', false);
        } else if (filter === 'week') {
            const week = new Date(); week.setDate(week.getDate() - 7);
            query = query.gte('created_at', week.toISOString()).eq('is_archived', false);
        } else if (filter === 'favorites') {
            query = query.eq('is_favorite', true).eq('is_archived', false);
        } else if (filter === 'archived') {
            query = query.eq('is_archived', true);
        } else {
            query = query.eq('is_archived', false);
        }

        if (tag) query = query.contains('tags', [tag]);

        if (sort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else {
            query = query.order('updated_at', { ascending: false });
        }

        const { data: notes, error } = await query.limit(100);
        if (error) throw error;

        return NextResponse.json({ notes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content, title } = await request.json();
        if (content === undefined) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        const { data: note, error } = await supabase
            .from('notes')
            .insert({ user_id: user.id, content, title: title || null })
            .select()
            .single();

        if (error) throw error;

        // Trigger AI organization in background (fire and forget)
        if (content.trim().length > 20) {
            fetch(new URL('/api/ai/organize', request.url).toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: request.headers.get('cookie') || '',
                },
                body: JSON.stringify({ noteId: note.id, content }),
            }).catch(() => { });
        }

        return NextResponse.json({ note });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
