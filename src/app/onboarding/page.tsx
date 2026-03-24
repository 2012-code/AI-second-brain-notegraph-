'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Brain, CreditCard, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const USE_CASES = [
    { id: 'work', label: 'Work notes', emoji: '💼' },
    { id: 'personal', label: 'Personal ideas', emoji: '💡' },
    { id: 'research', label: 'Research', emoji: '🔬' },
    { id: 'learning', label: 'Learning', emoji: '📚' },
    { id: 'creative', label: 'Creative projects', emoji: '🎨' },
    { id: 'all', label: 'All of the above', emoji: '✨' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
    const [firstNote, setFirstNote] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleUseCase = (id: string) => {
        if (id === 'all') {
            setSelectedUseCases(selectedUseCases.includes('all') ? [] : ['all']);
            return;
        }
        setSelectedUseCases(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev.filter(u => u !== 'all'), id]
        );
    };

    const handleStep1 = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ use_cases: selectedUseCases }).eq('id', user.id);
        }
        setLoading(false);
        setStep(2);
    };

    const handleStep2 = async (skip = false) => {
        if (!skip && firstNote.trim()) {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: note } = await supabase.from('notes').insert({
                    user_id: user.id,
                    content: firstNote,
                    title: 'My First Note',
                }).select().single();

                if (note) {
                    // Trigger AI organization in background
                    fetch('/api/ai/organize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ noteId: note.id, content: firstNote }),
                    }).catch(() => { });
                }
            }
            setLoading(false);
        }
        setStep(3);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleFinish = async (_skip = false) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
        }
        toast.success('Welcome to NoteGraph! 🧠');
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'radial-gradient(ellipse at top, #27272A 0%, #050505 60%)' }}>
            {/* Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #0284C7, #06B6D4)' }}>
                    <Brain size={16} className="text-white" />
                </div>
                <span className="font-serif text-lg text-text-primary">NoteGraph</span>
            </div>

            {/* Step indicator */}
            <div className="absolute top-6 flex items-center gap-2">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full transition-all duration-300 ${s === step ? 'bg-sky-500 w-6' : s < step ? 'bg-sky-900' : 'bg-border'
                        }`} />
                ))}
            </div>

            <div className="w-full max-w-lg animate-fade-in">
                {/* Step 1: Use Cases */}
                {step === 1 && (
                    <div className="glass rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="text-4xl mb-4">🧠</div>
                            <h1 className="font-serif text-3xl text-text-primary mb-2">What will you use NoteGraph for?</h1>
                            <p className="text-text-secondary text-sm">Select everything that applies — we&apos;ll personalize your experience</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {USE_CASES.map(uc => (
                                <button key={uc.id} onClick={() => toggleUseCase(uc.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${selectedUseCases.includes(uc.id)
                                            ? 'border-sky-500 bg-sky-500 bg-opacity-10 text-text-primary'
                                            : 'border-border bg-surface-2 text-text-secondary hover:border-border-2'
                                        }`}>
                                    <span className="text-xl">{uc.emoji}</span>
                                    <span className="text-sm font-medium">{uc.label}</span>
                                    {selectedUseCases.includes(uc.id) && (
                                        <Check size={14} className="ml-auto text-sky-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleStep1} disabled={loading || selectedUseCases.length === 0}
                            className="btn-primary w-full h-11 disabled:opacity-50 disabled:cursor-not-allowed relative z-10">
                            {loading ? 'Saving...' : <>Continue <ChevronRight size={16} /></>}
                        </button>
                    </div>
                )}

                {/* Step 2: First Note */}
                {step === 2 && (
                    <div className="glass rounded-2xl p-8">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">✍️</div>
                            <h1 className="font-serif text-3xl text-text-primary mb-2">Create your first note</h1>
                            <p className="text-text-secondary text-sm">Just type anything — an idea, a thought, something to remember</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4 mb-6"
                            style={{ minHeight: '180px' }}>
                            <textarea
                                className="w-full bg-transparent text-text-primary outline-none resize-none h-40"
                                placeholder="Start typing anything — an idea, a thought, something you want to remember..."
                                value={firstNote}
                                onChange={e => setFirstNote(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="btn-ghost">
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button onClick={() => handleStep2(false)} disabled={!firstNote.trim() || loading}
                                className="btn-primary flex-1 h-11 disabled:opacity-50 relative z-10">
                                {loading ? 'Saving...' : <>Save & Continue <ChevronRight size={16} /></>}
                            </button>
                        </div>
                        <button onClick={() => handleStep2(true)} className="w-full text-center text-sm text-text-muted mt-3 hover:text-text-secondary transition-colors">
                            Skip for now
                        </button>
                    </div>
                )}

                {/* Step 3: Start Trial */}
                {step === 3 && (
                    <div className="glass rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <div className="text-4xl mb-4">🚀</div>
                            <h1 className="font-serif text-3xl text-text-primary mb-2">You&apos;re all set!</h1>
                            <p className="text-text-secondary text-sm mb-6">Start your 7-day free trial of NoteGraph Pro</p>

                            <div className="rounded-xl border border-sky-500 p-6 mb-6 text-left">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-text-primary font-medium">NoteGraph Pro</span>
                                    <div>
                                        <span className="text-2xl font-bold text-text-primary">$9.99</span>
                                        <span className="text-text-muted text-sm">/month</span>
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {['Unlimited notes', 'All AI features', 'Daily summaries', 'Smart search', 'Priority support'].map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Check size={14} className="text-sky-400 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t border-border text-center">
                                    <span className="text-xs text-text-muted">7 days free — then $9.99/month. Cancel anytime.</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-surface-2 p-3 mb-4 text-xs text-text-muted flex items-center gap-2 justify-center">
                                <CreditCard size={14} />
                                PayPal integration — add your payment method securely in Settings → Billing after onboarding
                            </div>
                        </div>

                        {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                            <div className="mb-4 relative z-20">
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
                                            toast.success("Payment successful! Welcome to NoteGraph Pro.");
                                            await handleFinish(false);
                                        }}
                                        onError={(err) => {
                                            toast.error("PayPal checkout failed.");
                                            console.error("PayPal Error:", err);
                                        }}
                                    />
                                </PayPalScriptProvider>
                            </div>
                        ) : (
                            <button onClick={() => handleFinish(false)} disabled={loading}
                                className="btn-primary w-full h-11 relative z-10 mb-3">
                                {loading ? 'Setting up...' : '🧠 Go to Dashboard'}
                            </button>
                        )}

                        <button onClick={() => handleFinish(true)}
                            className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors">
                            Start 7-day free trial (Add payment later)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
