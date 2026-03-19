import Groq from 'groq-sdk';

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
    // Supabase's gte-small produces 384-dim embeddings
    // Since Groq doesn't provide embeddings, we use a compatible API
    // For now, we'll use a deterministic hash-based approach for the demo
    // Replace with real embeddings API when integrating full production

    try {
        // Try to use the Supabase Edge Function for embeddings
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e: unknown) {
        // Fall back to a pseudo-embedding if edge function not available
    }

    // Fallback: create a simple deterministic vector from text
    // (not semantically meaningful, but prevents app crashes)
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

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map(v => v / magnitude);
}

export async function chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: { model?: string; maxTokens?: number }
) {
    const completion = await groq.chat.completions.create({
        model: options?.model || 'llama-3.3-70b-versatile',
        messages,
        max_tokens: options?.maxTokens || 1024,
        temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
}
