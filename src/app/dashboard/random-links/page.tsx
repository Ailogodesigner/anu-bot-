"use client";

import React, { useEffect, useState } from "react";
import {
  Link2,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";

interface LinkItem {
  id: string;
  title: string;
  slug: string;
  targetUrl: string;
  clicksCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function RandomLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/random-links");
      const data = await res.json();
      if (data.success) {
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !targetUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/random-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, targetUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setTitle("");
        setSlug("");
        setTargetUrl("");
        fetchLinks();
      } else {
        alert(data.error || "Failed to create link");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch("/api/random-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      fetchLinks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    try {
      await fetch(`/api/random-links?id=${id}`, { method: "DELETE" });
      fetchLinks();
    } catch (err) {
      console.error(err);
    }
  };

  const copyShortUrl = (slugStr: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shortUrl = `${origin}/r/${slugStr}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalClicks = links.reduce((sum, l) => sum + l.clicksCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              VANITY & ROTATOR LINKS
            </span>
            <span className="text-[11px] font-mono text-muted">Click Analytics Enabled</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Random & Vanity Links</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Create fast, branded redirect URLs (e.g. <code>/r/discord</code>, <code>/r/store</code>), track customer clicks,
            and manage link rotators.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Short Link</span>
          </button>
          <button
            onClick={fetchLinks}
            disabled={loading}
            className="p-2.5 rounded-xl bg-card border border-border text-muted hover:text-white hover:border-accent transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Total Links Created</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">{links.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Total Clicks Recorded</span>
          <div className="text-2xl font-bold text-accent font-mono mt-2">{totalClicks}</div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Active Rotators</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">{links.filter((l) => l.isActive).length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0D0D10] border border-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted">
            <thead className="bg-[#050505] text-[10px] uppercase font-mono tracking-wider text-muted border-b border-border">
              <tr>
                <th className="py-3.5 px-6">Title & Vanity Slug</th>
                <th className="py-3.5 px-6">Target Destination URL</th>
                <th className="py-3.5 px-6">Clicks</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    No vanity links created yet. Click "Create Short Link" above.
                  </td>
                </tr>
              ) : (
                links.map((l) => (
                  <tr key={l.id} className="hover:bg-card/40 transition">
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-bold text-white">{l.title}</div>
                      <div className="font-mono text-accent text-[11px] mt-0.5">/r/{l.slug}</div>
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate font-mono text-[11px] text-muted">
                      <a
                        href={l.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{l.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap font-mono text-white font-bold">
                      <div className="flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-accent" />
                        <span>{l.clicksCount}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(l.id, l.isActive)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                          l.isActive
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                            : "bg-muted/15 border-muted/30 text-muted"
                        }`}
                      >
                        {l.isActive ? "ACTIVE" : "DISABLED"}
                      </button>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyShortUrl(l.slug, l.id)}
                          className="px-2.5 py-1 rounded-lg bg-card border border-border text-white hover:border-accent font-medium text-xs flex items-center gap-1 transition"
                        >
                          {copiedId === l.id ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === l.id ? "Copied" : "Copy"}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1 text-muted hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D0D10] border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-accent" />
                <span>Create Vanity Short Link</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white text-xs font-mono">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-muted font-medium mb-1 block">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord Community Invite"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Vanity Slug (path after /r/) *</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-lg bg-card border border-r-0 border-border text-muted font-mono text-xs">
                    /r/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="discord"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-r-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted font-medium mb-1 block">Target Destination URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://discord.gg/your-server"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
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
                  {submitting ? "Creating..." : "Create Short Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
