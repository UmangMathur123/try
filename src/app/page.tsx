"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">⚡ HireIQ</Link>
          <div className="navbar-links">
            {user ? (
              <Link href={user.role === 'CANDIDATE' ? '/candidate/dashboard' : '/company/dashboard'} className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="navbar-link">Login</Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="page">
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <h1>
              Intelligent <span>AI-Powered</span> Interview Platform
            </h1>
            <p>
              Transform your recruitment process with AI-driven interview simulations, 
              smart proctoring, and data-driven candidate evaluation. 
              Fair, consistent, and scalable hiring for modern enterprises.
            </p>
            <div className="hero-buttons">
              <Link href="/auth/register?role=CANDIDATE" className="btn btn-primary btn-lg">
                🎯 I'm a Candidate
              </Link>
              <Link href="/auth/register?role=COMPANY" className="btn btn-secondary btn-lg">
                🏢 I'm a Company
              </Link>
            </div>
          </div>
        </section>

        <section className="container">
          <div className="features-grid">
            <div className="feature-card card-glow">
              <div className="feature-icon">🤖</div>
              <h3>AI-Driven Interviews</h3>
              <p>Dynamic question generation based on job role, candidate skills, and progressive difficulty levels. From introductory to advanced technical challenges.</p>
            </div>
            <div className="feature-card card-glow">
              <div className="feature-icon">📊</div>
              <h3>Smart Scoring</h3>
              <p>Multi-dimensional evaluation covering technical accuracy, communication clarity, response depth, and relevance. Quantifiable metrics for objective assessment.</p>
            </div>
            <div className="feature-card card-glow">
              <div className="feature-icon">🛡️</div>
              <h3>Proctoring System</h3>
              <p>Real-time webcam monitoring with face detection, tab-switch tracking, and integrity scoring. Ensures interview authenticity and fairness.</p>
            </div>
            <div className="feature-card card-glow">
              <div className="feature-icon">📋</div>
              <h3>Resume Matching</h3>
              <p>Automated skill-based resume screening with job requirement matching. Candidates see compatibility scores before applying.</p>
            </div>
            <div className="feature-card card-glow">
              <div className="feature-icon">🔐</div>
              <h3>Identity Verification</h3>
              <p>Aadhaar and PAN card verification for unique candidate identification. Prevents duplicate profiles and ensures authenticity.</p>
            </div>
            <div className="feature-card card-glow">
              <div className="feature-icon">📈</div>
              <h3>Auto Shortlisting</h3>
              <p>Composite scoring algorithm automatically shortlists candidates above 70% threshold. Companies get ranked candidate lists instantly.</p>
            </div>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: '80px', textAlign: 'center' }}>
          <div className="card-glass" style={{ padding: '48px', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>
              How It Works
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              {[
                { step: '1', title: 'Register & Build Profile', desc: 'Candidates create profiles with skills, experience, and upload resumes. Companies post job openings.' },
                { step: '2', title: 'Apply & Match', desc: 'Smart algorithm calculates resume match score against job requirements. Top matches proceed to interview.' },
                { step: '3', title: 'AI Interview Session', desc: 'Interactive chat-based interview with progressive questioning. AI evaluates each response in real-time.' },
                { step: '4', title: 'Scores & Results', desc: 'Composite score generated — candidates above 70% auto-shortlisted. Companies review detailed analytics.' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                  }}>{item.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
