import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const admin = createAdminClient();

        // Verify PayPal webhook signature (simplified - add proper verification in production)
        const event = JSON.parse(body);
        const eventType = event.event_type;
        const subscriptionId = event.resource?.id || event.resource?.billing_agreement_id;

        if (!subscriptionId) return NextResponse.json({ received: true });

        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                // For new subscriptions, we need to bind the user_id from the custom_id 
                // injected by our /create-subscription endpoint
                const userId = event.resource?.custom_id;
                
                await admin.from('subscriptions').upsert({
                    paypal_subscription_id: subscriptionId,
                    status: 'active',
                    paypal_plan_id: event.resource?.plan_id,
                    ...(userId && { user_id: userId }), // Bind the user_id if present
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                }, { onConflict: 'paypal_subscription_id' });
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
            case 'BILLING.SUBSCRIPTION.EXPIRED':
                await admin.from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('paypal_subscription_id', subscriptionId);
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                await admin.from('subscriptions')
                    .update({ status: 'suspended' })
                    .eq('paypal_subscription_id', subscriptionId);
                break;

            case 'PAYMENT.SALE.COMPLETED':
                // Renew subscription period
                await admin.from('subscriptions')
                    .update({
                        status: 'active',
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .eq('paypal_subscription_id', event.resource?.billing_agreement_id);
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('PayPal webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
