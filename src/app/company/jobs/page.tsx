"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CompanyJobs() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", requiredSkills: "", experienceMin: "0", experienceMax: "10" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== "COMPANY") { router.push("/auth/login"); return; }
      setUser(meData.user);

      const jobsRes = await fetch(`/api/jobs?companyId=${meData.user.companyProfile?.id}`);
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs || []);
    };
    fetchData();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          experienceMin: parseInt(form.experienceMin),
          experienceMax: parseInt(form.experienceMax),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs([data.job, ...jobs]);
      setShowForm(false);
      setForm({ title: "", description: "", requiredSkills: "", experienceMin: "0", experienceMax: "10" });
      setMsg("Job posted successfully!");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  return (
    <>
      <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo">⚡ HireIQ</Link><div className="navbar-links"><Link href="/company/dashboard" className="navbar-link">Dashboard</Link><Link href="/company/jobs" className="navbar-link active">Jobs</Link><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></div></div></nav>
      <div className="page"><div className="container dashboard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div className="dashboard-header" style={{ marginBottom: 0 }}><h1>Job Management</h1><p>Create and manage job postings</p></div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "➕ Post New Job"}</button>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}

        {showForm && (
          <div className="card animate-scale-in" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>Create New Job Posting</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label className="form-label">Job Title</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Software Engineer - Backend Systems" required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role, responsibilities, and requirements..." required rows={4} /></div>
              <div className="form-group"><label className="form-label">Required Skills (comma separated)</label><input className="form-input" value={form.requiredSkills} onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))} placeholder="e.g. JavaScript, Python, React, System Design, SQL" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group"><label className="form-label">Min Experience (years)</label><input className="form-input" type="number" min="0" value={form.experienceMin} onChange={e => setForm(f => ({ ...f, experienceMin: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Max Experience (years)</label><input className="form-input" type="number" min="0" value={form.experienceMax} onChange={e => setForm(f => ({ ...f, experienceMax: e.target.value }))} /></div>
              </div>
              <button className="btn btn-primary" disabled={saving}>{saving ? "Posting..." : "Post Job"}</button>
            </form>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💼</div><h3>No jobs posted yet</h3><p>Create your first job posting to start receiving applications</p></div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {jobs.map((job: any, i: number) => (
              <div key={job.id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>{job.title}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 8 }}>{job.description.substring(0, 150)}{job.description.length > 150 ? "..." : ""}</p>
                    {job.requiredSkills && (
                      <div className="skills-container">
                        {job.requiredSkills.split(",").filter(Boolean).map((s: string) => <span key={s} className="skill-tag">{s.trim()}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span className={`badge ${job.status === "ACTIVE" ? "badge-success" : "badge-secondary"}`}>{job.status}</span>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>{job._count?.applications || 0} applications</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div></div>
    </>
  );
}
