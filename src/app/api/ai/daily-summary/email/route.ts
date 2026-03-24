import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// User-facing endpoint: sends the provide summary text to the user's email
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { summary } = await request.json();
        if (!summary) return NextResponse.json({ error: 'Missing summary content' }, { status: 400 });

        const fullName = user.user_metadata?.full_name || 'there';
        const firstName = fullName.split(' ')[0];

        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Cerebro Digest <onboarding@resend.dev>',
            to: user.email,
            subject: `🧠 ${firstName}'s Daily Cerebro Summary`,
            html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #fafafa; padding: 48px 32px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 56px; height: 56px; margin: 0 auto 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6, #d946ef); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3);">
              🧠
            </div>
            <h1 style="font-size: 28px; font-weight: 800; margin: 0; padding-bottom: 8px; background: linear-gradient(to right, #ffffff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em;">Cerebro Insights</h1>
            <p style="color: #a1a1aa; font-size: 15px; margin: 0; font-weight: 500;">Exclusive Knowledge Digest for ${firstName}</p>
          </div>
          
          <!-- Body -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 32px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: linear-gradient(to bottom, #3b82f6, #d946ef);"></div>
            <div style="white-space: pre-wrap; line-height: 1.8; color: #e4e4e7; font-size: 16px; font-weight: 400;">
${summary}
            </div>
          </div>
          
          <!-- CTA -->
          <div style="margin-top: 48px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://notegraph.online'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #fafafa, #d4d4d8); color: #09090b; padding: 16px 36px; border-radius: 14px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 10px 25px -5px rgba(255,255,255,0.15); transition: all 0.2s;">View Your Dashboard</a>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <p style="color: #71717a; font-size: 13px; margin: 0; font-weight: 500;">
              Generated on-demand by Cerebro AI using your recent activity.
            </p>
          </div>
        </div>
      `,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errMsg }, { status: 500 });
    }
}
