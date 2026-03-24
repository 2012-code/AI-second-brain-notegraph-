import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chat } from '@/lib/groq';

export const runtime = 'edge';

// User-facing endpoint: generates a personal daily summary without sending email
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('[DAILY SUMMARY] Auth Error:', authError);
            return NextResponse.json({ error: 'Auth error: ' + authError?.message }, { status: 401 });
        }

        const admin = createAdminClient();

        // Get the last 7 days of notes for a richer summary
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: recentNotes, error: notesError } = await admin
            .from('notes')
            .select('title, content, tags, category, created_at')
            .eq('user_id', user.id)
            .gte('created_at', weekAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

        if (notesError) {
             console.error('[DAILY SUMMARY] DB Fetch Error:', notesError);
             return NextResponse.json({ error: 'DB Fetch Error: ' + notesError.message }, { status: 500 });
        }

        if (!recentNotes?.length) {
            return NextResponse.json({ summary: 'You haven\'t captured any notes in the past week. Start writing and come back for your summary!' });
        }

        const notesText = recentNotes.map((n: { title?: string; content?: string; tags?: string[]; category?: string; created_at?: string }) =>
            `Title: ${n.title || 'Untitled'}\nCategory: ${n.category || 'General'}\nTags: ${(n.tags || []).join(', ')}\nContent: ${(n.content || '').replace(/<[^>]+>/g, '').slice(0, 200)}`
        ).join('\n---\n');

        const prompt = `You are a personal knowledge coach. Write a thoughtful, personal summary.

Write a summary with:
1. "Yesterday's Captures" — what they added in 2-3 sentences
2. "Emerging Themes" — patterns across recent notes
3. "Something to Revisit" — one thing to reflect on
4. "Today's Suggestion" — one specific action or thought

Under 100 words. Friendly, smart, personal tone.

CRITICAL LANGUAGE INSTRUCTION: Identify the language of the Note and respond in that same language. BUT if the language is English or unclear, respond in English. Do NOT default to Arabic unless the note is clearly in Arabic. Do NOT output ANY meta-commentary.

User's notes from the past 7 days:
${notesText}`;

        try {
            console.log('[DAILY SUMMARY] Calling Groq Chat...');
            const summary = await chat([{ role: 'user', content: prompt }], { maxTokens: 400 }); // Upped tokens since we are on edge now
            console.log('[DAILY SUMMARY] Groq Chat Success');
            return NextResponse.json({ summary });
        } catch (groqError: unknown) {
             console.error('[DAILY SUMMARY] Groq Chat Error:', groqError);
             const msg = groqError instanceof Error ? groqError.message : String(groqError);
             return NextResponse.json({ error: 'Groq API Error: ' + msg }, { status: 500 });
        }
    } catch (error: unknown) {
        console.error('[DAILY SUMMARY] Top Level CRASH:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: 'Critical Error: ' + errMsg }, { status: 500 });
    }
}
