"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BrowseJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== "CANDIDATE") { router.push("/auth/login"); return; }
    });
    fetchJobs();
  }, [router]);

  const fetchJobs = async () => {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoading(false);
  };

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    setMsg("");
    try {
      const res = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Applied successfully! Resume Match: ${Math.round(data.resumeMatchScore)}%`);
      router.push("/candidate/dashboard");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setApplying(null);
    }
  };

  const filteredJobs = search
    ? jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase()) || j.requiredSkills.toLowerCase().includes(search.toLowerCase()))
    : jobs;

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  return (
    <>
      <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo">⚡ HireIQ</Link><div className="navbar-links"><Link href="/candidate/dashboard" className="navbar-link">Dashboard</Link><Link href="/candidate/profile" className="navbar-link">Profile</Link><Link href="/candidate/jobs" className="navbar-link active">Jobs</Link><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></div></div></nav>
      <div className="page"><div className="container dashboard">
        <div className="dashboard-header animate-fade-in"><h1>Browse Jobs</h1><p>Find and apply to positions that match your skills</p></div>

        {msg && <div className="alert alert-success">{msg}</div>}

        <div style={{ marginBottom: 24 }}>
          <input className="form-input" placeholder="🔍 Search by title, skills, or description..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 500 }} />
        </div>

        {loading ? (
          <div className="empty-state"><div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔍</div><h3>No jobs found</h3><p>{search ? "Try a different search term" : "No job openings available yet"}</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
            {filteredJobs.map((job: any, i: number) => (
              <div key={job.id} className="card card-glow animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{job.company?.companyName || job.company?.user?.name}</p>
                  </div>
                  <span className="badge badge-primary">{job._count?.applications || 0} applied</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.description}</p>
                {job.requiredSkills && (
                  <div className="skills-container" style={{ marginBottom: 12 }}>
                    {job.requiredSkills.split(",").filter(Boolean).map((s: string) => <span key={s} className="skill-tag">{s.trim()}</span>)}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{job.experienceMin}-{job.experienceMax} yrs exp</span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleApply(job.id)} disabled={applying === job.id}>
                    {applying === job.id ? "Applying..." : "Apply Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div></div>
    </>
  );
}
