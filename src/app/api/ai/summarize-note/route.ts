import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chat } from '@/lib/groq';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content } = await request.json();
        if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        const response = await chat([{
            role: 'user',
            content: `Summarize the following note in 2-3 sentences. Focus on the key insights and main points. Be concise and clear.

CRITICAL INSTRUCTION: You MUST detect the language of the Note (e.g., Arabic). Your summary MUST be fluent in that exact same language.

Note:
${content.slice(0, 3000)}`,
        }], { maxTokens: 200 });

        return NextResponse.json({ summary: response });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
