"use client";

import React, { useEffect, useState } from "react";
import {
  Gift,
  Plus,
  RefreshCw,
  Clock,
  Users,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Shuffle,
  Calendar,
} from "lucide-react";

interface GiveawayItem {
  id: string;
  guildId: string;
  channelId: string;
  prize: string;
  description: string | null;
  winnerCount: number;
  endsAt: string;
  status: "ACTIVE" | "ENDED" | "REROLLED" | "CANCELLED";
  hostedByUsername: string;
  participantsCount: number;
  winners: string[];
  createdAt: string;
}

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<GiveawayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form state
  const [prize, setPrize] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [winnerCount, setWinnerCount] = useState(1);
  const [channelId, setChannelId] = useState("");

  const fetchGiveaways = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/giveaways");
      const data = await res.json();
      if (data.success) {
        setGiveaways(data.giveaways || []);
      }
    } catch (err) {
      console.error("Failed to load giveaways:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prize) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prize,
          durationMinutes: Number(durationMinutes),
          winnerCount: Number(winnerCount),
          channelId: channelId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setPrize("");
        fetchGiveaways();
      } else {
        alert(data.error || "Failed to create giveaway");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReroll = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/giveaways/reroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchGiveaways();
      } else {
        alert(data.error || "Reroll failed");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this giveaway?")) return;
    try {
      await fetch(`/api/giveaways?id=${id}`, { method: "DELETE" });
      fetchGiveaways();
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
              DISCORD COMMUNITY PERKS
            </span>
            <span className="text-[11px] font-mono text-muted">Automated Picker & Rolling</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Giveaways Management</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Launch luxury gold giveaways, monitor entries in real time, auto-dispatch Discord embeds with entry buttons,
            and reroll winners with one click.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Giveaway</span>
          </button>
          <button
            onClick={fetchGiveaways}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-white hover:border-accent transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Giveaways Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {giveaways.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#0D0D10] border border-border">
            <Gift className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No active giveaways</h3>
            <p className="text-xs text-muted mt-1">Create your first community giveaway to engage server members.</p>
          </div>
        ) : (
          giveaways.map((g) => {
            const isEnded = g.status === "ENDED" || g.status === "REROLLED";
            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-[#0D0D10] border border-border relative flex flex-col justify-between overflow-hidden shadow-card hover:border-accent/40 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isEnded
                          ? "bg-muted/15 border border-muted/30 text-muted"
                          : "bg-accent/15 border border-accent/40 text-accent"
                      }`}
                    >
                      {g.status}
                    </span>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-muted hover:text-red-400 p-1 transition"
                      title="Delete giveaway"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-accent" />
                      <span>{g.prize}</span>
                    </h3>
                    <div className="text-[11px] text-muted mt-1 flex items-center gap-2">
                      <span>Hosted by: <strong className="text-white">{g.hostedByUsername}</strong></span>
                      <span>•</span>
                      <span>Channel: <strong className="font-mono text-white">{g.channelId}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted uppercase font-mono">Entries</span>
                      <div className="font-bold text-white text-sm font-mono flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-accent" />
                        <span>{g.participantsCount} Users</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase font-mono">Winners Count</span>
                      <div className="font-bold text-white text-sm font-mono flex items-center gap-1 mt-0.5">
                        <Trophy className="w-3 h-3 text-accent" />
                        <span>{g.winnerCount}</span>
                      </div>
                    </div>
                  </div>

                  {g.winners && g.winners.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-card border border-accent/30 text-xs">
                      <span className="text-[10px] font-mono text-accent uppercase font-bold">Selected Winner(s):</span>
                      <div className="font-mono text-white text-[11px] mt-1">
                        {g.winners.map((w) => `<@${w}>`).join(", ")}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-muted font-mono flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-accent" />
                    <span>Ends: {new Date(g.endsAt).toLocaleDateString()} {new Date(g.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => handleReroll(g.id)}
                    disabled={actionLoadingId === g.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-card border border-accent/30 hover:border-accent text-white font-medium text-xs transition"
                  >
                    <Shuffle className="w-3 h-3 text-accent" />
                    <span>Reroll Winners</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D0D10] border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-accent" />
                <span>Create New Discord Giveaway</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-muted font-medium mb-1 block">Prize Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 Month Cavrix Cloud Dedicated VPS"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted font-medium mb-1 block">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-muted font-medium mb-1 block">Number of Winners</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Target Discord Channel ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for default announcements channel"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
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
                  {submitting ? "Launching..." : "Launch Giveaway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
