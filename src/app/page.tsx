'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Check, 
  Menu, 
  X,
  MessageSquare,
  Search,
  FileText,
  Sparkles,
  Network,
  Mail
} from 'lucide-react';

const FEATURE_CARDS = [
  { icon: Sparkles, title: 'AI Auto-Organization', body: 'Every note gets automatically titled, tagged, categorized and summarized the moment you click Organize.' },
  { icon: Network, title: 'Knowledge Galaxy', body: 'Your notes visualized as an interactive galaxy. Every connection between your ideas shown as glowing lines in space.' },
  { icon: MessageSquare, title: 'Chat with your notes', body: 'Ask anything about your knowledge base. "What did I write about marketing last month?" and get an instant answer.' },
  { icon: Search, title: 'Semantic search', body: 'Search by meaning, not just keywords. Find notes even when you don\'t remember the exact words you used.' },
  { icon: FileText, title: 'Rich text editor', body: 'Bold, italic, headings, lists — a full editor with preview mode. Write in Arabic or English, it adapts automatically.' },
  { icon: Mail, title: 'AI Insights Digest', body: 'Generate a stunning personal digest with one click. NoteGraph surfaces emerging themes and takeaways from your recent activity.', color: '#06B6D4' },
];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.2 + 0.05,
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
        ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const HeroMockup = () => (
    <div className="app-mockup hero-mockup" style={{ padding: '0', border: 'none', background: 'transparent' }}>
      <img 
        src="/screenshots/editor.png" 
        alt="NoteGraph Editor Screenshot" 
        style={{ width: '100%', height: 'auto', borderRadius: '12px', display: 'block', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} 
      />
    </div>
  );

  const GalaxyMockup = () => (
    <div className="galaxy-mockup" style={{ padding: '0', border: 'none', background: 'transparent' }}>
      <img 
        src="/screenshots/galaxy.png" 
        alt="NoteGraph Knowledge Galaxy Screenshot" 
        style={{ width: '100%', height: 'auto', borderRadius: '12px', display: 'block' }} 
      />
    </div>
  );

  return (
    <div style={{ background: '#0A0F1E', color: '#F4F4FF', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.6 }} />

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201, 168, 76, 0.05) 0%, transparent 70%)', top: '-100px', left: '-100px' }} />
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201, 168, 76, 0.03) 0%, transparent 70%)', bottom: '10%', right: '-100px' }} />
      </div>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: '80px', display: 'flex', alignItems: 'center',
        background: scrolled ? 'rgba(10, 15, 30, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201, 168, 76, 0.1)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '135%', height: '135%', objectFit: 'contain', transform: 'translate(-5px, -5px)' }} />
            </div>
            <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '22px', color: '#F4F4FF', letterSpacing: '-0.02em' }}>NoteGraph</span>
          </Link>

          <div style={{ display: 'none', alignItems: 'center', gap: '40px' }} className="lg-flex">
            <a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="nav-link" style={{ fontSize: '15px', color: 'rgba(244, 244, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
            <a href="#how-it-works" onClick={(e) => smoothScroll(e, 'how-it-works')} className="nav-link" style={{ fontSize: '15px', color: 'rgba(244, 244, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>How it works</a>
            <a href="#pricing" onClick={(e) => smoothScroll(e, 'pricing')} className="nav-link" style={{ fontSize: '15px', color: 'rgba(244, 244, 255, 0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>Pricing</a>
          </div>

          <div style={{ display: 'none', alignItems: 'center', gap: '12px' }} className="lg-flex">
             <Link href="/login" style={{ fontSize: '15px', color: 'rgba(244, 244, 255, 0.8)', textDecoration: 'none', padding: '10px 20px' }}>Log in</Link>
             <Link href="/signup" className="btn-primary" style={{
               background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
               color: '#0A0F1E', padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
               textDecoration: 'none', transition: 'all 0.2s'
             }}
             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(201,168,76,0.35)'; }}
             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
               Start for free
             </Link>
          </div>

          <button style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 1100 }} className="lg-hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: '#0A0F1E', zIndex: 1050,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '40px'
          }}>
            <a href="#features" onClick={(e) => smoothScroll(e, 'features')} style={{ fontSize: '24px', color: 'white', textDecoration: 'none', fontFamily: "'Cal Sans', sans-serif" }}>Features</a>
            <a href="#how-it-works" onClick={(e) => smoothScroll(e, 'how-it-works')} style={{ fontSize: '24px', color: 'white', textDecoration: 'none', fontFamily: "'Cal Sans', sans-serif" }}>How it works</a>
            <a href="#pricing" onClick={(e) => smoothScroll(e, 'pricing')} style={{ fontSize: '24px', color: 'white', textDecoration: 'none', fontFamily: "'Cal Sans', sans-serif" }}>Pricing</a>
            <Link href="/signup" style={{
              width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
              color: '#0A0F1E', padding: '16px', borderRadius: '12px', fontSize: '18px', fontWeight: '700', textDecoration: 'none'
            }}>
              Start for free
            </Link>
          </div>
        )}
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{ padding: '180px 24px 100px', textAlign: 'center' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="hero-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '100px',
              background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)',
              color: '#C9A84C', fontSize: '13px', fontWeight: '500', marginBottom: '24px'
            }}>
              <span style={{ fontSize: '16px' }}>✦</span> AI-Powered Second Brain
            </div>

            <h1 style={{
              fontFamily: "'Cal Sans', sans-serif",
              fontSize: 'clamp(44px, 8vw, 92px)',
              lineHeight: '1',
              color: '#F4F4FF',
              letterSpacing: '-0.04em',
              marginBottom: '28px'
            }}>
              Your thoughts deserve<br />
              <span className="gradient-text">better than a folder.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(17px, 2vw, 20px)',
              lineHeight: '1.6',
              color: 'rgba(244, 244, 255, 0.6)',
              maxWidth: '600px',
              margin: '0 auto 48px',
              fontWeight: 300
            }}>
              Notegraph turns your raw ideas, notes, and brain dumps into an organized, searchable, connected knowledge base — automatically. No folders. No tags. No manual work. Ever.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '32px' }}>
              <Link href="/signup" className="btn-primary" style={{
                background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
                color: '#0A0F1E', padding: '18px 36px', borderRadius: '14px', fontSize: '17px', fontWeight: '700',
                textDecoration: 'none', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(201,168,76,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                Start for free — no credit card <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" onClick={(e) => smoothScroll(e, 'how-it-works')} className="btn-secondary" style={{
                background: 'transparent', border: '1px solid rgba(201,168,76,0.4)',
                color: '#C9A84C', padding: '18px 36px', borderRadius: '14px', fontSize: '17px', fontWeight: '500',
                textDecoration: 'none', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}>
                See how it works ↓
              </a>
            </div>

            <div style={{ fontSize: '14px', color: 'rgba(244, 244, 255, 0.35)', letterSpacing: '0.02em' }}>
              7-day free trial  ·  Cancel anytime  ·  Takes 30 seconds to set up
            </div>
          </div>
        </section>

        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div className="section-label" style={{ fontSize: '13px', fontWeight: '600', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '2px solid #C9A84C', paddingLeft: '10px', display: 'inline-block' }}>THE PROBLEM</div>
              <h2 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: 'clamp(32px, 5vw, 48px)', color: '#F4F4FF', lineHeight: '1.2' }}>You have great ideas.<br />They just keep getting lost.</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {[
                { icon: '📋', title: 'Notes scattered everywhere', body: 'Apple Notes, Notion, random docs, voice memos. Your ideas live in 5 different places and you can never find anything.' },
                { icon: '🗂️', title: 'Manual organization is exhausting', body: 'Creating folders, adding tags, linking notes. You spend more time organizing than actually thinking.' },
                { icon: '🔍', title: 'Your knowledge goes to waste', body: 'You wrote something useful 3 months ago. You\'ll never find it again. All that thinking — wasted.' }
              ].map((card, i) => (
                <div key={i} className="feature-card" style={{
                  background: '#0F1629',
                  border: '1px solid rgba(201,168,76,0.12)',
                  borderRadius: '24px', padding: '40px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '24px' }}>{card.icon}</div>
                  <h3 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '20px', color: '#F4F4FF', marginBottom: '16px' }}>{card.title}</h3>
                  <p style={{ color: 'rgba(244, 244, 255, 0.5)', lineHeight: '1.6', fontWeight: 300 }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" style={{ padding: '100px 24px', background: 'rgba(201, 168, 76, 0.02)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
             <div style={{ textAlign: 'center', marginBottom: '100px' }}>
              <div className="section-label" style={{ fontSize: '13px', fontWeight: '600', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '2px solid #C9A84C', paddingLeft: '10px', display: 'inline-block' }}>HOW IT WORKS</div>
              <h2 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: 'clamp(32px, 5vw, 48px)', color: '#F4F4FF' }}>Just write. AI does the rest.</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '120px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                  <div style={{ order: 1 }}>
                     <div className="step-number">01</div>
                     <h3 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '32px', color: '#F4F4FF', marginBottom: '20px' }}>Dump your thoughts</h3>
                     <p style={{ color: 'rgba(244, 244, 255, 0.6)', lineHeight: '1.8', fontSize: '17px', fontWeight: 300 }}>Write anything — a raw idea, meeting notes, something you read, a 2am thought. No structure needed. No format required. Just type.</p>
                  </div>
                  <div style={{ order: 2, borderRadius: '24px', overflow: 'hidden', height: '300px' }}>
                    <img 
                      src="/screenshots/step1.png" 
                      alt="Dump your thoughts" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px', border: '1px solid rgba(201,168,76,0.12)' }} 
                    />
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                  <div style={{ order: 2 }}>
                     <div className="step-number">02</div>
                     <h3 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '32px', color: '#F4F4FF', marginBottom: '20px' }}>AI organizes everything</h3>
                     <p style={{ color: 'rgba(244, 244, 255, 0.6)', lineHeight: '1.8', fontSize: '17px', fontWeight: 300 }}>Click Organize and watch the magic. Notegraph auto-generates a title, assigns tags, picks a category, writes a summary, and restructures your content into clean readable notes.</p>
                  </div>
                  <div style={{ order: 1 }}>
                    <div style={{ background: '#0F1629', borderRadius: '24px', border: '1px solid rgba(201,168,76,0.12)', padding: '24px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', padding: '12px 24px', borderRadius: '12px', color: '#0A0F1E', fontWeight: '700', boxShadow: '0 0 30px rgba(201,168,76, 0.4)' }}>
                           Organize ✦
                        </div>
                    </div>
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                  <div style={{ order: 1 }}>
                     <div className="step-number">03</div>
                     <h3 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '32px', color: '#F4F4FF', marginBottom: '20px' }}>Explore your knowledge galaxy</h3>
                     <p style={{ color: 'rgba(244, 244, 255, 0.6)', lineHeight: '1.8', fontSize: '17px', fontWeight: 300 }}>Every note becomes a glowing node in your personal Knowledge Galaxy. See how your ideas connect. Discover patterns you never knew existed. Chat with your entire knowledge base like it's a person.</p>
                  </div>
                  <div style={{ order: 2, borderRadius: '24px', overflow: 'hidden', height: '300px' }}>
                    <img 
                      src="/screenshots/step3.png" 
                      alt="Explore your knowledge galaxy" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px', border: '1px solid rgba(201,168,76,0.12)' }} 
                    />
                  </div>
               </div>
            </div>
          </div>
        </section>

        <section id="features" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div className="section-label" style={{ fontSize: '13px', fontWeight: '600', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '2px solid #C9A84C', paddingLeft: '10px', display: 'inline-block' }}>FEATURES</div>
              <h2 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: 'clamp(32px, 5vw, 48px)', color: '#F4F4FF' }}>Everything your brain needs.<br />Nothing it doesn't.</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
               {FEATURE_CARDS.map((f, i) => (
                 <div key={i} className="feature-card" style={{
                    background: '#0F1629',
                    border: '1px solid rgba(201,168,76,0.12)',
                    borderRadius: '24px', padding: '32px',
                    transition: 'all 0.3s ease'
                 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                       <f.icon style={{ color: '#C9A84C' }} size={20} />
                    </div>
                    <h3 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '19px', color: '#F4F4FF', marginBottom: '12px' }}>{f.title}</h3>
                    <p style={{ color: 'rgba(244, 244, 255, 0.5)', lineHeight: '1.6', fontSize: '14px', fontWeight: 300 }}>{f.body}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        <section id="pricing" style={{ padding: '100px 24px', background: 'rgba(10, 15, 30, 0.5)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div className="section-label" style={{ fontSize: '13px', fontWeight: '600', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', borderLeft: '2px solid #C9A84C', paddingLeft: '10px', display: 'inline-block' }}>PRICING</div>
              <h2 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: 'clamp(32px, 5vw, 48px)', color: '#F4F4FF', marginBottom: '16px' }}>One plan. Everything included.</h2>
              <p style={{ color: 'rgba(244, 244, 255, 0.5)', maxWidth: '500px', margin: '0 auto', fontSize: '17px', fontWeight: 300 }}>No feature gates. No hidden limits. Everything Notegraph can do — yours from day one.</p>
            </div>

            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="pricing-card" style={{
                background: '#0F1629',
                border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: '32px', padding: '60px 40px',
                textAlign: 'center', position: 'relative',
                boxShadow: '0 0 40px rgba(201,168,76,0.08)'
              }}>
                 <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '100px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C', fontSize: '13px', fontWeight: '600', marginBottom: '32px' }}>✦ Notegraph Pro</div>
                 
                 <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                       <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '64px', color: '#F4F4FF' }}>$9.99</span>
                       <span style={{ fontSize: '20px', color: 'rgba(244, 244, 255, 0.4)', marginLeft: '8px' }}>/ month</span>
                    </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px', textAlign: 'left' }}>
                    {[
                      'Unlimited notes',
                      'AI auto-organization',
                      'Knowledge Galaxy',
                      'Chat with your notes',
                      'Semantic search',
                      'Rich text editor with Arabic support',
                      'On-demand AI insights digest',
                      '7-day free trial'
                    ].map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <Check size={16} className="pricing-feature-check" style={{ color: '#C9A84C' }} />
                         <span style={{ fontSize: '15px', color: 'rgba(244, 244, 255, 0.8)', fontWeight: 300 }}>{feature}</span>
                      </div>
                    ))}
                 </div>

                 <Link href="/signup" className="btn-primary" style={{
                   display: 'block', background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
                   color: '#0A0F1E', padding: '20px', borderRadius: '16px', fontSize: '18px', fontWeight: '700',
                   textDecoration: 'none', transition: 'all 0.2s', marginBottom: '20px'
                 }}>
                   Start your free trial
                 </Link>
                 
                 <div style={{ fontSize: '14px', color: 'rgba(244, 244, 255, 0.4)' }}>No credit card required to start.<br />Cancel anytime, no questions asked.</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '40px', color: 'rgba(244, 244, 255, 0.4)', fontStyle: 'italic', fontSize: '16px' }}>
                "Less than a coffee a month for a second brain that never forgets."
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '140px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: 'clamp(36px, 8vw, 64px)', color: '#F4F4FF', lineHeight: '1', marginBottom: '24px' }}>
            Your best ideas are still<br />waiting to be connected.
          </h2>
          <p style={{ color: 'rgba(244, 244, 255, 0.6)', fontSize: '20px', marginBottom: '40px', fontWeight: 300 }}>
            Start your free trial today. No credit card. No setup. Just open it and start writing.
          </p>
          
          <Link href="/signup" className="btn-primary" style={{
            display: 'inline-flex', background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
            color: '#0A0F1E', padding: '20px 48px', borderRadius: '16px', fontSize: '18px', fontWeight: '700',
            textDecoration: 'none', transition: 'all 0.2s'
          }}>
            Start for free — it takes 30 seconds
          </Link>
          
          <div style={{ marginTop: '24px', color: 'rgba(244, 244, 255, 0.4)', fontSize: '14px' }}>
            Join the people who stopped losing their best ideas.
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(201, 168, 76, 0.1)', padding: '80px 24px 40px', background: '#0A0F1E' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                  <div style={{ width: '30px', height: '30px' }}>
                     <img src="/logo.png" alt="Logo" style={{ width: '135%', height: '135%', objectFit: 'contain', transform: 'translate(-3px, -3px)' }} />
                  </div>
                  <span style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: '20px', color: '#F4F4FF' }}>NoteGraph</span>
                </Link>
                <p style={{ color: 'rgba(244, 244, 255, 0.4)', fontSize: '14px', lineHeight: '1.6' }}>Your AI second brain.</p>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ fontSize: '14px', fontWeight: '600', color: '#F4F4FF' }}>Product</div>
                   <a href="#features" onClick={e => smoothScroll(e, 'features')} style={{ fontSize: '14px', color: 'rgba(244, 244, 255, 0.5)', textDecoration: 'none' }}>Features</a>
                   <a href="#pricing" onClick={e => smoothScroll(e, 'pricing')} style={{ fontSize: '14px', color: 'rgba(244, 244, 255, 0.5)', textDecoration: 'none' }}>Pricing</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ fontSize: '14px', fontWeight: '600', color: '#F4F4FF' }}>Legal</div>
                   <Link href="/privacy" style={{ fontSize: '14px', color: 'rgba(244, 244, 255, 0.5)', textDecoration: 'none' }}>Privacy Policy</Link>
                   <Link href="/terms" style={{ fontSize: '14px', color: 'rgba(244, 244, 255, 0.5)', textDecoration: 'none' }}>Terms of Service</Link>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '14px', color: '#C9A84C', fontWeight: '600' }}>notegraph.online</div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
             <p style={{ fontSize: '13px', color: 'rgba(244, 244, 255, 0.2)' }}>© {new Date().getFullYear()} NoteGraph. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @font-face {
          font-family: 'Cal Sans';
          src: url('https://fonts.cdnfonts.com/s/77353/CalSans-SemiBold.woff') format('woff');
        }

        .gradient-text {
          background: linear-gradient(135deg, #E8C97A, #C9A84C);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .feature-card:hover {
          background: #162040 !important;
          border-color: rgba(201,168,76,0.3) !important;
          transform: translateY(-4px);
        }

        .btn-primary:active {
          background: #9A7A2E !important;
        }

        .nav-link:hover {
          color: #C9A84C !important;
        }

        .app-mockup {
          background: #0F1629;
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          max-width: 1000px;
          margin: 0 auto;
        }
        .mockup-bar {
          background: #162040;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(201,168,76,0.08);
        }
        .mockup-dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #FF5F57; }
        .dot-yellow { background: #FEBC2E; }
        .dot-green { background: #28C840; }
        .mockup-url {
          font-size: 11px;
          color: rgba(244,244,255,0.25);
          font-family: monospace;
        }
        .mockup-body { display: flex; }
        .mockup-sidebar {
          width: 140px;
          padding: 12px;
          border-right: 1px solid rgba(201,168,76,0.08);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mockup-nav-item {
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          color: rgba(244, 244, 255, 0.4);
        }
        .mockup-nav-item.active {
          background: rgba(201,168,76,0.1);
          color: #C9A84C;
        }
        .mockup-editor { flex: 1; padding: 20px; text-align: left; }
        .mockup-title {
          font-size: 16px;
          font-weight: 600;
          color: #F4F4FF;
          margin-bottom: 12px;
        }
        .mockup-line {
          height: 8px;
          background: rgba(244,244,255,0.08);
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .mockup-line.w-90 { width: 90%; }
        .mockup-line.w-75 { width: 75%; }
        .mockup-line.w-85 { width: 85%; }
        .mockup-line.w-60 { width: 60%; }
        .mockup-tags { display: flex; gap: 6px; margin-top: 16px; }
        .mockup-tag {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 20px;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.2);
          color: #C9A84C;
        }
        .galaxy-mockup {
          background: #07070F;
          border: 1px solid rgba(201,168,76,0.12);
          border-radius: 12px;
          overflow: hidden;
          padding: 16px;
        }

        .step-number {
          color: rgba(201,168,76,0.25);
          font-size: 64px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 10px;
        }
        
        .lg-flex { display: flex; }
        .lg-hidden { display: none; }
        @media (max-width: 1024px) {
          .lg-flex { display: none; }
          .lg-hidden { display: block; }
          .mockup-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
