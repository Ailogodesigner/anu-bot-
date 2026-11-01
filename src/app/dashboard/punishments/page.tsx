"use client";

import React, { useEffect, useState } from "react";
import {
  Gavel,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ShieldAlert,
  UserX,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface PunishmentItem {
  id: string;
  type: "WARN" | "TIMEOUT" | "KICK" | "BAN" | "UNBAN" | "UNTIMEOUT";
  guildId: string;
  targetDiscordId: string;
  targetUsername: string;
  staffDiscordId: string;
  staffUsername: string;
  reason: string | null;
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: string;
}

interface Summary {
  totalWarns: number;
  totalTimeouts: number;
  totalKicks: number;
  totalBans: number;
}

export default function PunishmentsPage() {
  const [punishments, setPunishments] = useState<PunishmentItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [type, setType] = useState<"WARN" | "TIMEOUT" | "KICK" | "BAN">("WARN");
  const [targetDiscordId, setTargetDiscordId] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reason, setReason] = useState("");

  const fetchPunishments = async () => {
    setLoading(true);
    try {
      const url = filterType ? `/api/punishments?type=${filterType}` : "/api/punishments";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPunishments(data.punishments || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPunishments();
  }, [filterType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDiscordId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/punishments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          targetDiscordId,
          targetUsername: targetUsername || undefined,
          durationMinutes: type === "TIMEOUT" ? Number(durationMinutes) : undefined,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setTargetDiscordId("");
        setTargetUsername("");
        setReason("");
        fetchPunishments();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this punishment and restore user standing in Discord?")) return;
    try {
      await fetch(`/api/punishments?id=${id}`, { method: "DELETE" });
      fetchPunishments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              MODERATION CONTROL
            </span>
            <span className="text-[11px] font-mono text-muted">Disciplinary Tracking</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Punishments & Moderation</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Track user warnings, timeouts, kicks, and bans issued by staff or through Discord commands. Revoke or lift punishments with 1 click.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply Punishment</span>
          </button>
          <button
            onClick={fetchPunishments}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-white hover:border-accent transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Warnings</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">{summary?.totalWarns ?? 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Timeouts (Mutes)</span>
          <div className="text-2xl font-bold text-accent font-mono mt-2">{summary?.totalTimeouts ?? 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Kicks</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">{summary?.totalKicks ?? 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Bans</span>
          <div className="text-2xl font-bold text-red-400 font-mono mt-2">{summary?.totalBans ?? 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { label: "All Punishments", value: "" },
          { label: "Warnings", value: "WARN" },
          { label: "Timeouts", value: "TIMEOUT" },
          { label: "Kicks", value: "KICK" },
          { label: "Bans", value: "BAN" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === tab.value
                ? "bg-accent text-black font-bold shadow-glow"
                : "text-muted hover:text-white bg-card border border-border"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0D0D10] border border-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted">
            <thead className="bg-[#050505] text-[10px] uppercase font-mono tracking-wider text-muted border-b border-border">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Offender User</th>
                <th className="py-3.5 px-6">Punishing Staff</th>
                <th className="py-3.5 px-6">Reason / Duration</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {punishments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No moderation punishment records found.
                  </td>
                </tr>
              ) : (
                punishments.map((p) => (
                  <tr key={p.id} className="hover:bg-card/40 transition">
                    <td className="py-3.5 px-6 font-mono text-[11px] whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          p.type === "BAN"
                            ? "bg-red-500/15 border border-red-500/40 text-red-400"
                            : p.type === "TIMEOUT"
                            ? "bg-amber-500/15 border border-amber-500/40 text-amber-400"
                            : "bg-accent/15 border border-accent/40 text-accent"
                        }`}
                      >
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-semibold text-white">@{p.targetUsername}</div>
                      <div className="text-[10px] font-mono text-muted">ID: {p.targetDiscordId}</div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-semibold text-white">{p.staffUsername}</div>
                      <div className="text-[10px] font-mono text-muted">ID: {p.staffDiscordId}</div>
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate text-[11px]">
                      <div className="text-white/90 truncate">{p.reason || "No reason"}</div>
                      {p.durationMinutes && (
                        <div className="text-[10px] font-mono text-accent">Duration: {p.durationMinutes}m</div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-right">
                      {p.isActive && (p.type === "TIMEOUT" || p.type === "BAN") ? (
                        <button
                          onClick={() => handleRevoke(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-card border border-accent/30 text-white hover:border-accent font-medium text-xs flex items-center gap-1 transition ml-auto"
                        >
                          <RotateCcw className="w-3 h-3 text-accent" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-muted/40 text-[10px] font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Punishment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D0D10] border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gavel className="w-4 h-4 text-accent" />
                <span>Issue Disciplinary Action</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-muted font-medium mb-1 block">Punishment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="WARN">Official Warning</option>
                  <option value="TIMEOUT">Timeout / Mute</option>
                  <option value="KICK">Kick from Server</option>
                  <option value="BAN">Permanent Ban</option>
                </select>
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Target Discord User ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1504537530446643263"
                  value={targetDiscordId}
                  onChange={(e) => setTargetDiscordId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Target Username (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. notixnode"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              {type === "TIMEOUT" && (
                <div>
                  <label className="text-muted font-medium mb-1 block">Timeout Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={40320}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-muted font-medium mb-1 block">Reason / Policy Violation</label>
                <input
                  type="text"
                  placeholder="e.g. Inappropriate language or spam in support tickets"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-card border border-border text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-accent text-black font-bold hover:bg-accent-hover transition shadow-glow"
                >
                  {submitting ? "Applying..." : "Execute Moderation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
