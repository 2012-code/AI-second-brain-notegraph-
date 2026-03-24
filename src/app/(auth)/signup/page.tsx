'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            const msg = error.message?.toLowerCase() ?? '';
            if (msg.includes('email rate limit') || msg.includes('email limit') || msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
                toast.error('Too many sign-up attempts. Please wait a few minutes and try again.');
            } else {
                toast.error(error.message);
            }
            setLoading(false);
        } else {
            toast.success('Account created! Redirecting...');
            router.push('/onboarding');
            router.refresh();
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-logo">
                <div className="auth-logo-icon">
                    <Sparkles size={16} className="text-white" />
                </div>
                <span className="auth-logo-text">NoteGraph</span>
            </div>

            <div className="text-center mb-6">
                <div className="auth-badge" style={{ background: 'var(--cyan-subtle)', borderColor: 'var(--border-strong)', color: 'var(--cyan)' }}>
                    <Sparkles size={12} />
                    7 days free, cancel anytime
                </div>
                <h1 className="auth-heading">Start your second brain</h1>
                <p className="auth-subheading">Create your account and elevate your thinking.</p>
            </div>

            <GoogleAuthButton label="Sign up with Google" className="mb-6" />

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/60" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0b101e] px-2 text-slate-500 uppercase opacity-75">Or sign up with email</span>
                </div>
            </div>

            <form onSubmit={handleSignup}>
                <div className="auth-input-group">
                    <label className="auth-input-label">FULL NAME</label>
                    <div className="auth-input-wrapper">
                        <User className="auth-input-icon" />
                        <input
                            type="text"
                            placeholder="Satoshi Nakamoto"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-input-label">EMAIL ADDRESS</label>
                    <div className="auth-input-wrapper">
                        <Mail className="auth-input-icon" />
                        <input
                            type="email"
                            placeholder="you@domain.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="auth-input"
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="auth-input-label">PASSWORD</label>
                    <div className="auth-input-wrapper">
                        <Lock className="auth-input-icon" />
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="auth-input pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors z-10"
                        >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} className={`auth-button ${loading ? 'loading' : ''}`}>
                    {loading ? 'Creating account...' : 'Start Free Trial'}
                </button>
            </form>

            <p className="auth-legal">
                By signing up, you agree to our{' '}
                <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>.
            </p>

            <div className="auth-divider">
                <div className="auth-divider-line" />
            </div>

            <p className="auth-footer-text">
                Already have an account?{' '}
                <Link href="/login" className="auth-footer-link">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
