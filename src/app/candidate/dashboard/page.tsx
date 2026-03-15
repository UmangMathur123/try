"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MINIMUM_MATCH = 75;

export default function CandidateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/applications").then(r => r.json()),
    ]).then(([meData, appData]) => {
      if (!meData.user || meData.user.role !== "CANDIDATE") { router.push("/auth/login"); return; }
      setUser(meData.user);
      setApplications(appData.applications || []);
      setLoading(false);
    }).catch(() => router.push("/auth/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div>;

  const profile = user?.candidateProfile;
  const completedInterviews = applications.filter(a => a.interview?.status === "COMPLETED").length;
  const shortlisted = applications.filter(a => a.status === "SHORTLISTED").length;
  const skills = profile?.skills?.split(",").filter(Boolean) || [];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">⚡ HireIQ</Link>
          <div className="navbar-links">
            <Link href="/candidate/dashboard" className="navbar-link active">Dashboard</Link>
            <Link href="/candidate/profile" className="navbar-link">Profile</Link>
            <Link href="/candidate/jobs" className="navbar-link">Jobs</Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
          </div>
        </div>
      </nav>
      <div className="page">
        <div className="container dashboard">
          <div className="dashboard-header animate-fade-in">
            <h1>Welcome, {user?.name} 👋</h1>
            <p>Track your applications and interview progress</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Applications</div><div className="stat-value">{applications.length}</div></div>
            <div className="stat-card"><div className="stat-label">Interviews Done</div><div className="stat-value">{completedInterviews}</div></div>
            <div className="stat-card"><div className="stat-label">Shortlisted</div><div className="stat-value">{shortlisted}</div></div>
            <div className="stat-card"><div className="stat-label">Skills</div><div className="stat-value">{skills.length}</div></div>
          </div>

          {profile && !profile.skills && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>⚠️ Complete your <Link href="/candidate/profile" style={{ color: "var(--accent-primary)" }}>profile</Link> to improve your match scores!</div>
          )}

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>Your Applications</h2>
          {applications.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><h3>No applications yet</h3><p>Browse and apply to jobs to get started</p><Link href="/candidate/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Jobs</Link></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Job</th><th>Company</th><th>Match</th><th>Status</th><th>Score</th><th>Action</th></tr></thead>
                <tbody>
                  {applications.map((app: any) => {
                    const matchOk = app.resumeMatchScore >= MINIMUM_MATCH;
                    return (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 600 }}>{app.job.title}</td>
                        <td>{app.job.company?.companyName || app.job.company?.user?.name}</td>
                        <td>
                          <span className={`badge ${matchOk ? "badge-success" : app.resumeMatchScore >= 40 ? "badge-warning" : "badge-error"}`}>
                            {Math.round(app.resumeMatchScore)}%
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${app.status === "SHORTLISTED" ? "badge-success" : app.status === "REJECTED" ? "badge-error" : "badge-primary"}`}>
                            {app.status}
                          </span>
                        </td>
                        <td>{app.interview?.overallScore != null ? `${Math.round(app.interview.overallScore)}%` : "—"}</td>
                        <td>
                          {(!app.interview || app.interview.status !== "COMPLETED") && (
                            matchOk ? (
                              <Link href={`/candidate/interview/${app.id}`} className="btn btn-primary btn-sm">
                                {app.interview?.status === "IN_PROGRESS" ? "🎤 Resume Interview" : "🎤 Start Voice Interview"}
                              </Link>
                            ) : (
                              <div className="match-gate-overlay">
                                <p>🔒 {MINIMUM_MATCH}% match required</p>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                  Your match: {Math.round(app.resumeMatchScore)}% — update skills/resume
                                </span>
                              </div>
                            )
                          )}
                          {app.interview?.status === "COMPLETED" && (
                            <Link href={`/candidate/interview/${app.id}`} className="btn btn-secondary btn-sm">View Results</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
