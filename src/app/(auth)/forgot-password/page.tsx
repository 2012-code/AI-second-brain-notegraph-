'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        });
        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            setSent(true);
        }
    };

    if (sent) {
        return (
            <div className="glass rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <CheckCircle size={32} className="text-sky-400" />
                </div>
                <h1 className="font-serif text-2xl text-text-primary mb-2">Check your email</h1>
                <p className="text-text-secondary text-sm mb-6">
                    We sent a password reset link to <span className="text-text-primary">{email}</span>
                </p>
                <Link href="/login" className="btn-ghost">
                    <ArrowLeft size={16} /> Back to login
                </Link>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-8 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-text-primary mb-2">Reset password</h1>
                <p className="text-text-secondary text-sm">We&apos;ll send you a link to reset your password</p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="email" placeholder="Email address" value={email}
                        onChange={e => setEmail(e.target.value)} required className="input pl-9" />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full h-10 relative z-10">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
                Remember your password?{' '}
                <Link href="/login" className="text-sky-400 hover:text-sky-500 transition-colors font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
