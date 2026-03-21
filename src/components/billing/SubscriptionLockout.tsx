'use client';

import { toast } from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Lock, Brain, Zap, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionLockout() {
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-[#04070F] text-[#F0F4FF] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Effects */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#0EA5E9]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#F59E0B]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-xl w-full relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                    <Lock size={32} className="text-red-400" />
                </div>

                <div>
                    <h1 className="text-3xl sm:text-4xl font-serif mb-4" style={{ fontFamily: '"Cal Sans", sans-serif' }}>
                        Your Free Trial Has Concluded
                    </h1>
                    <p className="text-lg text-white/50 leading-relaxed font-light">
                        Hope you enjoyed your 7 days of unlimited AI-powered note organization. Upgrade to NoteGraph Pro to unlock your second brain once again.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[24px] p-8 text-left backdrop-blur-md">
                    <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                        <Sparkles size={18} className="text-[#F59E0B]" />
                        Unlock Everything with Pro
                    </h3>
                    <ul className="space-y-4 mb-8">
                        {[
                            { icon: Brain, title: 'Unlimited AI Tagging & Organization', color: 'text-blue-400' },
                            { icon: Zap, title: 'Chat With Your Entire Knowledge Base', color: 'text-amber-400' },
                            { icon: Search, title: 'Semantic Semantic Search & Insights', color: 'text-purple-400' },
                        ].map(feature => (
                            <li key={feature.title} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                                    <feature.icon size={16} className={feature.color} />
                                </div>
                                <span className="text-white/70 text-sm font-medium">{feature.title}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Payment Buttons Container */}
                    <div className="pt-6 border-t border-white/10">
                        {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                            <div className="min-w-[200px] w-full relative z-20">
                                <PayPalScriptProvider options={{ 
                                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, 
                                    vault: true, 
                                    intent: "subscription" 
                                }}>
                                    <PayPalButtons 
                                        style={{ height: 46, shape: "rect", color: "blue", layout: "horizontal", label: "subscribe" }}
                                        createSubscription={async (data, actions) => {
                                            const { data: { session } } = await supabase.auth.getSession();
                                            const res = await fetch('/api/billing/create-subscription', {
                                                method: 'POST',
                                                headers: { Authorization: `Bearer ${session?.access_token}` }
                                            });
                                            const subData = await res.json();
                                            if (subData.error) throw new Error(subData.error);
                                            return subData.subscriptionId;
                                        }}
                                        onApprove={async (data, actions) => {
                                            toast.success("Welcome back! Your subscription is active.");
                                            setTimeout(() => window.location.reload(), 2000);
                                        }}
                                        onError={(err) => {
                                            toast.error("PayPal checkout failed.");
                                            console.error("PayPal Error:", err);
                                        }}
                                    />
                                </PayPalScriptProvider>
                            </div>
                        ) : (
                            <button disabled className="w-full py-3 rounded-xl bg-gray-600/50 text-white/50 text-sm font-medium border border-white/5">
                                Subscription system currently unavailable
                            </button>
                        )}
                        <p className="text-center text-xs text-white/30 mt-4">
                            $9.99/month. Secure payment via PayPal.
                        </p>
                    </div>
                </div>

                <button onClick={handleLogout} className="text-sm font-medium text-white/30 hover:text-white/80 transition-colors">
                    Log out of my account
                </button>
            </div>
        </div>
    );
}
