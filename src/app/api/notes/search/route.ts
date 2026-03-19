import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/groq';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const q = new URL(request.url).searchParams.get('q');
        if (!q?.trim()) return NextResponse.json({ notes: [] });

        const admin = createAdminClient();

        // Semantic search via pgvector
        const embedding = await generateEmbedding(q);
        const { data: semantic } = await admin.rpc('match_notes', {
            query_embedding: JSON.stringify(embedding),
            match_threshold: 0.2,
            match_count: 10,
            p_user_id: user.id,
        });

        // Keyword fallback
        const { data: keyword } = await admin
            .from('notes')
            .select('id, title, content, summary, tags, category, created_at')
            .eq('user_id', user.id)
            .eq('is_archived', false)
            .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
            .limit(5);

        // Merge and deduplicate
        const seenIds = new Set<string>();
        const results = [...(semantic || []), ...(keyword || [])].filter(n => {
            if (seenIds.has(n.id)) return false;
            seenIds.add(n.id);
            return true;
        }).slice(0, 10);

        return NextResponse.json({ notes: results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
