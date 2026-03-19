import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Mail, Settings, Check, AlertCircle, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import toast from 'react-hot-toast';

export default function DailySummary() {
    const supabase = createClient();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generated, setGenerated] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    
    // Settings view state
    const [showSettings, setShowSettings] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) setProfile(data as Profile);
        };
        loadProfile();
    }, []);

    const saveSettings = async () => {
        if (!profile) return;
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaving(false); return; }
        
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const { error } = await supabase.from('profiles').update({
            summary_enabled: profile.summary_enabled,
            summary_time: profile.summary_time,
            timezone: timezone
        }).eq('id', user.id);
        
        setSaving(false);
        if (error) toast.error('Failed to save settings');
        else {
            toast.success('Email preferences saved!');
            setShowSettings(false);
        }
    };

    const generateSummary = async () => {
        setLoading(true);
        setError(null);
        setEmailSent(false);
        try {
            const res = await fetch('/api/ai/daily-summary', { method: 'GET' });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setSummary(data.summary || null);
            setGenerated(true);
        } catch {
            setError('Failed to generate summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const sendToEmail = async () => {
        if (!summary) return;
        setSendingEmail(true);
        try {
            const res = await fetch('/api/ai/daily-summary/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary }),
            });
            const data = await res.json();
            if (data.success) {
                setEmailSent(true);
                setTimeout(() => setEmailSent(false), 5000);
            } else {
                setError(data.error || 'Failed to send email.');
            }
        } catch {
            setError('Connection error. Could not send email.');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(252,211,77,0.1))',
                            border: '1px solid rgba(245,158,11,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sparkles size={15} style={{ color: '#FCD34D' }} />
                        </div>
                        <h2 style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>Daily AI Summary</h2>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        A personalized digest of your recent notes, themes, and insights.
                    </p>
                </div>
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', color: showSettings ? 'white' : 'var(--text-muted)',
                        background: showSettings ? 'rgba(255,255,255,0.05)' : 'transparent',
                        padding: '6px 10px', borderRadius: '8px', 
                        border: '1px solid', borderColor: showSettings ? 'var(--border-default)' : 'var(--border-subtle)',
                        transition: 'all 0.2s', cursor: 'pointer'
                    }}>
                    {showSettings ? <X size={12} /> : <Settings size={12} />} 
                    {showSettings ? 'Close Settings' : 'Email settings'}
                </button>
            </div>

            {/* Settings Drawer */}
            {showSettings && profile && (
                <div style={{
                    background: 'rgba(12,18,32,0.8)', border: '1px solid var(--border-default)',
                    borderRadius: '16px', padding: '24px', animation: 'fadeIn 0.2s ease-out'
                }}>
                    <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '16px', fontWeight: '500' }}>Automation Preferences</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: 'white', margin: '0 0 4px 0' }}>Daily Summary Email</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Automatically receive your AI digest every day.</p>
                            </div>
                            <button onClick={() => setProfile({ ...profile, summary_enabled: !profile.summary_enabled })}
                                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${profile.summary_enabled ? 'bg-[#0EA5E9]' : 'bg-black/40 border border-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full absolute top-[3px] transition-all duration-300 shadow-sm ${profile.summary_enabled ? 'left-[24px] bg-white' : 'left-[3px] bg-text-muted'}`} />
                            </button>
                        </div>

                        <div style={{ opacity: profile.summary_enabled ? 1 : 0.4, pointerEvents: profile.summary_enabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>Delivery Time (Your Local Time)</p>
                            <input type="time" value={profile.summary_time}
                                onChange={e => setProfile({ ...profile, summary_time: e.target.value })}
                                style={{
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', padding: '8px 12px', color: 'white',
                                    fontSize: '14px', outline: 'none', width: '140px'
                                }} />
                        </div>

                        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={saveSettings} disabled={saving} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', color: 'white',
                                border: 'none', padding: '8px 16px', borderRadius: '8px',
                                fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.7 : 1, boxShadow: '0 0 15px rgba(14, 165, 233, 0.3)'
                            }}>
                                {saving ? 'Saving...' : <><Save size={14} /> Save Settings</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main card */}
            <div style={{
                background: 'rgba(12,18,32,0.6)',
                border: '1px solid var(--border-default)',
                borderRadius: '18px',
                overflow: 'hidden',
                flex: generated ? 1 : 'none',
                position: 'relative'
            }}>
                {!generated ? (
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        {/* Decorative orb */}
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px',
                            background: 'linear-gradient(135deg, rgba(14, 165, 233,0.15), rgba(245,158,11,0.1))',
                            border: '1px solid rgba(245,158,11,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 40px rgba(245,158,11,0.12)',
                        }}>
                            <Sparkles size={28} style={{ color: '#FCD34D' }} />
                        </div>
                        <h3 style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                            Generate today&apos;s summary
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '360px', margin: '0 auto 28px' }}>
                            NoteGraph will analyze your recent notes and surface your most important captures, emerging themes, and a thought for today.
                        </p>
                        <button onClick={generateSummary} disabled={loading} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '11px 24px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                            color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px', fontWeight: '500',
                            boxShadow: '0 0 24px rgba(14, 165, 233,0.3)',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                        }}>
                            {loading ? (
                                <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing your notes...</>
                            ) : (
                                <><Sparkles size={14} /> Generate Summary</>
                            )}
                        </button>
                        {error && (
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#F87171' }}>
                                <AlertCircle size={14} />
                                <p style={{ fontSize: '13px', margin: 0 }}>{error}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Summary content */}
                        <div style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#F59E0B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                        Draft Digest
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={sendToEmail} disabled={sendingEmail || emailSent} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        fontSize: '12px', fontWeight: '500', 
                                        color: emailSent ? '#34D399' : '#F0F4FF',
                                        background: emailSent ? 'rgba(52,211,153,0.1)' : 'rgba(14, 165, 233,0.2)',
                                        border: `1px solid ${emailSent ? 'rgba(52,211,153,0.3)' : 'rgba(14, 165, 233,0.4)'}`,
                                        cursor: sendingEmail || emailSent ? 'not-allowed' : 'pointer',
                                        padding: '7px 14px', borderRadius: '10px',
                                        transition: 'all 0.2s',
                                    }}>
                                        {sendingEmail ? (
                                            <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                                        ) : emailSent ? (
                                            <><Check size={12} /> Sent to Email</>
                                        ) : (
                                            <><Mail size={12} /> Send to Email</>
                                        )}
                                    </button>
                                    <button onClick={generateSummary} disabled={loading} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        fontSize: '12px', color: 'var(--text-muted)',
                                        background: 'transparent', border: '1px solid var(--border-subtle)',
                                        cursor: 'pointer', padding: '5px 10px', borderRadius: '8px',
                                        transition: 'all 0.2s',
                                    }}>
                                        <RefreshCw size={11} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                            {error && !sendingEmail && (
                                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#F87171' }}>
                                    <AlertCircle size={14} />
                                    <p style={{ fontSize: '13px', margin: 0 }}>{error}</p>
                                </div>
                            )}
                            <div className="prose-ai" style={{ color: 'var(--text-secondary)', lineHeight: '1.9', fontSize: '15px', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                                {summary}
                            </div>
                        </div>

                        {/* Email CTA / Status */}
                        <div style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(14, 165, 233,0.06)', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                                    Daily auto-summaries are {loading ? 'checked...' : (profile?.summary_enabled ? 'enabled' : 'disabled')}
                                </p>
                            </div>
                            <button onClick={() => setShowSettings(true)} style={{
                                fontSize: '13px', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer',
                                color: '#818CF8', transition: 'color 0.2s',
                            }}>
                                Edit Settings
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .prose-ai {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
}
