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

    // 3. AI Call using unified helper with JSON Mode enabled
    const prompt = `You are a professional note organizer. Analyze the provided note and transform it into a beautifully structured, clean document. 

Instructions:
1. Organize the content into logical sections with clear, descriptive headings (<h2>).
2. Use subsections (<h3>) if the note is complex.
3. Use bullet points (<ul><li>) or numbered lists (<ol><li>) for itemized information.
4. Use bold (<strong>) for key terms or important phrases.
5. Improve the flow and grammar while preserving all original facts and details.
6. Do NOT mention the language of the note or add any meta-commentary.
7. Return the result in the same language as the note (default to English if unclear).

Return a valid JSON object:
{
  "title": "A compelling, concise title (max 8 words)",
  "tags": ["3-5 relevant lowercase tags"],
  "category": "One of: Work, Personal, Ideas, Research, Learning, Creative",
  "summary": "A high-level 1-sentence summary",
  "organizedContent": "The rewritten note as clean HTML using only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>. Do NOT use markdown symbols."
}

Original note:
${content}`;

    // IMPORTANT: Using jsonMode: true and a lower temperature (0.1) for maximum reliability
    const rawResponse = await chat([
      { role: 'user', content: prompt }
    ], { 
      maxTokens: 1500, 
      jsonMode: true, 
      temperature: 0.1 
    });

    // 4. Robust JSON Extraction
    let result;
    try {
      // With jsonMode, we can try to parse directly, but still use the substring 
      // extraction just in case the model adds any tiny prefix/suffix.
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
        .eq('user_id', user.id); 

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
