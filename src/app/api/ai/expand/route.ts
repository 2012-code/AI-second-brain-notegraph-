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
            content: `Expand this note into a more detailed, well-structured version. Add more depth, examples, and clarity while keeping the original meaning. Return only the expanded text, nothing else.

CRITICAL INSTRUCTION: You MUST detect the language of the Note (e.g., Arabic). All your generated text MUST be fluent in that exact same language.

Note:
${content.slice(0, 3000)}`,
        }], { maxTokens: 1024 });

        return NextResponse.json({ expanded: response });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
