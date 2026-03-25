'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Check, Shield, Zap, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FounderDealPage() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const handleSubscribe = async () => {
        if (!user) {
            router.push('/login?returnTo=/founder-deal');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/paypal/founder-checkout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                throw new Error(data.error || 'Failed to start checkout');
            }
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050B18] text-white selection:bg-[#0EA5E9]/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0EA5E9]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F59E0B]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Navigation */}
            <nav className="relative z-20 border-b border-white/5 bg-[#050B18]/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-tr from-[#0EA5E9] to-[#06B6D4] rounded-lg flex items-center justify-center font-serif font-bold italic group-hover:scale-110 transition-transform">N</div>
                        <span className="font-serif text-xl tracking-tight" style={{ fontFamily: '"Cal Sans", sans-serif' }}>NoteGraph</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link href="/dashboard" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Dashboard</Link>
                        ) : (
                            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-white transition-colors">Sign In</Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-20 pb-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold tracking-widest uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Star size={12} fill="currentColor" /> Limited Founder Deal
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent" style={{ fontFamily: '"Cal Sans", sans-serif' }}>
                        Build your Second Brain <br /> as a Founder.
                    </h1>
                    
                    <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join our early adopter circle and lock in a 50% discount on NoteGraph Pro for life. No gimmicks, just our way of saying thanks for being first.
                    </p>

                    {/* Pricing Card */}
                    <div className="relative max-w-md mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#0EA5E9] to-[#F59E0B] rounded-[32px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-[#0C1220] border border-white/10 rounded-[32px] p-10 overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Zap size={120} />
                            </div>

                            <div className="text-left relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Founder Plan</h3>
                                <div className="flex items-baseline gap-3 mb-8">
                                    <span className="text-5xl font-bold text-white">$4.99</span>
                                    <span className="text-xl text-text-muted line-through">$9.99</span>
                                    <span className="text-text-muted">/month</span>
                                </div>

                                <div className="space-y-4 mb-10">
                                    {[
                                        "Unlimited AI Connections",
                                        "Advanced Semantic Search",
                                        "Priority Early Access to Beta Features",
                                        "50% Discount Locked Forever",
                                        "Founder Badge on Profile",
                                        "Exclusive Discord Channel Access"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-text-secondary">
                                            <div className="w-5 h-5 rounded-full bg-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0">
                                                <Check size={12} className="text-[#0EA5E9]" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={handleSubscribe}
                                    disabled={loading}
                                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-[#0EA5E9]/20 disabled:opacity-50 group"
                                >
                                    {loading ? 'Processing...' : (
                                        <>Claim Founder Deal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                                <p className="text-center text-xs text-text-muted mt-4 flex items-center justify-center gap-1.5">
                                    <Shield size={12} /> Securely managed via PayPal
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Social Proof / Trust */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                                <Zap size={20} className="text-[#0EA5E9]" />
                            </div>
                            <h4 className="font-bold mb-2">Instant Setup</h4>
                            <p className="text-sm text-text-muted italic">"Upgrade takes less than 60 seconds. Best decision I made for my workflow."</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center mb-4">
                                <Star size={20} className="text-[#F59E0B]" />
                            </div>
                            <h4 className="font-bold mb-2">Lifetime Promise</h4>
                            <p className="text-sm text-text-muted italic">"This price is locked. Even if we raise the standard Pro to $20/mo, you stay at $4.99."</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                                <Shield size={20} className="text-purple-400" />
                            </div>
                            <h4 className="font-bold mb-2">Cancel Anytime</h4>
                            <p className="text-sm text-text-muted italic">"No contracts. No hidden fees. Just pure AI-powered productivity."</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 border-t border-white/5 py-12 px-6 bg-black/20">
                <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-6">
                    <span className="text-text-muted text-sm">© 2026 NoteGraph. All rights reserved.</span>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="text-xs text-text-muted hover:text-white">Privacy Policy</Link>
                        <Link href="/terms" className="text-xs text-text-muted hover:text-white">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
