"use client";

import React, { useEffect, useState } from "react";
import {
  MessageSquareText,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  Terminal,
} from "lucide-react";

interface AutoResponseItem {
  id: string;
  trigger: string;
  matchType: "EXACT" | "CONTAINS" | "STARTS_WITH" | "REGEX";
  responseContent: string;
  embedTitle: string | null;
  embedDescription: string | null;
  embedColor: string;
  isActive: boolean;
  useCount: number;
}

export default function AutoResponsesPage() {
  const [responses, setResponses] = useState<AutoResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [trigger, setTrigger] = useState("");
  const [matchType, setMatchType] = useState<"EXACT" | "CONTAINS" | "STARTS_WITH" | "REGEX">("CONTAINS");
  const [responseContent, setResponseContent] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedDescription, setEmbedDescription] = useState("");
  const [embedColor, setEmbedColor] = useState("#D4AF37");

  // Simulator test
  const [testMessage, setTestMessage] = useState("");
  const [simulatedMatch, setSimulatedMatch] = useState<AutoResponseItem | null>(null);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auto-responses");
      const data = await res.json();
      if (data.success) {
        setResponses(data.autoResponses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trigger || !responseContent) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auto-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger,
          matchType,
          responseContent,
          embedTitle: embedTitle || undefined,
          embedDescription: embedDescription || undefined,
          embedColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setTrigger("");
        setResponseContent("");
        setEmbedTitle("");
        setEmbedDescription("");
        fetchResponses();
      } else {
        alert(data.error || "Failed to create auto-response");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch("/api/auto-responses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      fetchResponses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this auto-response?")) return;
    try {
      await fetch(`/api/auto-responses?id=${id}`, { method: "DELETE" });
      fetchResponses();
    } catch (err) {
      console.error(err);
    }
  };

  // Test Simulator
  const handleTestSimulator = () => {
    const msg = testMessage.toLowerCase().trim();
    if (!msg) {
      setSimulatedMatch(null);
      return;
    }

    const match = responses.find((r) => {
      if (!r.isActive) return false;
      const trig = r.trigger.toLowerCase().trim();
      if (r.matchType === "EXACT") return msg === trig;
      if (r.matchType === "STARTS_WITH") return msg.startsWith(trig);
      if (r.matchType === "REGEX") {
        try {
          return new RegExp(r.trigger, "i").test(testMessage);
        } catch {
          return false;
        }
      }
      return msg.includes(trig);
    });

    setSimulatedMatch(match || null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              CHAT AUTOMATION & TRIGGERS
            </span>
            <span className="text-[11px] font-mono text-muted">Regex & Substring Matching</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Auto-Responses Engine</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Configure automated keyword triggers that reply with rich luxury embeds or instant text responses across all Discord channels.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Auto-Response</span>
          </button>
          <button
            onClick={fetchResponses}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-white hover:border-accent transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Simulator Sandbox */}
      <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-accent" />
            <span>Interactive Auto-Response Simulator</span>
          </div>
          <span className="text-[10px] font-mono text-muted">Test trigger matching live</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Type a sample member message (e.g. 'what is the server ip?')..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-[#050505] border border-border text-white text-xs placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleTestSimulator}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-card border border-accent/40 text-white font-medium text-xs hover:border-accent transition shadow-glow"
          >
            Simulate Message
          </button>
        </div>

        {simulatedMatch && (
          <div className="p-3.5 rounded-xl bg-card/60 border border-accent/40 flex flex-col gap-1.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-bold">
                MATCH FOUND: Trigger "{simulatedMatch.trigger}" ({simulatedMatch.matchType})
              </span>
            </div>
            {simulatedMatch.embedTitle && (
              <div className="font-bold text-white mt-1">{simulatedMatch.embedTitle}</div>
            )}
            <div className="text-white/90 font-mono text-[11px] bg-black/40 p-2 rounded border border-border">
              {simulatedMatch.embedDescription || simulatedMatch.responseContent}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Auto-Responses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responses.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#0D0D10] border border-border">
            <MessageSquareText className="w-10 h-10 text-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No auto-responses configured</h3>
            <p className="text-xs text-muted mt-1">Add trigger phrases so the bot replies instantly to common questions.</p>
          </div>
        ) : (
          responses.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-2xl bg-[#0D0D10] border relative flex flex-col justify-between overflow-hidden shadow-card transition ${
                r.isActive ? "border-accent/40" : "border-border opacity-70"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-accent/15 border border-accent/40 text-accent">
                    {r.matchType}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(r.id, r.isActive)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                        r.isActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-muted/15 border-muted/30 text-muted"
                      }`}
                    >
                      {r.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-muted hover:text-red-400 p-1 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted font-mono uppercase">Trigger Keyword</span>
                  <div className="font-mono text-sm font-bold text-white mt-0.5">"{r.trigger}"</div>
                </div>

                {r.embedTitle && (
                  <div className="p-2.5 rounded-xl bg-card border border-accent/20">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.embedColor }} />
                      <span>{r.embedTitle}</span>
                    </div>
                    {r.embedDescription && (
                      <p className="text-[11px] text-muted mt-1 whitespace-pre-wrap">{r.embedDescription}</p>
                    )}
                  </div>
                )}

                {!r.embedTitle && (
                  <div className="p-2.5 rounded-xl bg-card border border-border text-[11px] text-white/90 font-mono">
                    {r.responseContent}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[11px] text-muted font-mono">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>Triggered {r.useCount} times</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D0D10] border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-accent" />
                <span>Create Auto-Response</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-muted font-medium mb-1 block">Trigger Phrase / Keyword *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. price, ip, store, rules"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Match Strategy</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                >
                  <option value="CONTAINS">Contains Keyword (Anywhere in sentence)</option>
                  <option value="EXACT">Exact Match (Message is only this word)</option>
                  <option value="STARTS_WITH">Starts With Word</option>
                  <option value="REGEX">Regular Expression (Regex)</option>
                </select>
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Text Response Content *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Message the bot will send when triggered..."
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Optional Embed Title</label>
                <input
                  type="text"
                  placeholder="Leave empty for plain text response"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Optional Embed Description</label>
                <textarea
                  rows={2}
                  placeholder="Extended markdown text for the embed body"
                  value={embedDescription}
                  onChange={(e) => setEmbedDescription(e.target.value)}
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
                  {submitting ? "Saving..." : "Create Trigger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

