import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    // Step 1: Validate environment variables first
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is missing');
      return Response.json({ 
        response: 'AI is not configured. Please add GROQ_API_KEY to environment variables.' 
      }, { status: 200 });
    }

    // User check to save to database correctly later
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ response: 'Unauthorized' }, { status: 401 });

    // Step 2: Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return Response.json({ 
        response: 'Invalid request format.' 
      }, { status: 400 });
    }

    const { message, sessionId, noteContext, sessionMessages } = body;

    let activeSessionId = sessionId;
    if (!activeSessionId) {
        activeSessionId = crypto.randomUUID();
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ 
        response: 'Please type a message first.' 
      }, { status: 200 });
    }

    // Step 3: Build context from notes
    let contextText = '';
    if (noteContext && Array.isArray(noteContext) && noteContext.length > 0) {
      contextText = noteContext
        .filter(n => n.title || n.content)
        .map(n => `Title: ${n.title || 'Untitled'}\nContent: ${n.content?.slice(0, 500) || ''}`)
        .join('\n\n---\n\n');
    }

    // Step 4: Call Groq
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = contextText
      ? `You are a helpful AI assistant for a note-taking app called Notegraph. 
You have access to the user's notes below. Answer questions about their notes, find connections between ideas, and help them think.
Be conversational, concise, and genuinely helpful.

USER'S NOTES:\n${contextText}`
      : `You are a helpful AI assistant for a note-taking app called Notegraph. 
The user hasn't written any notes yet. Encourage them to start writing and explain how you can help once they have notes.
Be friendly and conversational.`;

    const msgs = [
        { role: 'system', content: systemPrompt },
        ...(sessionMessages || []).slice(-6),
        { role: 'user', content: message.trim() }
    ];

    const completion = await groq.chat.completions.create({
      messages: msgs as any,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
      return Response.json({ 
        response: 'I received your message but could not generate a response. Please try again.' 
      });
    }

    // Save history so the user's History verification steps 3-5 succeed
    const admin = createAdminClient();
    await admin.from('chat_messages').insert([
        { user_id: user.id, role: 'user', content: message, referenced_note_ids: null, session_id: activeSessionId },
        { user_id: user.id, role: 'assistant', content: response, referenced_note_ids: null, session_id: activeSessionId },
    ]);

    if (activeSessionId) {
        await admin.from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', activeSessionId);
    }

    return Response.json({ response });

  } catch (err: any) {
    // Step 5: Detailed error logging
    console.error('Chat API error:', {
      message: err.message,
      status: err.status,
      code: err.code,
    });

    // Return user-friendly message based on error type
    if (err.status === 401) {
      return Response.json({ response: 'Invalid API key. Please check your GROQ_API_KEY.' });
    }
    if (err.status === 429) {
      return Response.json({ response: 'Too many requests. Please wait a moment and try again.' });
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return Response.json({ response: 'Network error. Please check your internet connection.' });
    }

    return Response.json({ 
      response: `Something went wrong: ${err.message || 'Unknown error'}` 
    });
  }
}
