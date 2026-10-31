"use client";

import React from "react";
import { Star, ShieldCheck, Quote, CheckCircle2, Server, Users } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  node: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcus Vance",
    role: "Lead Systems Architect",
    company: "Nexus Protocol",
    avatar: "MV",
    rating: 5,
    text: "We migrated our production Discord bot fleet and API nodes to Cavrix Cloud in Frankfurt. The zero-lag NVMe I/O and Path.net DDoS filtering handled over 18 million requests during our latest launch without dropping a single packet.",
    node: "Frankfurt EPYC 8-Core",
  },
  {
    name: "Elena Rostova",
    role: "Community Ops Director",
    company: "Aetheria Gaming Network",
    avatar: "ER",
    rating: 5,
    text: "The integration between the Discord bot and the Web Console is unmatched. Our moderators handle tickets in Discord while our billing team manages escalations on the Web Console. Response time dropped from 45 minutes to under 3 minutes.",
    node: "London Ryzen 9 7950X",
  },
  {
    name: "Devon Zhang",
    role: "Founder & Full-Stack Dev",
    company: "ByteScale Analytics",
    avatar: "DZ",
    rating: 5,
    text: "True bare-metal performance inside KVM virtualization. The 7,000 MB/s NVMe read speeds shaved our PostgreSQL query times in half. Plus, automatic daily snapshots give us complete peace of mind.",
    node: "Singapore EPYC 4-Core",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-[#090D15] border-b border-border/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wider uppercase">
            <Users className="w-3.5 h-3.5" />
            Proven Reliability
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Trusted by Discord Communities & <span className="text-gradient">DevOps Teams</span>
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Over 2,400+ active virtual instances powered by Cavrix Cloud hardware across 4 continents.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-6 md:p-8 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-subtle hover:border-accent/40 transition"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center font-bold text-xs">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{t.name}</div>
                    <div className="text-[11px] text-muted">{t.role}, {t.company}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-card-secondary text-accent-light border border-border">
                  {t.node}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Datacenter Compliance & Security Badges Row */}
        <div className="mt-14 p-6 rounded-2xl bg-card/40 border border-border flex flex-wrap items-center justify-around gap-6 text-center">
          <div className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-foreground font-semibold">Tier-IV Redundant Power</span>
            <span>(2N+1 UPS)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-foreground font-semibold">ISO 27001 & SOC-2</span>
            <span>Type II Audited</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-foreground font-semibold">100% Renewable Energy</span>
            <span>(PUE &lt; 1.15)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-accent-light" />
            <span className="text-foreground font-semibold">Financial SLA Guarantee</span>
            <span>(99.99%)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
