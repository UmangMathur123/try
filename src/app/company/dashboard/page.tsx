"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meData.user || meData.user.role !== "COMPANY") { router.push("/auth/login"); return; }
        setUser(meData.user);

        const [jobsRes, appsRes] = await Promise.all([
          fetch(`/api/jobs?companyId=${meData.user.companyProfile?.id}`),
          fetch("/api/applications"),
        ]);
        const jobsData = await jobsRes.json();
        const appsData = await appsRes.json();
        setJobs(jobsData.jobs || []);
        setApplications(appsData.applications || []);
        setLoading(false);
      } catch { router.push("/auth/login"); }
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  if (loading) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div>;

  const totalApps = applications.length;
  const shortlisted = applications.filter(a => a.status === "SHORTLISTED").length;
  const completed = applications.filter(a => a.interview?.status === "COMPLETED").length;
  const avgScore = completed > 0
    ? Math.round(applications.filter(a => a.interview?.overallScore != null).reduce((s, a) => s + a.interview.overallScore, 0) / completed)
    : 0;

  return (
    <>
      <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo">⚡ HireIQ</Link><div className="navbar-links"><Link href="/company/dashboard" className="navbar-link active">Dashboard</Link><Link href="/company/jobs" className="navbar-link">Jobs</Link><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></div></div></nav>
      <div className="page"><div className="container dashboard">
        <div className="dashboard-header animate-fade-in">
          <h1>Company Dashboard</h1>
          <p>Welcome back, {user?.companyProfile?.companyName || user?.name}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Active Jobs</div><div className="stat-value">{jobs.length}</div></div>
          <div className="stat-card"><div className="stat-label">Applications</div><div className="stat-value">{totalApps}</div></div>
          <div className="stat-card"><div className="stat-label">Shortlisted</div><div className="stat-value">{shortlisted}</div></div>
          <div className="stat-card"><div className="stat-label">Avg Score</div><div className="stat-value">{avgScore}%</div></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Recent Applications</h2>
          <Link href="/company/jobs" className="btn btn-primary btn-sm">Manage Jobs</Link>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>No applications yet</h3><p>Post jobs to start receiving applications</p><Link href="/company/jobs" className="btn btn-primary" style={{ marginTop: 16 }}>Post a Job</Link></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Candidate</th><th>Job</th><th>Resume Match</th><th>Interview Score</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {applications.map((app: any) => (
                  <tr key={app.id}>
                    <td><div style={{ fontWeight: 600 }}>{app.candidate?.user?.name}</div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{app.candidate?.user?.email}</div></td>
                    <td>{app.job?.title}</td>
                    <td><span className={`badge ${app.resumeMatchScore >= 70 ? "badge-success" : app.resumeMatchScore >= 40 ? "badge-warning" : "badge-error"}`}>{Math.round(app.resumeMatchScore)}%</span></td>
                    <td>{app.interview?.overallScore != null ? (<span style={{ fontWeight: 600 }}>{Math.round(app.interview.overallScore)}%</span>) : "—"}</td>
                    <td><span className={`badge ${app.status === "SHORTLISTED" ? "badge-success" : app.status === "REJECTED" ? "badge-error" : "badge-primary"}`}>{app.status}</span></td>
                    <td>
                      {app.interview?.status === "COMPLETED" && (
                        <Link href={`/company/results/${app.interview.id}`} className="btn btn-secondary btn-sm">View Details</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div></div>
    </>
  );
}
