"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CandidateProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ skills: "", cgpa: "", experience: "", education: "", aadhaarNumber: "", panNumber: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== "CANDIDATE") { router.push("/auth/login"); return; }
      setUser(d.user);
      const p = d.user.candidateProfile || {};
      setForm({ skills: p.skills || "", cgpa: p.cgpa?.toString() || "", experience: p.experience?.toString() || "0", education: p.education || "", aadhaarNumber: p.aadhaarNumber || "", panNumber: p.panNumber || "" });
    });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Profile updated successfully!");
      const me = await fetch("/api/auth/me").then(r => r.json());
      setUser(me.user);
    } catch (err: any) {
      setMsg(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setUploading(true);
    setUploadMsg("");
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadMsg(`✅ Resume "${resumeFile.name}" uploaded successfully!`);
      setResumeFile(null);
      // Refresh user data
      const me = await fetch("/api/auth/me").then(r => r.json());
      setUser(me.user);
    } catch (err: any) {
      setUploadMsg(`❌ ${err.message || "Upload failed"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setUploadMsg("");
    }
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); };

  if (!user) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div>;

  const p = user.candidateProfile || {};

  return (
    <>
      <nav className="navbar"><div className="navbar-inner"><Link href="/" className="navbar-logo">⚡ HireIQ</Link><div className="navbar-links"><Link href="/candidate/dashboard" className="navbar-link">Dashboard</Link><Link href="/candidate/profile" className="navbar-link active">Profile</Link><Link href="/candidate/jobs" className="navbar-link">Jobs</Link><button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button></div></div></nav>
      <div className="page"><div className="container dashboard">
        <div className="dashboard-header animate-fade-in"><h1>My Profile</h1><p>Manage your skills, experience, resume, and identity verification</p></div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
          <div>
            {/* Resume Upload Section */}
            <div className="card animate-fade-in-up" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>📄 Resume Upload</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 16 }}>
                Upload your resume (PDF, DOC, DOCX, or TXT). Your resume is matched against job descriptions — <strong style={{ color: "var(--accent-primary)" }}>75% match is required</strong> to start an interview.
              </p>

              {uploadMsg && <div className={`alert ${uploadMsg.includes("✅") ? "alert-success" : "alert-error"}`}>{uploadMsg}</div>}

              {p.resumePath ? (
                <div className="resume-file-info">
                  <span style={{ fontSize: "1.5rem" }}>📎</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Resume Uploaded</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.resumePath.split('/').pop()}</div>
                  </div>
                  <span className="badge badge-success">✅ Active</span>
                </div>
              ) : null}

              <div className={`resume-dropzone ${resumeFile ? "has-file" : ""}`} onClick={() => fileInputRef.current?.click()} style={{ marginTop: p.resumePath ? 12 : 0 }}>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt" />
                {resumeFile ? (
                  <div>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 600 }}>{resumeFile.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{(resumeFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📤</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.resumePath ? "Upload New Resume" : "Click to Upload Resume"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>PDF, DOC, DOCX, TXT (max 5MB)</div>
                  </div>
                )}
              </div>

              {resumeFile && (
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleResumeUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "📤 Upload Resume"}
                </button>
              )}
            </div>

            {/* Profile Information */}
            <div className="card animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>Profile Information</h2>
              {msg && <div className={`alert ${msg.includes("success") ? "alert-success" : "alert-error"}`}>{msg}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group"><label className="form-label">Skills (comma separated)</label><input className="form-input" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="JavaScript, Python, React, SQL" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group"><label className="form-label">CGPA</label><input className="form-input" type="number" step="0.1" max="10" value={form.cgpa} onChange={e => setForm(f => ({ ...f, cgpa: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-input" type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} /></div>
                </div>
                <div className="form-group"><label className="form-label">Education</label><input className="form-input" value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} placeholder="B.Tech CSE, IIT Delhi" /></div>
                <div className="divider" />
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>🔐 Identity Verification</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Aadhaar Number {p.aadhaarVerified ? <span className="verified-badge">✅ Verified</span> : <span className="unverified-badge">⏳ Unverified</span>}</label>
                    <input className="form-input" value={form.aadhaarNumber} onChange={e => setForm(f => ({ ...f, aadhaarNumber: e.target.value }))} placeholder="1234 5678 9012" maxLength={14} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number {p.panVerified ? <span className="verified-badge">✅ Verified</span> : <span className="unverified-badge">⏳ Unverified</span>}</label>
                    <input className="form-input" value={form.panNumber} onChange={e => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                </div>
                <button className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>{saving ? "Saving..." : "Save Profile"}</button>
              </form>
            </div>
          </div>

          <div className="card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>Quick Stats</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>NAME</div><div style={{ fontWeight: 600 }}>{user.name}</div></div>
              <div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>EMAIL</div><div style={{ fontSize: "0.85rem" }}>{user.email}</div></div>
              {p.cgpa && <div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>CGPA</div><div style={{ fontWeight: 600 }}>{p.cgpa}</div></div>}
              <div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>EXPERIENCE</div><div style={{ fontWeight: 600 }}>{p.experience || 0} years</div></div>
              {p.resumePath && <div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>RESUME</div><div><span className="badge badge-success">📄 Uploaded</span></div></div>}
              {p.skills && <div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>SKILLS</div><div className="skills-container">{p.skills.split(",").filter(Boolean).map((s: string) => <span key={s} className="skill-tag">{s.trim()}</span>)}</div></div>}
            </div>
          </div>
        </div>
      </div></div>
    </>
  );
}
