
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 30; // Allow up to 30s on Vercel Pro, 10s on Hobby
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let userId: string | null = null;

  try {
    // Step 1: Validate environment variables first
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is missing');
      return Response.json({ 
        response: 'AI is not configured. Please add GROQ_API_KEY to environment variables.' 
      }, { status: 200 });
    }

    // Step 2: Parse request body FIRST (fast, no network)
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

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ 
        response: 'Please type a message first.' 
      }, { status: 200 });
    }

    // Step 3: Auth check
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Response.json({ response: 'Unauthorized' }, { status: 401 });
      userId = user.id;
    } catch (authErr: any) {
      console.error('Auth error:', authErr.message);
      return Response.json({ response: 'Authentication error. Please log in again.' }, { status: 401 });
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();
    }

    // Step 4: Build context from notes (limit size to prevent timeout)
    let contextText = '';
    if (noteContext && Array.isArray(noteContext) && noteContext.length > 0) {
      // Limit to 5 notes, 300 chars each to keep payload small
      contextText = noteContext
        .slice(0, 5)
        .filter((n: any) => n.title || n.content)
        .map((n: any) => `Title: ${n.title || 'Untitled'}\nContent: ${(n.content || '').slice(0, 300)}`)
        .join('\n\n---\n\n');
    }

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
      ...(sessionMessages || []).slice(-4),
      { role: 'user', content: message.trim() }
    ];

    let response: string | undefined;
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: msgs,
          max_tokens: 500,
          temperature: 0.7,
        }),
        cache: 'no-store'
      });

      if (!groqResponse.ok) {
        let errorData: any = {};
        try {
          errorData = await groqResponse.json();
        } catch {
          errorData.error = { message: groqResponse.statusText };
        }
        const errMsg = errorData.error?.message || 'Unknown error response from Groq';
        const errStatus = groqResponse.status;
        console.error('Groq API error:', { message: errMsg, status: errStatus });
        
        if (errStatus === 401) {
          return Response.json({ response: 'Invalid API key. Please check your GROQ_API_KEY.' });
        }
        if (errStatus === 429) {
          return Response.json({ response: 'Too many requests. Please wait a moment and try again.' });
        }
        if (errStatus === 400) {
          return Response.json({ response: `AI model error: ${errMsg}` });
        }
        return Response.json({ response: `AI service error: ${errMsg}` });
      }

      const completion = await groqResponse.json();
      response = completion.choices[0]?.message?.content?.trim();
    } catch (fetchErr: any) {
      console.error('Groq fetch execution error:', fetchErr);
      return Response.json({ response: `AI service network error: ${fetchErr.message || 'Could not connect.'}` });
    }

    if (!response) {
      return Response.json({ 
        response: 'I received your message but could not generate a response. Please try again.' 
      });
    }

    // Step 6: Save to DB (non-blocking — don't let DB errors kill the response)
    try {
      const admin = createAdminClient();
      await admin.from('chat_messages').insert([
        { user_id: userId, role: 'user', content: message, referenced_note_ids: null, session_id: activeSessionId },
        { user_id: userId, role: 'assistant', content: response, referenced_note_ids: null, session_id: activeSessionId },
      ]);

      if (activeSessionId) {
        await admin.from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeSessionId);
      }
    } catch (dbErr: any) {
      // Log but don't fail — the user should still see the AI response
      console.error('DB save error (non-fatal):', dbErr.message);
    }

    return Response.json({ response });

  } catch (err: any) {
    console.error('Chat API unexpected error:', {
      message: err.message,
      status: err.status,
      code: err.code,
      stack: err.stack?.slice(0, 300),
    });

    return Response.json({ 
      response: `Something went wrong: ${err.message || 'Unknown error'}. Please try again.` 
    });
  }
}
