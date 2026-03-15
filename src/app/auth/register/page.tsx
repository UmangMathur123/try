"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "CANDIDATE";

  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", companyName: "", industry: "", skills: "", cgpa: "", experience: "", education: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(role === "CANDIDATE" ? "/candidate/dashboard" : "/company/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">⚡ HireIQ</Link>
          <div className="navbar-links">
            <Link href="/auth/login" className="navbar-link">Login</Link>
          </div>
        </div>
      </nav>
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="card-glass animate-scale-in" style={{ width: "100%", maxWidth: 480, margin: "0 auto", padding: 32 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>Create Account</h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.9rem" }}>Join HireIQ and transform your hiring experience</p>

          <div className="tabs">
            <button className={`tab ${role === "CANDIDATE" ? "active" : ""}`} onClick={() => setRole("CANDIDATE")}>🎯 Candidate</button>
            <button className={`tab ${role === "COMPANY" ? "active" : ""}`} onClick={() => setRole("COMPANY")}>🏢 Company</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder={role === "COMPANY" ? "Company admin name" : "Your full name"} value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={(e) => updateForm("password", e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
            </div>

            {role === "COMPANY" && (
              <>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input className="form-input" type="text" placeholder="Your company name" value={form.companyName} onChange={(e) => updateForm("companyName", e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <input className="form-input" type="text" placeholder="e.g. Technology, Finance" value={form.industry} onChange={(e) => updateForm("industry", e.target.value)} />
                </div>
              </>
            )}

            {role === "CANDIDATE" && (
              <>
                <div className="form-group">
                  <label className="form-label">Skills (comma separated)</label>
                  <input className="form-input" type="text" placeholder="e.g. JavaScript, Python, React, SQL" value={form.skills} onChange={(e) => updateForm("skills", e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">CGPA</label>
                    <input className="form-input" type="number" step="0.1" max="10" placeholder="e.g. 8.5" value={form.cgpa} onChange={(e) => updateForm("cgpa", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience (years)</label>
                    <input className="form-input" type="number" placeholder="e.g. 2" value={form.experience} onChange={(e) => updateForm("experience", e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Education</label>
                  <input className="form-input" type="text" placeholder="e.g. B.Tech CSE" value={form.education} onChange={(e) => updateForm("education", e.target.value)} />
                </div>
              </>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Already have an account? <Link href="/auth/login" style={{ color: "var(--accent-primary)" }}>Login</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
