"use client";

import React, { useEffect, useState } from "react";
import {
  Trash2,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  MessageSquare,
  Layers,
  Calendar,
} from "lucide-react";

interface DeletionItem {
  id: string;
  type: "MESSAGE" | "BULK_MESSAGE" | "CHANNEL";
  guildId: string | null;
  channelId: string | null;
  channelName: string | null;
  authorDiscordId: string | null;
  authorUsername: string | null;
  deletedByDiscordId: string | null;
  deletedByUsername: string | null;
  content: string | null;
  count: number | null;
  createdAt: string;
}

interface Summary {
  totalMessagesDeleted: number;
  totalBulkPurges: number;
  totalChannelsDeleted: number;
}

export default function DeletionsPage() {
  const [deletions, setDeletions] = useState<DeletionItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");

  const fetchDeletions = async () => {
    setLoading(true);
    try {
      const url = filterType ? `/api/deletions?type=${filterType}` : "/api/deletions";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDeletions(data.deletions || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletions();
  }, [filterType]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              AUDIT TRAIL & LOGS
            </span>
            <span className="text-[11px] font-mono text-muted">Message Purge & Channel Removal</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Deletions & Purge Stream</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Live audit of deleted messages, bulk channel purges, and removed channels. Tracks author, executor, and original content.
          </p>
        </div>

        <button
          onClick={fetchDeletions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-accent/30 text-white font-medium text-xs hover:border-accent transition shadow-glow self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Deletions</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Single Messages Deleted</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {summary?.totalMessagesDeleted ?? 0}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Bulk Purge Events</span>
          <div className="text-2xl font-bold text-accent font-mono mt-2">
            {summary?.totalBulkPurges ?? 0}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border">
          <span className="text-xs text-muted font-mono uppercase">Channels Removed</span>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {summary?.totalChannelsDeleted ?? 0}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { label: "All Deletions", value: "" },
          { label: "Single Messages", value: "MESSAGE" },
          { label: "Bulk Purges", value: "BULK_MESSAGE" },
          { label: "Channels", value: "CHANNEL" },
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
                <th className="py-3.5 px-6">Event Type</th>
                <th className="py-3.5 px-6">Author / Deleted By</th>
                <th className="py-3.5 px-6">Deleted Content / Details</th>
                <th className="py-3.5 px-6">Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deletions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    No deletion events recorded.
                  </td>
                </tr>
              ) : (
                deletions.map((d) => (
                  <tr key={d.id} className="hover:bg-card/40 transition">
                    <td className="py-3.5 px-6 font-mono text-[11px] whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-accent/15 border border-accent/40 text-accent">
                        {d.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div>
                        <div className="text-white font-medium">
                          {d.deletedByUsername
                            ? `Purged by: ${d.deletedByUsername}`
                            : d.authorUsername
                            ? `Author: ${d.authorUsername}`
                            : "System"}
                        </div>
                        <div className="text-[10px] font-mono text-muted">
                          ID: {d.deletedByDiscordId || d.authorDiscordId || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 max-w-sm truncate font-mono text-[11px] text-white">
                      {d.type === "BULK_MESSAGE" ? (
                        <span className="text-accent font-bold">Bulk purge: {d.count} messages deleted</span>
                      ) : (
                        <span className="bg-black/40 px-2 py-0.5 rounded border border-border truncate block">
                          {d.content || "[No text]"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap font-mono text-[11px] text-muted">
                      {d.channelName ? `#${d.channelName}` : d.channelId ? `ID: ${d.channelId}` : "Unknown"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

