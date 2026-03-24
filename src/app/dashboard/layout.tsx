import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscriptionLockout from '@/components/billing/SubscriptionLockout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch subscription logic
    const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
    const { data: profile } = await supabase.from('profiles').select('created_at').eq('id', user.id).single();

    let isTrialExpired = false;
    const now = new Date();

    if (subscription && subscription.trial_ends_at) {
        isTrialExpired = new Date(subscription.trial_ends_at) < now;
    } else if (profile && profile.created_at) {
        // Fallback for missing subscriptions: 7 days after profile creation
        const trialEndDate = new Date(profile.created_at);
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        isTrialExpired = trialEndDate < now;
    }

    const isActive = subscription?.status === 'active';
    const isOwner = user.email === 'abdallahabdelnbii467@gmail.com';
    const isLockedOut = !isActive && isTrialExpired && !isOwner;

    if (isLockedOut) {
        return <SubscriptionLockout />;
    }

    return <>{children}</>;
}
