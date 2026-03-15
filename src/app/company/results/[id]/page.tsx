"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function InterviewResults() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== "COMPANY") { router.push("/auth/login"); return; }

      const res = await fetch(`/api/interview?id=${interviewId}`);
      const data = await res.json();
      setInterview(data.interview);
      setLoading(false);
    };
    fetchData();
  }, [interviewId, router]);

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  if (loading || !interview) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div>;

  const candidate = interview.application?.candidate;
  const job = interview.application?.job;

  return (
    <>
      <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo">⚡ HireIQ</Link><div className="navbar-links"><Link href="/company/dashboard" className="navbar-link">Dashboard</Link><Link href="/company/jobs" className="navbar-link">Jobs</Link><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></div></div></nav>
      <div className="page"><div className="container dashboard">
        <Link href="/company/dashboard" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>← Back to Dashboard</Link>

        <div className="dashboard-header animate-fade-in" style={{ marginTop: 16 }}>
          <h1>Interview Results</h1>
          <p>{candidate?.user?.name} — {job?.title}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
          <div>
            {/* Score Summary */}
            <div className="card animate-fade-in-up" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Score Summary</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Resume Match", value: interview.application?.resumeMatchScore, max: 100, color: "#7c5cfc" },
                  { label: "Technical", value: (interview.technicalScore || 0) * 10, max: 100, color: "#5b8af5" },
                  { label: "Communication", value: (interview.communicationScore || 0) * 10, max: 100, color: "#3ecfcf" },
                  { label: "Integrity", value: interview.integrityScore, max: 100, color: "#34d399" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color }}>{Math.round(s.value)}%</div>
                    <div className="progress-container" style={{ marginTop: 8 }}>
                      <div className="progress-bar" style={{ width: `${s.value}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", padding: 16, background: "var(--bg-secondary)", borderRadius: 12 }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>OVERALL SCORE</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {Math.round(interview.overallScore || 0)}%
                </div>
                <span className={`badge ${(interview.overallScore || 0) >= 70 ? "badge-success" : "badge-error"}`}>
                  {(interview.overallScore || 0) >= 70 ? "🎉 SHORTLISTED" : "NOT SHORTLISTED"}
                </span>
              </div>
            </div>

            {/* Q&A Details */}
            <div className="card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Questions & Answers</h2>
              {interview.questions?.map((q: any, i: number) => (
                <div key={q.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < interview.questions.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>{q.category}</span>
                    {q.response && <span style={{ fontWeight: 600, fontSize: "0.85rem", color: q.response.totalScore >= 7 ? "var(--success)" : q.response.totalScore >= 5 ? "var(--warning)" : "var(--error)" }}>{q.response.totalScore}/10</span>}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 8 }}>Q{i + 1}: {q.text}</p>
                  {q.response ? (
                    <>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 8 }}>{q.response.answerText}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Relevance: {q.response.relevanceScore}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Clarity: {q.response.clarityScore}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Depth: {q.response.depthScore}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Correctness: {q.response.correctnessScore}</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontStyle: "italic", marginTop: 4 }}>{q.response.aiEvaluation}</p>
                    </>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No response provided</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="card animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>Candidate Info</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.85rem" }}>
                <div><div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>NAME</div><div style={{ fontWeight: 600 }}>{candidate?.user?.name}</div></div>
                <div><div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>EMAIL</div><div>{candidate?.user?.email}</div></div>
                {candidate?.education && <div><div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>EDUCATION</div><div>{candidate.education}</div></div>}
                <div><div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>EXPERIENCE</div><div>{candidate?.experience || 0} years</div></div>
                {candidate?.skills && (
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: 4 }}>SKILLS</div>
                    <div className="skills-container">{candidate.skills.split(",").filter(Boolean).map((s: string) => <span key={s} className="skill-tag">{s.trim()}</span>)}</div>
                  </div>
                )}
                <div><div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>AADHAAR</div><div>{candidate?.aadhaarVerified ? <span className="verified-badge">✅ Verified</span> : <span className="unverified-badge">⏳ Not verified</span>}</div></div>
              </div>
            </div>

            {interview.proctoringFlags?.length > 0 && (
              <div className="card animate-fade-in-up" style={{ animationDelay: "0.2s", marginTop: 16 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12, color: "var(--error)" }}>⚠️ Proctoring Flags</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {interview.proctoringFlags.map((f: any) => (
                    <div key={f.id} className="badge badge-error" style={{ justifyContent: "flex-start" }}>
                      {f.type.replace(/_/g, " ")}: {f.details || "Detected at " + new Date(f.timestamp).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div></div>
    </>
  );
}
