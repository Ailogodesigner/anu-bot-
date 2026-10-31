"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Shield,
  Star,
  Ticket,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Activity,
  Flame,
  Award,
  Radio,
  Terminal,
  X,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface StaffMember {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: "ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT" | "VIEWER";
  status: "ONLINE" | "BUSY" | "OFFLINE" | "ON_BREAK";
  activeTicketsCount: number;
  totalResolvedTickets: number;
  avgRating: number;
  lastActiveAt: string | null;
  assignedTickets: Array<{ id: string; ticketNumber: number; priority: string; status: string }>;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // New staff modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "SUPPORT_LEAD" | "SUPPORT_AGENT">("SUPPORT_AGENT");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error("Staff fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStaff();
    } catch (err) {
      console.error("Status change error:", err);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchStaff();
    } catch (err) {
      console.error("Role change error:", err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: newDiscordId,
          username: newUsername,
          role: newRole,
          status: "ONLINE",
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewDiscordId("");
        setNewUsername("");
        fetchStaff();
      }
    } catch (err) {
      console.error("Add staff error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter staff members
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch =
        s.username.toLowerCase().includes(search.toLowerCase()) ||
        s.discordId.includes(search);
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [staff, search, statusFilter, roleFilter]);

  // Aggregate metrics
  const activeStaffCount = staff.filter((s) => s.status === "ONLINE" || s.status === "BUSY").length;
  const totalResolved = staff.reduce((acc, curr) => acc + curr.totalResolvedTickets, 0);
  const totalHandling = staff.reduce((acc, curr) => acc + curr.activeTicketsCount, 0);

  // Leaderboard ranking (Top 3)
  const leaderboard = useMemo(() => {
    return [...staff].sort((a, b) => b.totalResolvedTickets - a.totalResolvedTickets).slice(0, 3);
  }, [staff]);

  // Format relative time for last active
  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return "No activity recorded";
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Active just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Dedicated Server Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-card">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-semibold flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-accent" />
              SERVER: 1528401268354056293
            </span>
            <span className="text-[11px] font-mono text-muted">Discord Live Gateway</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Staff Workforce & Telemetry Hub</span>
          </h1>
          <p className="text-xs text-muted max-w-xl leading-relaxed">
            Real-time shift tracking, ticket resolution performance, and response latency across all authorized moderators and support engineers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="p-2.5 rounded-xl bg-card-secondary hover:bg-border text-muted hover:text-foreground border border-border transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-accent" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Strict 2-Color Architecture) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Staff On Duty</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{activeStaffCount}</span>
            <span className="text-xs text-muted">/ {staff.length} staff</span>
          </div>
          <div className="mt-2 text-[11px] text-accent font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>Ready for ticket dispatch</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Active Workload</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-accent font-mono">{totalHandling}</span>
            <span className="text-xs text-muted">claimed tickets</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground font-mono">
            Across active staff queues
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Total Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{totalResolved}</span>
            <span className="text-xs text-muted">lifetime tickets</span>
          </div>
          <div className="mt-2 text-[11px] text-accent-light font-mono">
            100% archived with HTML transcripts
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Avg Response SLA</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">&lt; 8.5m</span>
            <span className="text-xs text-muted">average</span>
          </div>
          <div className="mt-2 text-[11px] text-accent font-mono">
            Exceeding 30m guarantee
          </div>
        </div>
      </div>

      {/* Staff Leaderboard Section (Top 3 Performers) */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Top Resolvers • Server 1528401268354056293
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted">Ranked by tickets resolved</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {leaderboard.map((member, idx) => (
            <div
              key={member.id}
              className="p-4 rounded-xl bg-card-secondary border border-border hover:border-accent/40 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-accent font-mono text-sm shadow-subtle">
                  #{idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>{member.username}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted">
                    ⭐ {member.avgRating.toFixed(2)} CSAT Rating
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-bold text-accent font-mono">
                  {member.totalResolvedTickets}
                </div>
                <div className="text-[10px] text-muted uppercase font-mono">Resolved</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff or Discord ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card-secondary border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-card-secondary border border-border text-xs text-foreground font-mono focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="ONLINE">Online</option>
            <option value="BUSY">Busy</option>
            <option value="ON_BREAK">On Break</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-card-secondary border border-border text-xs text-foreground font-mono focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPPORT_LEAD">Support Lead</option>
            <option value="SUPPORT_AGENT">Support Agent</option>
          </select>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-muted flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-accent" />
            <span className="font-mono">Syncing staff roster from server 1528401268354056293...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-muted border border-border rounded-2xl bg-card">
            No staff members found matching your search or filters.
          </div>
        ) : (
          filteredStaff.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-accent/40 shadow-subtle transition space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Staff User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card-secondary border border-border flex items-center justify-center font-bold text-accent font-mono text-sm">
                      {s.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span>{s.username}</span>
                        {s.role === "ADMIN" && <Shield className="w-3.5 h-3.5 text-accent" />}
                      </div>
                      <div className="text-[11px] font-mono text-muted">{s.discordId}</div>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      s.status === "ONLINE"
                        ? "bg-accent/15 text-accent border-accent/30"
                        : s.status === "BUSY"
                        ? "bg-card-secondary text-accent-light border-border"
                        : s.status === "ON_BREAK"
                        ? "bg-card-secondary text-muted border-border"
                        : "bg-card-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                {/* Last Active Timestamp */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-lg bg-card-secondary/70 border border-border">
                  <span className="text-muted">Last Active:</span>
                  <span className="text-foreground">{formatLastActive(s.lastActiveAt)}</span>
                </div>

                {/* Workload Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 p-3 rounded-xl bg-card-secondary border border-border text-center">
                  <div>
                    <div className="text-[10px] text-muted uppercase font-mono">Active</div>
                    <div className="text-base font-bold text-accent font-mono mt-0.5">
                      {s.activeTicketsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase font-mono">Resolved</div>
                    <div className="text-base font-bold text-foreground font-mono mt-0.5">
                      {s.totalResolvedTickets}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase font-mono">CSAT</div>
                    <div className="text-base font-bold text-accent font-mono mt-0.5">
                      {s.avgRating.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Assigned Tickets Pill List */}
                {s.assignedTickets?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] text-muted mb-1 font-mono uppercase">Assigned In Queue:</div>
                    <div className="flex flex-wrap gap-1">
                      {s.assignedTickets.map((t) => (
                        <span
                          key={t.id}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent-light"
                        >
                          #{t.ticketNumber} ({t.priority})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Role Controls */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <select
                  value={s.status}
                  onChange={(e) => handleStatusChange(s.id, e.target.value)}
                  className="w-1/2 py-1.5 px-2 rounded-lg bg-card-secondary border border-border text-[11px] text-foreground font-mono focus:outline-none focus:border-accent"
                >
                  <option value="ONLINE">Online</option>
                  <option value="BUSY">Busy</option>
                  <option value="ON_BREAK">On Break</option>
                  <option value="OFFLINE">Offline</option>
                </select>

                <select
                  value={s.role}
                  onChange={(e) => handleRoleChange(s.id, e.target.value)}
                  className="w-1/2 py-1.5 px-2 rounded-lg bg-card-secondary border border-border text-[11px] text-foreground font-mono focus:outline-none focus:border-accent"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPPORT_LEAD">Support Lead</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground">Add Staff Member</h3>
            <p className="text-xs text-muted mt-1">
              Grant dashboard permissions and sync with server 1528401268354056293.
            </p>

            <form onSubmit={handleAddStaff} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Discord User ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1528401268354056293"
                  value={newDiscordId}
                  onChange={(e) => setNewDiscordId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-card-secondary border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Display / Staff Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex_NetOps"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-card-secondary border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Assigned Console Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-card-secondary border border-border text-xs text-foreground focus:outline-none focus:border-accent font-mono"
                >
                  <option value="SUPPORT_AGENT">Support Agent (Claims & Replies)</option>
                  <option value="SUPPORT_LEAD">Support Lead (Escalations & Workloads)</option>
                  <option value="ADMIN">Administrator (Full Console Access)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-card-secondary border border-border text-xs font-semibold text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs shadow-glow"
                >
                  {submitting ? "Registering..." : "Add to Server Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
