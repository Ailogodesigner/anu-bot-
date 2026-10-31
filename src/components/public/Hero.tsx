"use client";

import React from "react";
import Link from "next/link";
import {
  Server,
  Zap,
  Shield,
  Activity,
  Cpu,
  ArrowRight,
  Terminal,
  CheckCircle2,
  Sparkles,
  Globe2,
  HardDrive,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/60 bg-grid-pattern bg-radial-gradient">
      {/* Ambient background blur spheres */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[300px] bg-accent-light/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Live Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border shadow-subtle text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-foreground font-semibold">Tier-IV Datacenters</span>
            <span className="text-border">|</span>
            <span className="text-accent-light font-mono text-[11px]">99.99% Uptime Guarantee</span>
            <span className="text-border">|</span>
            <span className="text-muted">10 Gbps Anti-DDoS</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Ultra-Performance <span className="text-gradient">Cloud VPS</span>.
            <br />
            Powered by <span className="text-accent-light">Smart Discord Bot</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Deploy dedicated AMD EPYC™ & Ryzen 9 KVM VPS with lightning-fast NVMe storage, 
            instant automated provisioning, and a battle-tested 24/7 AI-augmented Discord management bot.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="#calculator"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition shadow-glow"
            >
              <Zap className="w-4 h-4" />
              <span>Configure Your Cloud VPS</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-card hover:bg-card-secondary border border-border hover:border-accent/40 text-foreground font-semibold text-sm transition shadow-subtle"
            >
              <Terminal className="w-4 h-4 text-accent" />
              <span>Launch Staff Console</span>
            </Link>

            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] font-semibold text-sm transition"
            >
              <span>Join Discord</span>
              <span className="text-[10px] font-mono bg-[#5865F2]/20 px-2 py-0.5 rounded text-white">ONLINE</span>
            </a>
          </div>

          {/* Quick SLA features */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted pt-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span>Instant Setup (&lt; 60s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span>Path.net 2.5+ Tbps DDoS Shield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span>Full KVM Root Access</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              <span>7-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-accent/40 transition shadow-subtle">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold font-mono">Uptime SLA</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">99.99%</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Hardware & Network SLA</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-accent/40 transition shadow-subtle">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold font-mono">Processors</span>
              <Cpu className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">4.8 GHz+</div>
            <div className="text-[11px] text-muted-foreground mt-1">AMD EPYC™ 9004 & Ryzen 9</div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-accent/40 transition shadow-subtle">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold font-mono">Storage I/O</span>
              <HardDrive className="w-4 h-4 text-accent-light" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">7,000 MB/s</div>
            <div className="text-[11px] text-muted-foreground mt-1">Enterprise PCIe Gen4 NVMe</div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-border hover:border-accent/40 transition shadow-subtle">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold font-mono">DDoS Filter</span>
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">2.5+ Tbps</div>
            <div className="text-[11px] text-muted-foreground mt-1">Multi-Layer L3/L4/L7 Scrubbing</div>
          </div>
        </div>
      </div>
    </section>
  );
}
