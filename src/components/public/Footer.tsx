"use client";

import React from "react";
import Link from "next/link";
import { Server, MessageSquare, Terminal, Shield, Globe2, Activity, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#070A11] text-muted text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-glow">
                <Server className="w-5 h-5 text-accent" />
              </div>
              <div className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                <span>CAVRIX</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                  CLOUD
                </span>
              </div>
            </Link>

            <p className="text-xs text-muted max-w-sm leading-relaxed">
              Enterprise-grade AMD EPYC™ and Ryzen 9 KVM VPS with instant automated provisioning, 
              2.5+ Tbps Anycast Anti-DDoS, and 24/7 AI-augmented Discord management.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/status"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-mono text-emerald-400 hover:border-emerald-500/40 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>All Systems Operational (99.99%)</span>
              </Link>
            </div>
          </div>

          {/* Links Column 1: Compute */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Compute & VPS</div>
            <ul className="space-y-2">
              <li>
                <Link href="#pricing" className="hover:text-foreground transition">
                  Cloud VPS Plans
                </Link>
              </li>
              <li>
                <Link href="#calculator" className="hover:text-foreground transition">
                  Custom Spec Configurator
                </Link>
              </li>
              <li>
                <Link href="#bot" className="hover:text-foreground transition">
                  Discord Bot Features
                </Link>
              </li>
              <li>
                <Link href="#network" className="hover:text-foreground transition">
                  Anti-DDoS Shield (2.5T)
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition">
                  OS Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Datacenters */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Datacenters</div>
            <ul className="space-y-2">
              <li>
                <span className="hover:text-foreground transition cursor-pointer">
                  Frankfurt, Germany (FRA-01)
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition cursor-pointer">
                  London, UK (LON-01)
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition cursor-pointer">
                  New York, USA (NYC-01)
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition cursor-pointer">
                  Singapore, APAC (SIN-01)
                </span>
              </li>
              <li>
                <Link href="#network" className="hover:text-foreground transition">
                  Looking Glass & Ping
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Platform */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Console & Legal</div>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-foreground transition text-accent">
                  Client & Staff Portal
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-foreground transition">
                  System Status Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Discord Community</span>
                </a>
              </li>
              <li>
                <span className="hover:text-foreground transition cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-foreground transition cursor-pointer">
                  Privacy Policy & SLA
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Cavrix Cloud Infrastructure Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">Security: Tier-IV Audited</span>
            <span>•</span>
            <span className="font-mono">SLA: 99.99% Financial Backed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
