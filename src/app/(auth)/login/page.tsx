'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            toast.success('Welcome back!');
            router.push('/dashboard');
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
                <div className="auth-badge">
                    <Sparkles size={12} />
                    Your AI Second Brain
                </div>
                <h1 className="auth-heading">Welcome back</h1>
                <p className="auth-subheading">Sign in to continue to your mind.</p>
            </div>

            <form onSubmit={handleLogin}>
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
                    <div className="flex justify-between items-center mb-2">
                        <label className="auth-input-label !mb-0">PASSWORD</label>
                        <Link href="/forgot-password" className="text-[11px] text-sky-400 hover:text-white transition-colors">
                            Forgot?
                        </Link>
                    </div>
                    <div className="auth-input-wrapper">
                        <Lock className="auth-input-icon" />
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
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
                    {loading ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>

            <div className="auth-divider">
                <div className="auth-divider-line" />
            </div>

            <p className="auth-footer-text">
                New to NoteGraph?{' '}
                <Link href="/signup" className="auth-footer-link">
                    Create an account
                </Link>
            </p>
        </div>
    );
}
