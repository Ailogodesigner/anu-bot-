"use client";

import React, { useEffect, useState } from "react";
import {
  FileCode,
  Search,
  Filter,
  RefreshCw,
  User,
  Shield,
  Activity,
  Calendar,
  Layers,
  Terminal,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";

interface AuditEntry {
  id: string;
  staffDiscordId: string;
  staffUsername: string;
  commandName: string;
  targetDiscordId: string | null;
  targetUsername: string | null;
  guildId: string | null;
  channelId: string | null;
  channelName: string | null;
  parameters: string | null;
  executionSource: string;
  createdAt: string;
}

interface TelemetrySummary {
  totalCommands: number;
  topStaff: Array<{ id: string; username: string; count: number }>;
  topCommands: Array<{ name: string; count: number }>;
}

export default function StaffAuditPage() {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchStaff, setSearchStaff] = useState("");
  const [searchTarget, setSearchTarget] = useState("");
  const [filterCommand, setFilterCommand] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchStaff) params.set("staffId", searchStaff);
      if (searchTarget) params.set("targetId", searchTarget);
      if (filterCommand) params.set("command", filterCommand);

      const res = await fetch(`/api/staff-audit?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAudits(data.audits || []);
        setTelemetry(data.telemetry || null);
      }
    } catch (err) {
      console.error("Failed to load staff command audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              STAFF COMMAND TELEMETRY
            </span>
            <span className="text-[11px] font-mono text-muted">Audited & Timestamped</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Staff Execution Analysis</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Real-time tracking of which staff member executes each Discord or Dashboard command, target users affected,
            arguments passed, and channel origin.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-accent/30 text-white font-medium text-xs hover:border-accent hover:bg-card-secondary transition shadow-glow self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Total Commands Logged</span>
            <Terminal className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white font-mono">
            {telemetry?.totalCommands ?? audits.length}
          </div>
          <div className="mt-1 text-[11px] text-muted flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Across Discord Gateway & Console
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Most Active Officer</span>
            <User className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-3 text-xl font-bold text-white truncate">
            {telemetry?.topStaff?.[0]?.username || "No records yet"}
          </div>
          <div className="mt-1 text-[11px] text-muted font-mono">
            {telemetry?.topStaff?.[0] ? `${telemetry.topStaff[0].count} commands executed` : "Awaiting command activity"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D0D10] border border-border relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Top Command Used</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-3 text-xl font-bold text-accent font-mono">
            {telemetry?.topCommands?.[0]?.name || "N/A"}
          </div>
          <div className="mt-1 text-[11px] text-muted font-mono">
            {telemetry?.topCommands?.[0] ? `${telemetry.topCommands[0].count} runs recorded` : "Zero executions"}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleFilterSubmit} className="p-4 rounded-xl bg-[#0D0D10] border border-border flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search command name (e.g. /timeout, /ban, !purge)..."
            value={filterCommand}
            onChange={(e) => setFilterCommand(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-black font-bold text-xs hover:bg-accent-hover transition shadow-glow"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
          {(filterCommand || searchStaff || searchTarget) && (
            <button
              type="button"
              onClick={() => {
                setFilterCommand("");
                setSearchStaff("");
                setSearchTarget("");
                setTimeout(fetchData, 50);
              }}
              className="px-3 py-2 rounded-lg bg-card border border-border text-muted hover:text-white text-xs transition"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Audit Telemetry Table */}
      <div className="rounded-2xl bg-[#0D0D10] border border-border overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileCode className="w-4 h-4 text-accent" />
            <span>Command Execution Telemetry Stream</span>
          </div>
          <span className="text-[11px] font-mono text-muted">{audits.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted">
            <thead className="bg-[#050505] text-[10px] uppercase font-mono tracking-wider text-muted border-b border-border">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Staff Officer</th>
                <th className="py-3.5 px-6">Command Executed</th>
                <th className="py-3.5 px-6">Target Recipient / User</th>
                <th className="py-3.5 px-6">Parameters & Notes</th>
                <th className="py-3.5 px-6">Channel / Guild</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Terminal className="w-8 h-8 text-muted/40" />
                      <p className="font-mono text-xs">No staff command execution records found.</p>
                      <p className="text-[11px] text-muted">Commands executed by staff members in Discord or Console will appear here live.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                audits.map((a) => {
                  return (
                    <tr key={a.id} className="hover:bg-card/40 transition">
                      <td className="py-3.5 px-6 font-mono text-[11px] text-muted whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-card border border-accent/40 flex items-center justify-center font-bold text-[10px] text-accent">
                            {a.staffUsername?.charAt(0).toUpperCase() || "S"}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{a.staffUsername}</div>
                            <div className="text-[10px] font-mono text-muted">ID: {a.staffDiscordId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-[#050505] border border-accent/30 font-mono text-accent text-xs font-semibold">
                          {a.commandName}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        {a.targetUsername || a.targetDiscordId ? (
                          <div>
                            <div className="font-medium text-white flex items-center gap-1">
                              <span>@{a.targetUsername || "Target"}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted">ID: {a.targetDiscordId}</div>
                          </div>
                        ) : (
                          <span className="text-muted/60 italic">N/A (Server / Channel)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 max-w-xs truncate font-mono text-[11px]">
                        {a.parameters ? (
                          <span className="text-white/80 bg-black/40 px-2 py-0.5 rounded border border-border">
                            {a.parameters}
                          </span>
                        ) : (
                          <span className="text-muted/40">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap font-mono text-[11px] text-muted">
                        {a.channelName ? `#${a.channelName}` : a.channelId ? `Ch: ${a.channelId}` : "Global"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

