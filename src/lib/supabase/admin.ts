import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cookies } from 'next/headers';

// Admin client with service role key (bypasses RLS)
export function createAdminClient() {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    return createSupabaseClient(
        supabaseUrl,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

// Middleware-compatible client
export function createMiddlewareClient(request: Request) {
    const headers = new Headers(request.headers);
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return [];
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ({ name, value, options }) => {
                            headers.set('Set-Cookie', `${name}=${value}; Path=/`);
                        }
                    );
                },
            },
        }
    );
    return { supabase, headers };
}
