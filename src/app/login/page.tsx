"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Server,
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Terminal,
  Cpu,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"password" | "discord" | "demo">("password");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Authentication failed. Check your master credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error connecting to login service.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevLogin = async (role: "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT" | "VIEWER") => {
    setLoadingRole(role);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username: `Staff_${role}` }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Failed to authenticate");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setLoadingRole(null);
    }
  };

  const handleDiscordOAuth = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative overflow-hidden selection:bg-accent selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-accent/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-accent">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span>Target Server: Cavrix Core (1519559734808674444)</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted">
          <Cpu className="w-3.5 h-3.5 text-accent" />
          <span>Self-Hosting Gateway: Active</span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="w-full max-w-md mx-auto px-4 py-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-accent/40 shadow-glow mb-4">
            <Server className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cavrix Bot Control Panel</h1>
          <p className="text-xs text-muted mt-1">Direct Master Access & Hosting Administration</p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-card-secondary rounded-xl border border-border text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`py-2 px-2 rounded-lg transition text-center ${
                activeTab === "password"
                  ? "bg-accent text-black font-bold shadow-subtle"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Owner Pass
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discord")}
              className={`py-2 px-2 rounded-lg transition text-center ${
                activeTab === "discord"
                  ? "bg-accent text-black font-bold shadow-subtle"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Discord SSO
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("demo")}
              className={`py-2 px-2 rounded-lg transition text-center ${
                activeTab === "demo"
                  ? "bg-accent text-black font-bold shadow-subtle"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Role Sandbox
            </button>
          </div>

          {/* Tab 1: Master Password Login (Default) */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-accent" />
                  <span>Master Username</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card-secondary border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none text-xs text-foreground placeholder:text-muted/60 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-accent" />
                    <span>Server Owner Passcode</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter ADMIN_PASSWORD"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-card-secondary border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none text-xs text-foreground placeholder:text-muted/60 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-[11px] text-muted space-y-1">
                <div className="text-accent font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Self-Hosting Default Credentials</span>
                </div>
                <div>User: <code className="text-foreground bg-black/40 px-1 rounded">admin</code> | Pass: <code className="text-foreground bg-black/40 px-1 rounded">cavrix@2026</code></div>
                <div className="text-[10px] text-muted/70">Change anytime in your server's <code className="text-foreground">.env</code> file.</div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-light text-black font-bold text-xs transition shadow-glow disabled:opacity-50"
              >
                {submitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Server Console</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Official Discord Staff SSO */}
          {activeTab === "discord" && (
            <div className="space-y-4">
              <div className="text-xs text-muted leading-relaxed">
                Authenticate using your authorized Discord staff account. Permissions and roles are automatically synced with the Cavrix Cloud Discord server.
              </div>

              <button
                onClick={handleDiscordOAuth}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs transition shadow-subtle group"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Authorize with Discord</span>
                <ArrowRight className="w-4 h-4 ml-auto opacity-70 group-hover:translate-x-0.5 transition" />
              </button>

              <div className="p-3.5 rounded-xl bg-card-secondary/70 border border-border space-y-1.5 text-[11px] text-muted">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>Security & Verification Scopes</span>
                </div>
                <div>• Identity and Guild Role validation (read-only)</div>
                <div>• Auto-assigned console clearance based on Discord roles</div>
                <div>• Cryptographically signed JWT session token</div>
              </div>
            </div>
          )}

          {/* Tab 3: Demo & Role Sandbox */}
          {activeTab === "demo" && (
            <div className="space-y-3">
              <div className="text-xs text-muted mb-2">
                Evaluate different staff permission levels in the interactive sandbox:
              </div>

              <button
                type="button"
                onClick={() => handleDevLogin("ADMIN")}
                disabled={loadingRole !== null}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card-secondary border border-border hover:border-accent/40 text-xs text-foreground transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-accent" />
                  <div>
                    <div className="font-semibold text-foreground">Administrator Console</div>
                    <div className="text-[10px] text-muted">Full access to Server Config, AI KB & Staff</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-accent-light px-2 py-0.5 rounded bg-accent/15 border border-accent/30 shrink-0">
                  {loadingRole === "ADMIN" ? "Launching..." : "FULL ACCESS"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDevLogin("SUPPORT_LEAD")}
                disabled={loadingRole !== null}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card-secondary border border-border hover:border-accent/40 text-xs text-foreground transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <div>
                    <div className="font-semibold text-foreground">Support Lead</div>
                    <div className="text-[10px] text-muted">Ticket escalations, workload reassignments</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/30 shrink-0">
                  {loadingRole === "SUPPORT_LEAD" ? "Launching..." : "ESCALATIONS"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDevLogin("SUPPORT_AGENT")}
                disabled={loadingRole !== null}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-card-secondary border border-border hover:border-accent/40 text-xs text-foreground transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-accent" />
                  <div>
                    <div className="font-semibold text-foreground">Support Agent</div>
                    <div className="text-[10px] text-muted">Claim tickets, reply to clients & diagnostics</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/30 shrink-0">
                  {loadingRole === "SUPPORT_AGENT" ? "Launching..." : "TICKETS"}
                </span>
              </button>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted font-mono">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-accent" />
              <span>TLS 1.3 & JWT Encrypted</span>
            </span>
            <span>Cavrix Console v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Sub-footer */}
      <div className="py-6 text-center text-xs text-muted relative z-10 font-mono">
        © {new Date().getFullYear()} Cavrix Cloud Infrastructure Inc. • Single-Server Dedicated Edition
      </div>
    </div>
  );
}
