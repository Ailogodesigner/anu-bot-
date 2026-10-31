"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  Activity,
  CheckCircle2,
  Clock,
  Shield,
  Bot,
  Zap,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Globe2,
} from "lucide-react";

interface StatusItem {
  name: string;
  category: "Compute Nodes" | "Platform Services" | "Security & Network";
  status: "OPERATIONAL" | "DEGRADED" | "MAINTENANCE";
  uptime: string;
  latency: string;
}

const STATUS_ITEMS: StatusItem[] = [
  {
    name: "Frankfurt Hypervisor Cluster (FRA-01)",
    category: "Compute Nodes",
    status: "OPERATIONAL",
    uptime: "100.0%",
    latency: "4ms",
  },
  {
    name: "London Hypervisor Cluster (LON-01)",
    category: "Compute Nodes",
    status: "OPERATIONAL",
    uptime: "100.0%",
    latency: "7ms",
  },
  {
    name: "New York Hypervisor Cluster (NYC-01)",
    category: "Compute Nodes",
    status: "OPERATIONAL",
    uptime: "99.99%",
    latency: "14ms",
  },
  {
    name: "Singapore Hypervisor Cluster (SIN-01)",
    category: "Compute Nodes",
    status: "OPERATIONAL",
    uptime: "100.0%",
    latency: "9ms",
  },
  {
    name: "Discord Bot Gateway WebSocket",
    category: "Platform Services",
    status: "OPERATIONAL",
    uptime: "99.99%",
    latency: "18ms",
  },
  {
    name: "AI Technical Support Engine (LLM)",
    category: "Platform Services",
    status: "OPERATIONAL",
    uptime: "99.95%",
    latency: "420ms",
  },
  {
    name: "Ticket Dispatcher & Webhooks",
    category: "Platform Services",
    status: "OPERATIONAL",
    uptime: "100.0%",
    latency: "32ms",
  },
  {
    name: "Path.net Anycast Anti-DDoS Scrubbing",
    category: "Security & Network",
    status: "OPERATIONAL",
    uptime: "100.0%",
    latency: "< 1ms",
  },
  {
    name: "BGP Anycast Routing & Edge DNS",
    category: "Security & Network",
    status: "OPERATIONAL",
    uptime: "100.0%",
    latency: "2ms",
  },
];

export default function StatusPage() {
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshed("Just now");
    }, 500);
  };

  const categories = ["Compute Nodes", "Platform Services", "Security & Network"] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-black">
      {/* Top Header */}
      <header className="border-b border-border bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-card border border-border group-hover:border-accent/50 flex items-center justify-center transition shadow-glow">
              <Server className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>CAVRIX</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                  STATUS
                </span>
              </div>
              <div className="text-[10px] text-muted">Global Infrastructure Telemetry</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Banner: Overall Status */}
        <div className="p-6 md:p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                All Systems Fully Operational
              </h1>
              <p className="text-xs text-muted mt-0.5">
                All global compute nodes, Discord gateway services, and network uplinks are operating nominally.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-muted font-mono">Last Checked</div>
            <div className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">
              {lastRefreshed}
            </div>
          </div>
        </div>

        {/* 90-Day Uptime Graphical Bar */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <span>Global Uptime (Last 90 Days)</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">99.98%</span>
          </div>

          {/* 90 bars */}
          <div className="flex items-center gap-1 h-8 pt-1">
            {[...Array(60)].map((_, i) => (
              <div
                key={i}
                title={`Day ${60 - i}: 100% Operational`}
                className="flex-1 h-full bg-emerald-500/80 hover:bg-emerald-400 rounded-sm transition cursor-pointer"
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted font-mono pt-1">
            <span>60 days ago</span>
            <span className="text-foreground">Today (100% Operational)</span>
          </div>
        </div>

        {/* System Services Grouped by Category */}
        <div className="space-y-8">
          {categories.map((cat) => {
            const items = STATUS_ITEMS.filter((i) => i.category === cat);

            return (
              <div key={cat} className="space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider px-1">
                  {cat}
                </h3>

                <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-card-secondary/40 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs sm:text-sm font-semibold text-foreground">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-muted font-mono flex items-center gap-3">
                          <span>Latency: {item.latency}</span>
                          <span>•</span>
                          <span>90d SLA: {item.uptime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Incident History & Maintenance Log */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider px-1">
            Past Incident & Maintenance History
          </h3>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <Clock className="w-4 h-4 text-accent" />
              <span>October 2026</span>
            </div>

            <div className="p-4 rounded-xl bg-card-secondary/60 border border-border space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Scheduled Hypervisor Kernel Patch</span>
                <span className="font-mono text-emerald-400 text-[11px]">COMPLETED</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Applied zero-downtime microcode security patch across Frankfurt (FRA-01) hypervisor cluster. 
                All customer KVM instances migrated live with 0 packet loss.
              </p>
              <div className="text-[10px] text-muted-foreground font-mono pt-1">
                Completed on Oct 28, 2026 - 03:15 UTC
              </div>
            </div>

            <div className="text-center py-3 text-xs text-muted font-mono">
              No service disruptions reported within the last 90 days.
            </div>
          </div>
        </div>

        {/* Subscribe & Need Help Banner */}
        <div className="p-6 rounded-2xl bg-card-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-foreground">Experience an issue?</div>
            <div className="text-xs text-muted mt-0.5">
              Open a high-priority ticket with our 24/7 NetOps team via Discord or the Web Console.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition"
            >
              Discord Support
            </a>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-black text-xs font-bold transition shadow-glow"
            >
              Open Console Ticket
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted bg-[#070A11]">
        <div className="max-w-5xl mx-auto px-4">
          © {new Date().getFullYear()} Cavrix Cloud Infrastructure Inc. All telemetry metrics refreshed live.
        </div>
      </footer>
    </div>
  );
}

