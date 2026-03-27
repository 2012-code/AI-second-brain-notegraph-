import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: note, error } = await supabase
            .from('notes').select('*').eq('id', params.id).eq('user_id', user.id).single();
        if (error) throw error;

        return NextResponse.json({ note });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { content, title, is_favorite, is_archived, tags, category } = body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (content !== undefined) updateData.content = content;
        if (title !== undefined) updateData.title = title;
        if (is_favorite !== undefined) updateData.is_favorite = is_favorite;
        if (is_archived !== undefined) updateData.is_archived = is_archived;
        if (tags !== undefined) updateData.tags = tags;
        if (category !== undefined) updateData.category = category;

        const { data: note, error } = await supabase
            .from('notes').update(updateData).eq('id', params.id).eq('user_id', user.id).select().single();
        if (error) throw error;

        return NextResponse.json({ note });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase.from('notes').delete().eq('id', params.id).eq('user_id', user.id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
