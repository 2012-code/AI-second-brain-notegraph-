import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const format = new URL(request.url).searchParams.get('format') || 'json';

        const { data: notes } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (!notes) return NextResponse.json({ error: 'No notes found' }, { status: 404 });

        if (format === 'markdown') {
            const markdown = notes.map(note => {
                const lines = [
                    `# ${note.title || 'Untitled'}`,
                    ``,
                    `**Date:** ${new Date(note.created_at).toLocaleDateString()}`,
                    note.category ? `**Category:** ${note.category}` : '',
                    note.tags?.length ? `**Tags:** ${note.tags.join(', ')}` : '',
                    note.summary ? `**Summary:** ${note.summary}` : '',
                    ``,
                    note.content,
                    ``,
                    `---`,
                    ``,
                ].filter(l => l !== null);
                return lines.join('\n');
            }).join('\n');

            return new NextResponse(markdown, {
                headers: {
                    'Content-Type': 'text/markdown',
                    'Content-Disposition': `attachment; filename="cerebro-notes-${Date.now()}.md"`,
                },
            });
        }

        // JSON export
        const exportData = {
            exported_at: new Date().toISOString(),
            total_notes: notes.length,
            notes: notes.map(n => ({
                id: n.id,
                title: n.title,
                content: n.content,
                summary: n.summary,
                category: n.category,
                tags: n.tags,
                key_topics: n.key_topics,
                is_favorite: n.is_favorite,
                created_at: n.created_at,
                updated_at: n.updated_at,
            })),
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="cerebro-notes-${Date.now()}.json"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
