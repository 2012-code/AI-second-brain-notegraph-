import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { content, noteId } = await req.json();

    if (!content || content.trim().length < 10) {
      return Response.json({ error: 'Content too short to organize' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are a professional note organizer. Analyze this note and return ONLY a valid JSON object with no markdown backticks, no explanation:
{
  "title": "concise title max 8 words",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "one of: Work, Personal, Ideas, Research, Learning, Creative",
  "summary": "one sentence summary",
  "organizedContent": "rewrite the note as clean HTML using these tags only: <h2> for main sections, <h3> for subsections, <p> for paragraphs, <ul><li> for bullet lists, <ol><li> for numbered lists, <strong> for emphasis. Do NOT use markdown asterisks or hyphens. Use only valid HTML tags."
}

CRITICAL LANGUAGE INSTRUCTION: You MUST detect the language of the 'Original note' (e.g., Arabic). All your generated text (title, tags, category, summary, and organizedContent) MUST be fluent in that exact same language. For example, if the note is in Arabic, your title, category, and tags must be in Arabic.

Original note:
${content}`
      }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
    });

    const raw = completion.choices[0].message.content || '{}';
    const cleaned = raw
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Save organized data to Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (noteId) {
      await supabase
        .from('notes')
        .update({
          title: result.title,
          tags: result.tags,
          category: result.category,
          summary: result.summary,
          content: result.organizedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);
    }

    return Response.json({ organized: result });

  } catch (err) {
    console.error('Organize API error:', err);
    return Response.json({ error: 'Failed to organize note.' }, { status: 500 });
  }
}
