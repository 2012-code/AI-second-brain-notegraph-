import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chat } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse body
    const { content, noteId } = await req.json();

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content too short to organize' }, { status: 400 });
    }

    // 3. AI Call using unified helper
    const prompt = `You are a professional note organizer. Analyze this note and return ONLY a valid JSON object with no markdown backticks, no explanation:
{
  "title": "concise title max 8 words",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "one of: Work, Personal, Ideas, Research, Learning, Creative",
  "summary": "one sentence summary",
  "organizedContent": "rewrite the note as clean HTML using these tags only: <h2> for main sections, <h3> for subsections, <p> for paragraphs, <ul><li> for bullet lists, <ol><li> for numbered lists, <strong> for emphasis. Do NOT use markdown asterisks or hyphens. Use only valid HTML tags."
}

CRITICAL LANGUAGE INSTRUCTION: Identify the language of the Note and respond in that same language. BUT if the language is English or unclear, respond in English. Do NOT default to Arabic unless the note is clearly in Arabic.

Original note:
${content}`;

    const rawResponse = await chat([
      { role: 'user', content: prompt }
    ], { maxTokens: 1500 });

    // 4. Robust JSON Extraction
    let result;
    try {
      const startIdx = rawResponse.indexOf('{');
      const endIdx = rawResponse.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) throw new Error('No JSON object found in AI response');
      
      const jsonString = rawResponse.substring(startIdx, endIdx + 1);
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI Response was not valid JSON:', rawResponse);
      return NextResponse.json({ error: 'AI failed to generate a valid organized format. Please try again.' }, { status: 500 });
    }

    // 5. Save to DB using standard client (authenticated user)
    if (noteId) {
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title: result.title,
          tags: result.tags,
          category: result.category,
          summary: result.summary,
          content: result.organizedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('user_id', user.id); // Security: only update if owned by user

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json({ error: 'Failed to save organized note to database.' }, { status: 500 });
      }
    }

    return NextResponse.json({ organized: result });

  } catch (err: any) {
    console.error('Organize API unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Failed to organize note.' }, { status: 500 });
  }
}
