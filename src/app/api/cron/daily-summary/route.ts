import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chat } from '@/lib/groq';
import { Resend } from 'resend';

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = (process.env.CRON_SECRET || '').trim();
    
    console.log('[cron] Authorization header received:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
        console.log(`[cron] Unauthorized - header mismatch. Expected: Bearer ${expectedSecret?.slice(0,5)}... Received: ${authHeader?.slice(0,12)}...`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const admin = createAdminClient();

    // Get all active users with summaries enabled
    const { data: profiles, error: profilesError } = await admin
        .from('profiles')
        .select('id, full_name, summary_enabled, summary_time, timezone')
        .eq('summary_enabled', true);

    console.log('[cron] Profiles with summary_enabled=true:', profiles?.length ?? 0);
    if (profilesError) {
        console.error('[cron] Error fetching profiles:', profilesError.message);
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles?.length) {
        console.log('[cron] No profiles found with summary_enabled=true in database.');
        return NextResponse.json({ sent: 0, reason: 'no_profiles_enabled' });
    }


    let sent = 0;

    await Promise.allSettled(profiles.map(async (profile) => {
        try {
            console.log(`[cron] Checking user ${profile.id} | summary_time=${profile.summary_time} | timezone=${profile.timezone}`);

            if (!profile.summary_time) {
                console.log(`[cron] Skipping ${profile.id}: no summary_time set`);
                return;
            }
            
            const tz = profile.timezone || 'UTC';
            const currentUtc = new Date();
            
            const localTimeStr = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(currentUtc);
            
            let currentLocalHour = parseInt(localTimeStr.split(':')[0], 10);
            if (currentLocalHour === 24) currentLocalHour = 0;
            const currentLocalMinute = parseInt(localTimeStr.split(':')[1], 10);
            
            const targetParts = profile.summary_time.split(':');
            const targetHour = parseInt(targetParts[0], 10);
            const targetMinute = parseInt(targetParts[1] || '0', 10);

            const currentTotalMinutes = currentLocalHour * 60 + currentLocalMinute;
            const targetTotalMinutes = targetHour * 60 + targetMinute;

            console.log(`[cron] User ${profile.id}: local time=${localTimeStr} (${tz}), target=${targetHour}:${String(targetMinute).padStart(2,'0')}`);
            
            // Wait until the target time has arrived or passed for today
            if (currentTotalMinutes < targetTotalMinutes) {
                console.log(`[cron] Skipping ${profile.id}: target time not reached today (${currentLocalHour}:${currentLocalMinute} < ${targetHour}:${targetMinute})`);
                return;
            }

            // Ensure we haven't already sent a summary in the last 20 hours
            const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
            const { data: sentRecently } = await admin
                .from('daily_summaries')
                .select('id')
                .eq('user_id', profile.id)
                .gte('created_at', twentyHoursAgo)
                .limit(1);

            if (sentRecently && sentRecently.length > 0) {
                console.log(`[cron] Skipping ${profile.id}: already sent in last 20h`);
                return;
            }

            // Get user email
            const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
            if (!user?.email) {
                console.log(`[cron] Skipping ${profile.id}: no email found`);
                return;
            }
            console.log(`[cron] Sending email to ${user.email}`);

            // Get notes from last 24h
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { data: recentNotes } = await admin
                .from('notes')
                .select('title, content, tags, category, created_at')
                .eq('user_id', profile.id)
                .gte('created_at', yesterday.toISOString())
                .limit(10);

            if (!recentNotes?.length) return;

            // Get top topics across all notes
            const { data: allNotes } = await admin
                .from('notes')
                .select('key_topics, tags')
                .eq('user_id', profile.id)
                .limit(50);

            const topicsCount: Record<string, number> = {};
            (allNotes || []).forEach(n => {
                [...(n.key_topics || []), ...(n.tags || [])].forEach(t => {
                    topicsCount[t] = (topicsCount[t] || 0) + 1;
                });
            });
            const topTopics = Object.entries(topicsCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

            const notesText = recentNotes
                .map(n => `- ${n.title || 'Untitled'}: ${n.content?.slice(0, 200)}`)
                .join('\n');

            const prompt = `You are a personal knowledge assistant. Write a friendly daily summary.

User's notes from last 24 hours:
${notesText}

Top topics overall: ${topTopics.join(', ')}

Write a summary with:
1. "Yesterday's Captures" — what they added in 2-3 sentences
2. "Emerging Themes" — patterns across recent notes
3. "Something to Revisit" — one thing to reflect on
4. "Today's Suggestion" — one specific action or thought

Under 200 words. Friendly, smart, personal tone.

CRITICAL LANGUAGE INSTRUCTION:
1. Analyze the language of the provided notes.
2. If the notes contain ANY Arabic text, you MUST write the ENTIRE email summary in Arabic.
3. If the notes are in English, write in English.
4. YOU ARE STRICTLY FORBIDDEN from generating Chinese or Korean characters under any circumstances.
5. DO NOT output ANY conversational filler, meta-commentary, or introductory text (e.g., 'Since the notes contain Arabic...'). Output ONLY the final summary text.`;

            const summary = await chat([{ role: 'user', content: prompt }], { maxTokens: 400 });

            const fullName = profile.full_name || 'there';
            const firstName = fullName.split(' ')[0];

            const appUrl = 'https://notegraph.online';

            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'NoteGraph <noreply@notegraph.online>',
                to: user.email,
                subject: `🧠 ${firstName}'s Daily NoteGraph Summary`,
                html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; color: #F0F0FF; padding: 40px 24px; border-radius: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
              <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #0EA5E9, #06B6D4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">🧠</div>
              <span style="font-size: 20px; font-weight: 600;">NoteGraph Daily</span>
            </div>
            <h2 style="color: #F0F0FF; margin-bottom: 16px;">Your Knowledge Summary, ${firstName}</h2>
            <div style="background: #111118; border: 1px solid #2A2A3A; border-left: 3px solid #06B6D4; border-radius: 12px; padding: 20px; white-space: pre-wrap; line-height: 1.7; color: #D0D0EE;">
${summary}
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #0EA5E9, #0369A1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Open NoteGraph →</a>
            </div>
            <p style="text-align: center; color: #606075; font-size: 12px; margin-top: 24px;">
              <a href="${appUrl}/settings" style="color: #606075;">Manage email preferences</a>
            </p>
          </div>
        `,
            });

            // Save to daily_summaries
            await admin.from('daily_summaries').insert({
                user_id: profile.id,
                summary_text: summary,
                notes_included: recentNotes.map(() => ''),
            });

            sent++;
        } catch (e) {
            console.error(`Failed for user ${profile.id}:`, e);
        }
    }));

    return NextResponse.json({ sent });
}

// GET for on-demand generation
export async function GET(request: NextRequest) {
    try {
        const supabase = await (await import('@/lib/supabase/server')).createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = createAdminClient();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 7);

        const { data: notes } = await admin
            .from('notes')
            .select('title, content, tags, created_at')
            .eq('user_id', user.id)
            .gte('created_at', yesterday.toISOString())
            .limit(15);

        if (!notes?.length) return NextResponse.json({ summary: "You haven't added any notes this week yet. Start capturing your ideas!" });

        const notesText = notes.map(n => `- ${n.title || 'Untitled'}: ${n.content?.slice(0, 150)}`).join('\n');
        const summary = await chat([{
            role: 'user',
            content: `Write a brief, personal, friendly summary of these recent notes in 3-4 sentences. Highlight patterns and key themes.\n\n${notesText}`,
        }], { maxTokens: 300 });

        return NextResponse.json({ summary });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
