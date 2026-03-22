'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Subscription } from '@/types';
import { toast } from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
    Download, AlertTriangle, Save
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const TABS = ['Profile', 'AI Settings', 'Billing', 'Data', 'Danger Zone'];
const PERSONALITIES = ['friendly', 'professional', 'casual', 'concise'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SUMMARY_STYLES = ['brief', 'detailed'];

function PaymentStatusHandler({ setTab }: { setTab: (tab: string) => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        if (paymentStatus === 'success') {
            toast.success('Subscription created successfully! Payment is processing...');
            router.replace('/settings', { scroll: false });
            setTab('Billing');
        } else if (paymentStatus === 'cancelled') {
            toast.error('Subscription checkout was cancelled.');
            router.replace('/settings', { scroll: false });
            setTab('Billing');
        }
    }, [searchParams, router, setTab]);

    return null;
}

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [tab, setTab] = useState('Profile');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setEmail(user.email || '');

            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (prof) { setProfile(prof as Profile); setFullName(prof.full_name || ''); }

            const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
            if (sub) setSubscription(sub as Subscription);
        };
        load();
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from('profiles').update({
            ...profile,
            full_name: fullName,
        }).eq('id', user.id);
        setSaving(false);
        if (error) toast.error(error.message);
        else toast.success('Settings saved!');
    };

    const handleExport = (format: string) => {
        window.open(`/api/export?format=${format}`, '_blank');
    };

    const handleDeleteAllNotes = async () => {
        if (!confirm('Delete ALL your notes permanently? This cannot be undone.')) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('notes').delete().eq('user_id', user.id);
        toast.success('All notes deleted');
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Delete your account permanently? This cannot be undone.')) return;
        toast.error('Please contact support to delete your account.');
    };

    return (
        <div className="min-h-screen bg-transparent relative z-10 animate-in fade-in duration-500">
            <Suspense fallback={null}>
                <PaymentStatusHandler setTab={setTab} />
            </Suspense>

            {/* Header */}
            <div className="border-b border-white/5 bg-[#050B18]/80 backdrop-blur-md px-8 py-5 flex items-center gap-4 sticky top-0 z-20">
                <Link href="/dashboard" className="text-text-muted hover:text-white transition-colors text-sm flex items-center gap-1.5 font-medium">
                    ← Back to Dashboard
                </Link>
                <div className="h-4 w-px bg-white/10" />
                <h1 className="font-serif text-[24px] tracking-tight text-white mb-0" style={{ fontFamily: '"Cal Sans", sans-serif' }}>Settings</h1>
            </div>

            <div className="settings-mobile-layout max-w-[1000px] mx-auto p-8 flex gap-10 mt-4">
                {/* Tabs sidebar */}
                <div className="settings-tabs-col w-56 flex-shrink-0">
                    <nav className="space-y-1">
                        {TABS.map(t => {
                            const isActive = tab === t;
                            const isDanger = t === 'Danger Zone';
                            return (
                                <button key={t} onClick={() => setTab(t)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 flex items-center justify-between group ${isActive
                                        ? isDanger
                                            ? 'bg-black/40 border border-[#0EA5E9]/50 shadow-[0_0_30px_rgba(14,165,233,0.15)] text-white scale-[1.02]'
                                            : 'bg-[#0EA5E9]/10 text-white border border-[#0EA5E9]/20 shadow-[0_0_20px_rgba(14,165,233,0.1)]'
                                        : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
                                        }`}>
                                    {t}
                                    {isActive && !isDanger && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Common Card Wrapper Style */}
                    {tab === 'Profile' && (
                        <div className="rounded-[24px] p-8 space-y-6" style={{ background: 'rgba(12,18,32,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="mb-8">
                                <h2 className="text-[22px] text-white mb-1" style={{ fontFamily: '"Cal Sans", sans-serif' }}>Profile Details</h2>
                                <p className="text-sm text-text-muted">Manage your personal information.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-text-secondary mb-2 block">Full Name</label>
                                    <input value={fullName} onChange={e => setFullName(e.target.value)} 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-all" 
                                        placeholder="Your name" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text-secondary mb-2 block">Email Address</label>
                                    <input value={email} readOnly 
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-text-muted cursor-not-allowed" />
                                    <p className="text-xs text-text-muted mt-2">Email changes require support verification for security.</p>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-white/5 mt-8">
                                <button onClick={saveProfile} disabled={saving} 
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-50">
                                    {saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* AI Settings */}
                    {tab === 'AI Settings' && profile && (
                        <div className="rounded-[24px] p-8 space-y-6" style={{ background: 'rgba(12,18,32,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="mb-8">
                                <h2 className="text-[22px] text-white mb-1" style={{ fontFamily: '"Cal Sans", sans-serif' }}>AI Personality</h2>
                                <p className="text-sm text-text-muted">How should NoteGraph communicate with you?</p>
                            </div>

                            <div>
                                <div className="grid grid-cols-2 gap-3">
                                    {PERSONALITIES.map(p => (
                                        <button key={p} onClick={() => setProfile({ ...profile, chat_personality: p })}
                                            className={`px-4 py-4 rounded-xl text-sm font-medium capitalize border transition-all text-left ${profile.chat_personality === p
                                                ? 'border-[#0EA5E9]/40 bg-[#0EA5E9]/10 text-[#F0F4FF] shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                                                : 'border-white/5 bg-black/20 text-text-muted hover:bg-black/40 hover:text-text-secondary'
                                                }`}>
                                            <div className="flex items-center justify-between">
                                                {p}
                                                {profile.chat_personality === p && <div className="w-2 h-2 rounded-full bg-[#0EA5E9]" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-white/5 mt-8">
                                <button onClick={saveProfile} disabled={saving} 
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-50">
                                    {saving ? 'Saving...' : <><Save size={15} /> Save AI Settings</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Billing */}
                    {tab === 'Billing' && (
                        <div className="rounded-[24px] p-8 space-y-6" style={{ background: 'rgba(12,18,32,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="mb-8">
                                <h2 className="text-[22px] text-white mb-1" style={{ fontFamily: '"Cal Sans", sans-serif' }}>Subscription</h2>
                                <p className="text-sm text-text-muted">Manage your NoteGraph Pro active plan.</p>
                            </div>

                            <div className="rounded-[16px] border border-white/5 bg-black/40 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 blur-[40px] rounded-full pointer-events-none" />
                                
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#D97706] p-[1px]">
                                            <div className="w-full h-full rounded-full bg-[#050B18] flex items-center justify-center text-[#F59E0B] font-serif font-bold italic">
                                                C
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-base font-semibold text-white block">NoteGraph Pro</span>
                                            <span className="text-xs text-text-muted">$8.00 / month</span>
                                        </div>
                                    </div>
                                    <span className={`text-[11px] px-3 py-1 rounded-full font-bold tracking-wide uppercase ${subscription?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                        subscription?.status === 'trialing' ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20' :
                                            'bg-red-500/20 text-red-400 border border-red-500/20'
                                        }`}>
                                        {subscription?.status || 'Unknown'}
                                    </span>
                                </div>
                                <div className="space-y-1 relative z-10">
                                    {subscription?.trial_ends_at && subscription.status === 'trialing' && (
                                        <p className="text-xs text-text-secondary">
                                            Trial ends <span className="text-white font-medium">{new Date(subscription.trial_ends_at).toLocaleDateString()}</span>
                                        </p>
                                    )}
                                    {subscription?.current_period_end && (
                                        <p className="text-xs text-text-secondary">
                                            Next billing date: <span className="text-white font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[16px] border border-white/5 bg-transparent p-6 flex items-center justify-between">
                                <div>
                                    {subscription?.status !== 'active' ? (
                                        <>
                                            <p className="text-sm font-medium text-white mb-1">Upgrade to Premium</p>
                                            <p className="text-xs text-text-muted">Get full AI power and unlimited connections.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-white mb-1">Payment Method</p>
                                            <p className="text-xs text-text-muted">Manage your billing via PayPal Portal</p>
                                        </>
                                    )}
                                </div>
                                
                                {subscription?.status !== 'active' ? (
                                    <div className="min-w-[200px] relative z-20">
                                        {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                                            <PayPalScriptProvider options={{ 
                                                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, 
                                                vault: true, 
                                                intent: "subscription" 
                                            }}>
                                                <PayPalButtons 
                                                    style={{ height: 40, shape: "rect", color: "blue", layout: "horizontal", label: "subscribe" }}
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
                                                        toast.success("Subscription created successfully! Payment is processing...");
                                                        setTimeout(() => window.location.reload(), 2000);
                                                    }}
                                                    onError={(err) => {
                                                        toast.error("PayPal checkout failed.");
                                                        console.error("PayPal Error:", err);
                                                    }}
                                                />
                                            </PayPalScriptProvider>
                                        ) : (
                                            <button disabled className="px-6 py-2.5 rounded-xl bg-gray-600 text-white text-sm font-medium">
                                                Missing Config
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <a href="https://www.paypal.com/myaccount/autopay" target="_blank" rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-medium hover:bg-black/60 transition-colors">
                                        Open Portal ↗
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Data */}
                    {tab === 'Data' && (
                        <div className="rounded-[24px] p-8 space-y-6" style={{ background: 'rgba(12,18,32,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="mb-6">
                                <h2 className="text-[22px] text-white mb-1" style={{ fontFamily: '"Cal Sans", sans-serif' }}>Data Export</h2>
                                <p className="text-sm text-text-muted">Your brain is yours. Download your notes anytime.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => handleExport('json')} 
                                    className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10 transition-all group text-left">
                                    <Download size={18} className="text-[#0EA5E9] mb-3 group-hover:scale-110 transition-transform" /> 
                                    <div className="text-sm font-medium text-white mb-1">JSON Format</div>
                                    <div className="text-xs text-text-muted">Best for moving to another tool or database</div>
                                </button>
                                <button onClick={() => handleExport('markdown')} 
                                    className="p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10 transition-all group text-left">
                                    <Download size={18} className="text-[#F59E0B] mb-3 group-hover:scale-110 transition-transform" /> 
                                    <div className="text-sm font-medium text-white mb-1">Markdown Format</div>
                                    <div className="text-xs text-text-muted">Best for reading locally (Obsidian, Notion)</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    {tab === 'Danger Zone' && (
                        <div className="rounded-[24px] p-8 border border-red-500/10 bg-red-500/[0.02]">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-[22px] text-red-400 mb-0" style={{ fontFamily: '"Cal Sans", sans-serif' }}>Danger Zone</h2>
                                    <p className="text-xs text-red-500/70">Proceed with extreme caution.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 rounded-[16px] border border-red-500/10 bg-black/40">
                                    <div>
                                        <p className="text-sm font-semibold text-white mb-1">Delete All Notes</p>
                                        <p className="text-xs text-text-muted">Permanently wipe your NoteGraph database. Cannot be undone.</p>
                                    </div>
                                    <button onClick={handleDeleteAllNotes}
                                        className="px-4 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                        Wipe Workspace
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-5 rounded-[16px] border border-red-500/10 bg-black/40">
                                    <div>
                                        <p className="text-sm font-semibold text-white mb-1">Delete Account</p>
                                        <p className="text-xs text-text-muted">Permanently delete your account, subscription, and data.</p>
                                    </div>
                                    <button onClick={handleDeleteAccount}
                                        className="px-4 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

