export async function POST(req: Request) {
  try {
    const { text, noteId } = await req.json();

    // Use HuggingFace free inference API for 384-dimension embeddings
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const embedding = await response.json();

    if (noteId && Array.isArray(embedding)) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from('notes')
        .update({ embedding })
        .eq('id', noteId);
    }

    return Response.json({ success: true, dimensions: embedding?.length });

  } catch (err) {
    console.error('Embed error:', err);
    return Response.json({ error: 'Embedding failed' }, { status: 500 });
  }
}
