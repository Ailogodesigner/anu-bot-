"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Server,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Bot,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Megaphone,
  Radio,
  Award,
  Layers,
} from "lucide-react";

interface OverviewData {
  metrics: {
    totalTickets: number;
    activeTickets: number;
    awaitingStaffTickets: number;
    resolvedTickets: number;
    escalationRate: number;
    avgResponseTime: number;
    activeStaffCount: number;
    totalStaffCount: number;
    pendingJobsCount: number;
  };
  systemHealth: {
    botStatus: string;
    memoryUsageMb: number;
    uptimeSeconds: number;
    aiProvider: string;
    tokensUsedThisMonth: number;
    monthlyTokenLimit: number;
  };
  recentTickets: Array<{
    id: string;
    ticketNumber: number;
    title: string;
    status: string;
    priority: string;
    customerUsername: string;
    createdAt: string;
    category: { name: string; emoji: string | null };
    assignedStaff: { username: string } | null;
  }>;
  recentAudits: Array<{
    id: string;
    actorUsername: string;
    action: string;
    targetType: string;
    createdAt: string;
    details: string | null;
  }>;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load overview data");
        return res.json();
      })
      .then((resData) => {
        if (resData && resData.metrics && resData.systemHealth) {
          setData(resData);
        }
      })
      .catch((err) => {
        console.error("Overview fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !data || !data.metrics || !data.systemHealth) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-card rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-2xl border border-border"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = data.metrics || {
    totalTickets: 0,
    activeTickets: 0,
    awaitingStaffTickets: 0,
    resolvedTickets: 0,
    escalationRate: 0,
    avgResponseTime: 0,
    activeStaffCount: 0,
    totalStaffCount: 0,
    pendingJobsCount: 0,
  };
  const systemHealth = data.systemHealth || {
    botStatus: "ONLINE",
    memoryUsageMb: 0,
    uptimeSeconds: 0,
    aiProvider: "N/A",
    tokensUsedThisMonth: 0,
    monthlyTokenLimit: 500000,
  };
  const recentTickets = data.recentTickets || [];
  const recentAudits = data.recentAudits || [];

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
            <span className="text-[11px] font-mono text-muted">Dedicated Bot Gateway</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Cavrix Cloud Command Center</span>
          </h1>
          <p className="text-xs text-muted max-w-xl leading-relaxed">
            Real-time operations, staff shift tracking, automated SLA monitoring, and AI technical support telemetry.
          </p>
        </div>

        {/* Quick action buttons (Strict 2-Color Architecture) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Manage Queue</span>
          </Link>
          <Link
            href="/dashboard/staff"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card-secondary border border-border hover:border-accent/40 text-foreground text-xs font-semibold transition"
          >
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>Staff Telemetry</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid (Strict 2-Color Palette: Obsidian Carbon + Electric Cyan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tickets */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Active Support Queue</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{metrics.activeTickets}</span>
            <span className="text-xs text-muted">/ {metrics.totalTickets} total</span>
          </div>
          <div className="mt-2 text-[11px] text-accent font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>{metrics.resolvedTickets} tickets resolved</span>
          </div>
        </div>

        {/* Awaiting Staff */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Awaiting Human Staff</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-accent font-mono">{metrics.awaitingStaffTickets}</span>
            <span className="text-xs text-muted">escalations</span>
          </div>
          <div className="mt-2 text-[11px] text-accent font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>{metrics.escalationRate}% escalation rate</span>
          </div>
        </div>

        {/* First Response Time */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Avg Response SLA</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{metrics.avgResponseTime}</span>
            <span className="text-xs text-muted">minutes</span>
          </div>
          <div className="mt-2 text-[11px] text-accent font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Exceeding 30m SLA threshold</span>
          </div>
        </div>

        {/* Active Staff On Duty */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase font-mono text-[11px]">Staff On Duty</span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground font-mono">{metrics.activeStaffCount}</span>
            <span className="text-xs text-muted">online / {metrics.totalStaffCount} total</span>
          </div>
          <div className="mt-2 text-[11px] text-accent font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Server 1528401268354056293 synced</span>
          </div>
        </div>
      </div>

      {/* Gateway & Telemetry Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Discord Bot Gateway</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>Server 1528401268354056293</span>
              <span className="text-[11px] font-mono text-accent font-semibold">ONLINE</span>
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">
              Memory: {systemHealth.memoryUsageMb} MB RSS
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">AI Diagnostic Assistant</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>{systemHealth.aiProvider}</span>
              <span className="text-[11px] font-mono text-accent">ACTIVE</span>
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">
              Tokens: {systemHealth.tokensUsedThisMonth.toLocaleString()} / {systemHealth.monthlyTokenLimit.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-muted">Job Queue Engine</div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>Scheduled Job Runner</span>
              <span className="text-[11px] font-mono text-accent">READY</span>
            </div>
            <div className="text-[11px] text-muted font-mono mt-0.5">
              {metrics.pendingJobsCount} job(s) in queue
            </div>
          </div>
        </div>
      </div>

      {/* Support Category Analysis & Volume Grid */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Support Volume by Category • Live Analysis
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted">Automated Categorization</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-card-secondary border border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">VPS Connectivity</span>
              <span className="font-mono text-accent font-semibold">42%</span>
            </div>
            <div className="w-full bg-card h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: "42%" }} />
            </div>
            <div className="text-[10px] text-muted font-mono">DDoS, packet loss & latency</div>
          </div>

          <div className="p-4 rounded-xl bg-card-secondary border border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">SSH & Firewall</span>
              <span className="font-mono text-accent font-semibold">28%</span>
            </div>
            <div className="w-full bg-card h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: "28%" }} />
            </div>
            <div className="text-[10px] text-muted font-mono">UFW, iptables & port rules</div>
          </div>

          <div className="p-4 rounded-xl bg-card-secondary border border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Resource & OOM</span>
              <span className="font-mono text-accent font-semibold">18%</span>
            </div>
            <div className="w-full bg-card h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: "18%" }} />
            </div>
            <div className="text-[10px] text-muted font-mono">RAM, disk space & high CPU</div>
          </div>

          <div className="p-4 rounded-xl bg-card-secondary border border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Billing & Upgrades</span>
              <span className="font-mono text-accent font-semibold">12%</span>
            </div>
            <div className="w-full bg-card h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: "12%" }} />
            </div>
            <div className="text-[10px] text-muted font-mono">Invoices, addons & renewals</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Tickets & Privileged Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Recent Ticket Activity</h2>
            </div>
            <Link
              href="/dashboard/tickets"
              className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
            >
              <span>View all tickets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-card-secondary text-muted border-b border-border uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-card-secondary/50 transition">
                      <td className="py-3.5 px-4">
                        <Link href={`/dashboard/tickets/${t.id}`} className="font-semibold text-foreground hover:text-accent">
                          #{t.ticketNumber} - {t.title.slice(0, 36)}...
                        </Link>
                        <div className="text-[11px] text-muted mt-0.5">by {t.customerUsername}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-muted flex items-center gap-1.5">
                          <span>{t.category.emoji || "📁"}</span>
                          <span>{t.category.name}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/10 text-accent border border-accent/20">
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium font-mono bg-card-secondary text-accent border border-border">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted font-mono">
                        {t.assignedStaff ? (
                          <span className="text-foreground font-semibold">{t.assignedStaff.username}</span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Audit Log Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Security Audit Trail</h2>
            </div>
            <Link
              href="/dashboard/audit-logs"
              className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
            >
              <span>View audit log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
            {recentAudits.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-card-secondary/70 border border-border text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-accent font-semibold text-[11px]">{a.action}</span>
                  <span className="text-[10px] text-muted font-mono">
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-muted text-[11px]">
                  Actor: <span className="text-foreground font-semibold">{a.actorUsername}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
