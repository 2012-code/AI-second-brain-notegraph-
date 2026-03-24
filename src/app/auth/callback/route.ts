import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    let next = requestUrl.searchParams.get('next') || '/dashboard';
    const origin = requestUrl.origin;

    if (code) {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
        
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();
                
            if (!profile?.onboarding_completed) {
                next = '/onboarding';
            }
        }
    }

    return NextResponse.redirect(`${origin}${next}`);
}
