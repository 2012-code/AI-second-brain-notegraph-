import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/groq';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { noteId, content } = await request.json();
        if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        const admin = createAdminClient();
        const embedding = await generateEmbedding(content);

        const { data: related } = await admin.rpc('match_notes', {
            query_embedding: JSON.stringify(embedding),
            match_threshold: 0.4,
            match_count: 6,
            p_user_id: user.id,
        });

        // Filter out the current note
        const filtered = (related || []).filter((n: any) => n.id !== noteId).slice(0, 5);

        return NextResponse.json({ related: filtered });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
