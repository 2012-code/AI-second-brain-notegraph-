import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[GALAXY] POST auth failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const positions = body.positions ?? null;

    console.log('[GALAXY] POST saving for user:', user.id, 'keys:', positions ? Object.keys(positions).length : 'null');

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .upsert({ id: user.id, galaxy_positions: positions });

    if (error) {
      console.error('[GALAXY] POST update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[GALAXY] POST route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('[GALAXY] GET called');

    // Step 1: Try to get authenticated user
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.log('[GALAXY] GET auth error:', authError.message);
      }
      userId = user?.id ?? null;
    } catch (authErr) {
      console.error('[GALAXY] GET createClient crashed:', authErr);
    }

    if (!userId) {
      console.log('[GALAXY] GET no user, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GALAXY] GET user:', userId);

    // Step 2: Fetch positions using admin client
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('galaxy_positions')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[GALAXY] GET query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const posKeys = data?.galaxy_positions ? Object.keys(data.galaxy_positions).length : 0;
    console.log('[GALAXY] GET result:', posKeys, 'keys');

    return NextResponse.json({ positions: data?.galaxy_positions ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : '';
    console.error('[GALAXY] GET CRASH:', message);
    console.error('[GALAXY] GET STACK:', stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
