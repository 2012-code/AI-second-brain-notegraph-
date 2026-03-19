'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Brain, Zap, Search, Mail, Tag, Network, ArrowRight, Check, Star, Sparkles, ChevronRight } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI Auto-Organization', desc: 'Every note gets automatically tagged, categorized, and summarized. Your brain stays organized without any effort.', color: '#818CF8', glow: 'rgba(14, 165, 233,0.15)' },
  { icon: Zap, title: 'Chat With Your Notes', desc: 'Ask questions in plain English. Get answers from your own knowledge base, with citations to the exact notes used.', color: '#F9A8D4', glow: 'rgba(244,114,182,0.15)' },
  { icon: Search, title: 'Semantic Search', desc: 'Find notes by what they mean, not just what they say. Search "startup ideas I had in January" and actually get results.', color: '#818CF8', glow: 'rgba(14, 165, 233,0.15)' },
  { icon: Mail, title: 'Daily AI Summary', desc: 'Wake up to a personalized digest of your recent captures, emerging themes, and one thing worth revisiting today.', color: '#FCD34D', glow: 'rgba(245,158,11,0.15)' },
  { icon: Tag, title: 'Automatic Tagging', desc: 'AI extracts key topics and generates tags automatically. Your tag cloud grows organically as you add more notes.', color: '#818CF8', glow: 'rgba(14, 165, 233,0.15)' },
  { icon: Network, title: 'Cross-Note Connections', desc: 'NoteGraph detects when notes relate to each other and surfaces those connections. Discover insights you missed.', color: '#FCD34D', glow: 'rgba(245,158,11,0.15)' },
];



const STEPS = [
  { num: '01', title: 'Dump anything in', desc: 'Text, links, ideas, meeting notes — just type it in. No folders, no templates, no structure required.' },
  { num: '02', title: 'AI organizes it instantly', desc: 'NoteGraph generates titles, tags, categories, summaries, and connections between notes automatically.' },
  { num: '03', title: 'Find and use anything', desc: 'Chat with your entire knowledge base, search by meaning, or receive daily digests that surface what matters.' },
];

const PLAN_FEATURES = [
  'Unlimited notes',
  'All AI features',
  'Daily AI summaries via email',
  'Semantic vector search',
  'Cross-note connections graph',
  'Arabic & multilingual support',
  'Data export',
  'Priority support',
];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animated particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.4 + 0.05,
      color: Math.random() > 0.5 ? '79,70,229' : '245,158,11',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ background: '#04070F', color: '#F0F4FF', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Ambient gradient orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          width: '900px', height: '900px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233,0.12) 0%, transparent 70%)',
          top: '-300px', left: '-200px',
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
          transition: 'transform 1s ease',
        }} />
        <div style={{
          position: 'absolute',
          width: '700px', height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          bottom: '-200px', right: '-200px',
          transform: `translate(${-mousePos.x * 15}px, ${-mousePos.y * 15}px)`,
          transition: 'transform 1s ease',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)',
        }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(4,7,15,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '60px',
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)' }}>
              <Brain size={14} color="white" />
            </div>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '18px', color: '#F0F4FF', letterSpacing: '-0.01em' }}>NoteGraph</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <div className="nav-links" style={{ display: 'flex', gap: '24px' }}>
              {['#features', '#how-it-works', '#pricing'].map((href, i) => (
                <a key={href} href={href} style={{ fontSize: '14px', color: 'rgba(240,244,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,244,255,0.55)')}>
                  {['Features', 'How it works', 'Pricing'][i]}
                </a>
              ))}
            </div>
            <div className="nav-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link href="/login" style={{ fontSize: '14px', color: 'rgba(240,244,255,0.6)', textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F0F4FF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(240,244,255,0.6)'; }}>
                Sign in
              </Link>
              <Link href="/signup" style={{
                fontSize: '14px', fontWeight: '500', color: 'white', textDecoration: 'none',
                padding: '7px 18px', borderRadius: '9px',
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                boxShadow: '0 0 20px rgba(14, 165, 233,0.3)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(14, 165, 233,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(14, 165, 233,0.3)'; }}>
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: '160px', paddingBottom: '120px', textAlign: 'center', position: 'relative', zIndex: 1, padding: '160px 24px 120px' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>

          {/* Badge */}
          <h1 style={{
            fontSize: 'clamp(48px, 7vw, 88px)',
            fontFamily: "'Cal Sans', sans-serif",
            fontWeight: 'normal',
            lineHeight: '1.05',
            letterSpacing: '-0.03em',
            marginBottom: '28px',
            color: '#F0F4FF',
          }}>
            Your second brain,<br />
            <span style={{
              background: 'linear-gradient(135deg, #A5B4FC 0%, #C084FC 50%, #F9A8D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>built by AI.</span>
          </h1>

          <p style={{
            fontSize: '18px', lineHeight: '1.7',
            color: 'rgba(240,244,255,0.60)', maxWidth: '520px', margin: '0 auto 44px',
            fontWeight: '300',
          }}>
            Dump your thoughts, ideas, and notes. NoteGraph organizes everything, connects the dots, and surfaces what you need — before you even ask.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              color: 'white', textDecoration: 'none',
              fontWeight: '500', fontSize: '15px',
              padding: '13px 28px', borderRadius: '12px',
              boxShadow: '0 0 40px rgba(14, 165, 233,0.35), 0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(14, 165, 233,0.5), 0 8px 30px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(14, 165, 233,0.35), 0 4px 20px rgba(0,0,0,0.3)'; }}>
              Start free trial <ArrowRight size={15} />
            </Link>
            <Link href="/demo" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(240,244,255,0.8)', textDecoration: 'none',
              fontWeight: '400', fontSize: '15px',
              padding: '13px 28px', borderRadius: '12px',
              transition: 'all 0.25s', backdropFilter: 'blur(10px)',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#F0F4FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(240,244,255,0.8)'; }}>
              See demo <ChevronRight size={15} />
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(240,244,255,0.35)' }}>
            {['7 days free', 'No credit card required', 'Cancel anytime'].map((t, i) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {i > 0 && <span style={{ opacity: 0.3 }}>·</span>}
                <Check size={12} style={{ color: '#818CF8' }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero visual: floating preview card */}
        <div style={{ maxWidth: '860px', margin: '80px auto 0', position: 'relative' }}>
          <div style={{
            background: 'rgba(12,18,32,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 0 0 1px rgba(14, 165, 233,0.1), 0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(14, 165, 233,0.06)',
          }}>
            {/* Fake browser chrome */}
            <div style={{ display: 'flex', gap: '7px', marginBottom: '20px', alignItems: 'center' }}>
              {['#EF4444', '#F59E0B', '#10B981'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.8 }} />)}
              <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', marginLeft: '8px', display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(240,244,255,0.25)' }}>notegraph.online/dashboard</span>
              </div>
            </div>
            {/* Fake dashboard content */}
            <div className="hero-dashboard-mock" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px', height: '260px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(240,244,255,0.3)', marginBottom: '12px', letterSpacing: '0.06em' }}>NOTES</div>
                {['Project Ideas', 'Meeting Notes', 'Research Links', 'Daily Journal', 'Book Summaries'].map((n, i) => (
                  <div key={n} style={{ fontSize: '11px', padding: '7px 8px', borderRadius: '6px', color: i === 0 ? '#A5B4FC' : 'rgba(240,244,255,0.45)', background: i === 0 ? 'rgba(14, 165, 233,0.12)' : 'transparent', marginBottom: '2px' }}>{n}</div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#F0F4FF', marginBottom: '8px', fontFamily: '"Cal Sans", sans-serif' }}>Project Ideas</div>
                  <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.45)', lineHeight: '1.7' }}>Build an AI-powered second brain that automatically organizes your thoughts...</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    {['#ai', '#product', '#ideas'].map(tag => (
                      <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(14, 165, 233,0.12)', color: '#818CF8', border: '1px solid rgba(14, 165, 233,0.2)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233,0.08), rgba(14, 165, 233,0.06))', border: '1px solid rgba(14, 165, 233,0.15)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Sparkles size={14} style={{ color: '#818CF8', flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '12px', color: 'rgba(240,244,255,0.6)', lineHeight: '1.6' }}>
                    <span style={{ color: '#A5B4FC', fontWeight: '500' }}>AI Summary:</span> Your recent notes show a pattern around AI tooling, productivity, and research into knowledge management...
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow underneath the preview */}
          <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '80px', background: 'rgba(14, 165, 233,0.15)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '120px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#818CF8', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Simple by design</p>
            <h2 style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: 'clamp(32px, 4vw, 52px)', color: '#F0F4FF', fontWeight: 'normal', letterSpacing: '-0.02em' }}>Three steps to clarity</h2>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', position: 'relative' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{
                background: 'rgba(12,18,32,0.7)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px', padding: '36px 32px',
                position: 'relative', overflow: 'hidden',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: i === 1 ? 'linear-gradient(90deg, #0EA5E9, #0284C7)' : 'linear-gradient(90deg, rgba(14, 165, 233, 0.3), transparent)',
                }} />
                <div style={{ fontSize: 'clamp(48px, 5vw, 72px)', fontFamily: '"Cal Sans", sans-serif', fontWeight: 'normal', color: 'rgba(14, 165, 233,0.15)', lineHeight: 1, marginBottom: '20px', letterSpacing: '-0.03em' }}>{step.num}</div>
                <h3 style={{ fontSize: '20px', fontFamily: '"Cal Sans", sans-serif', color: '#F0F4FF', marginBottom: '12px', fontWeight: 'normal' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(240,244,255,0.5)', lineHeight: '1.7', fontWeight: '300' }}>{step.desc}</p>
                {i < 2 && (
                  <div style={{ position: 'absolute', top: '50%', right: '-20px', transform: 'translateY(-50%)', zIndex: 2, display: 'none' }}>
                    <ArrowRight size={18} style={{ color: 'rgba(14, 165, 233,0.4)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '120px 24px', position: 'relative', zIndex: 1, background: 'rgba(8,12,24,0.5)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#FCD34D', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Built different</p>
            <h2 style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: 'clamp(32px, 4vw, 52px)', color: '#F0F4FF', fontWeight: 'normal', letterSpacing: '-0.02em' }}>Everything your brain needs</h2>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: 'rgba(11,17,29,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '18px', padding: '28px',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                transition: 'all 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}30`; e.currentTarget.style.background = `rgba(11,17,29,0.95)`; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${f.glow}`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(11,17,29,0.8)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${f.glow}`, border: `1px solid ${f.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  <f.icon size={19} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#F0F4FF', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.5)', lineHeight: '1.7', fontWeight: '300' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '120px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#818CF8', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>Simple pricing</p>
          <h2 style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: 'clamp(32px, 4vw, 52px)', color: '#F0F4FF', fontWeight: 'normal', letterSpacing: '-0.02em', marginBottom: '56px' }}>One plan. Everything included.</h2>

          <div className="pricing-card" style={{
            background: 'rgba(12,18,32,0.9)',
            border: '1px solid rgba(14, 165, 233,0.25)',
            borderRadius: '24px', padding: '48px 40px',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 0 1px rgba(14, 165, 233,0.1), 0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(14, 165, 233,0.08)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top gradient line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #0EA5E9, #0284C7, transparent)' }} />

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', color: '#FCD34D', marginBottom: '28px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <Star size={10} fill="currentColor" /> Most popular
            </div>

            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: '64px', fontWeight: 'normal', color: '#F0F4FF', letterSpacing: '-0.04em' }}>$9.99</span>
              <span style={{ fontSize: '16px', color: 'rgba(240,244,255,0.4)', marginLeft: '4px' }}>/month</span>
              <p style={{ fontSize: '13px', color: 'rgba(240,244,255,0.4)', marginTop: '6px' }}>7 days free. No credit card required.</p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '28px 0', marginBottom: '28px' }}>
              <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                {PLAN_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px', color: 'rgba(240,244,255,0.7)' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(14, 165, 233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={10} style={{ color: '#818CF8' }} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/signup" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              color: 'white', textDecoration: 'none',
              fontWeight: '500', fontSize: '15px',
              padding: '15px 28px', borderRadius: '12px',
              boxShadow: '0 0 30px rgba(14, 165, 233,0.35)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(14, 165, 233,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(14, 165, 233,0.35)'; }}>
              Start Free Trial <ArrowRight size={15} />
            </Link>
            <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.3)', marginTop: '14px' }}>Cancel anytime. No questions asked.</p>
          </div>
        </div>
      </section>


      {/* ── FINAL CTA ── */}
      <section style={{ padding: '140px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: 'clamp(36px, 5vw, 64px)', color: '#F0F4FF', fontWeight: 'normal', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' }}>
            Ready to think<br />
            <span style={{ background: 'linear-gradient(135deg, #A5B4FC, #C084FC, #F9A8D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>better?</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(240,244,255,0.5)', marginBottom: '40px', lineHeight: '1.7', fontWeight: '300' }}>
            Join thousands of people who use NoteGraph to organize their thinking and never lose an idea again.
          </p>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            color: 'white', textDecoration: 'none',
            fontWeight: '500', fontSize: '16px',
            padding: '15px 36px', borderRadius: '14px',
            boxShadow: '0 0 40px rgba(14, 165, 233,0.35), 0 8px 30px rgba(0,0,0,0.3)',
            transition: 'all 0.25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(14, 165, 233,0.55), 0 12px 40px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(14, 165, 233,0.35), 0 8px 30px rgba(0,0,0,0.3)'; }}>
            Start Free Trial <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 24px', position: 'relative', zIndex: 1 }}>
        <div className="footer-layout" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={13} color="white" />
            </div>
            <span style={{ fontFamily: '"Cal Sans", sans-serif', fontSize: '16px', color: '#F0F4FF' }}>NoteGraph</span>
            <span style={{ fontSize: '12px', color: 'rgba(240,244,255,0.25)', marginLeft: '4px' }}>— AI Second Brain</span>
          </div>

          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', 'mailto:hello@notegraph.online'], ['Demo', '/demo']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: '13px', color: 'rgba(240,244,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,244,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,244,255,0.35)'}>{label}</a>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(240,244,255,0.2)' }}>© {new Date().getFullYear()} NoteGraph. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
