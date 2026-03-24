
export async function generateEmbedding(text: string): Promise<number[]> {
    // Supabase's gte-small produces 384-dim embeddings
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ text }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            return data.embedding;
        }
    } catch (e: unknown) {
        // Fall back to a pseudo-embedding if edge function not available
    }

    return createPseudoEmbedding(text);
}

function createPseudoEmbedding(text: string): number[] {
    const vector = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        for (let j = 0; j < word.length; j++) {
            const idx = (word.charCodeAt(j) * 17 + i * 31) % 384;
            vector[idx] += 1 / (words.length * word.length);
        }
    }

    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / magnitude);
}

export async function chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: { model?: string; maxTokens?: number }
) {
    const model = options?.model || 'llama-3.1-8b-instant';
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: options?.maxTokens || 1024,
                temperature: 0.7,
            }),
            cache: 'no-store'
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Groq API Error:', error);
            throw new Error(error.error?.message || 'Failed to call Groq API');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    } catch (err: any) {
        console.error('Groq connection error:', err);
        throw err;
    }
}
