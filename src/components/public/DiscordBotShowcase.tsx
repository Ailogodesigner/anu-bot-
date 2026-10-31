"use client";

import React, { useState } from "react";
import {
  Bot,
  Ticket,
  ShieldCheck,
  Megaphone,
  Sparkles,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Clock,
  Send,
} from "lucide-react";

interface BotFeature {
  id: string;
  title: string;
  badge: string;
  icon: any;
  desc: string;
  points: string[];
  discordPreview: {
    channel: string;
    botTitle: string;
    botDesc: string;
    fields: { name: string; value: string; inline?: boolean }[];
    footer: string;
    buttons: { label: string; style: "primary" | "secondary" | "danger" | "success" }[];
  };
}

const BOT_FEATURES: BotFeature[] = [
  {
    id: "tickets",
    title: "Instant Ticket SLA & Queue Dispatch",
    badge: "CORE ENGINE",
    icon: Ticket,
    desc: "Clients open support tickets with a single click. The bot categorizes requests, calculates priority, and monitors SLA response timers in real time.",
    points: [
      "Zero-lag private channel creation under 200ms",
      "Automated staff assignment & round-robin dispatch",
      "Built-in 30-minute SLA response timer with escalation alerts",
      "1-Click HTML transcript export stored securely in Web Console",
    ],
    discordPreview: {
      channel: "ticket-0149-vps-reboot",
      botTitle: "🎫 Cavrix Cloud Support Ticket #0149",
      botDesc: "Thank you for reaching out to Cavrix Cloud NetOps. A support engineer has been notified.",
      fields: [
        { name: "Client", value: "@AlexDev", inline: true },
        { name: "Category", value: "🛠️ Technical Issue", inline: true },
        { name: "SLA Response Target", value: "⏱️ < 15 minutes", inline: true },
        { name: "Node / Instance", value: "FRA01-KVM-9482", inline: true },
        { name: "Status", value: "🟡 Awaiting Staff Claim", inline: true },
      ],
      footer: "Cavrix Cloud Gateway • SLA Protected",
      buttons: [
        { label: "Claim Ticket", style: "primary" },
        { label: "AI Troubleshoot", style: "success" },
        { label: "Close Ticket", style: "danger" },
      ],
    },
  },
  {
    id: "ai_kb",
    title: "AI First Responder & Knowledge Base",
    badge: "AI AUGMENTED",
    icon: Bot,
    desc: "Trained on your knowledge base to provide instant technical answers for SSH connectivity, DNS, firewall rules, and billing queries 24/7.",
    points: [
      "Instant 2-second resolution for 70%+ common technical issues",
      "Seamless escalation to human engineers if sentiment drops",
      "Continuous learning directly from staff-resolved ticket notes",
      "Multi-provider LLM fallback (Claude 3.5 Sonnet / OpenAI GPT-4o)",
    ],
    discordPreview: {
      channel: "ticket-0149-vps-reboot",
      botTitle: "🤖 Cavrix AI Technical Diagnostics",
      botDesc: "I analyzed your issue with SSH Port 22 connectivity on Ubuntu 24.04:",
      fields: [
        {
          name: "Diagnosis",
          value: "UFW firewall may be active without port 22 explicitly allowed in iptables.",
          inline: false,
        },
        {
          name: "Recommended Fix",
          value: "`sudo ufw allow 22/tcp && sudo systemctl restart ssh`",
          inline: false,
        },
        {
          name: "Did this resolve your issue?",
          value: "Click 'Resolved' or 'Escalate to Human Staff'.",
          inline: false,
        },
      ],
      footer: "Cavrix AI Knowledge Engine • Latency: 420ms",
      buttons: [
        { label: "Mark as Resolved", style: "success" },
        { label: "Escalate to Human Staff", style: "secondary" },
      ],
    },
  },
  {
    id: "security",
    title: "1-Click Guild Verification & Security",
    badge: "ZERO TRUST",
    icon: ShieldCheck,
    desc: "Keep your Discord community clean from spam bots, raids, and unauthorized users with encrypted 1-click button verification.",
    points: [
      "Automatic Discord role synchronization for active VPS clients",
      "Rate-limited button interactions to eliminate raid attempts",
      "Full audit trail logged to private staff channel & web dashboard",
    ],
    discordPreview: {
      channel: "verify-here",
      botTitle: "🛡️ Cavrix Cloud Security Verification",
      botDesc: "Welcome to the official Cavrix Cloud community! Click below to verify your account and gain access to client channels.",
      fields: [
        { name: "Anti-Raid Shield", value: "🟢 Level 3 Active", inline: true },
        { name: "Active Members", value: "👥 4,892 Verified", inline: true },
      ],
      footer: "Cavrix Cloud Security Shield • Zero Trust Policy",
      buttons: [{ label: "Verify Account", style: "primary" }],
    },
  },
  {
    id: "announcements",
    title: "Automated Maintenance & Promo Dispatcher",
    badge: "WEB TO DISCORD",
    icon: Megaphone,
    desc: "Design rich Discord embeds on the Web Console and dispatch or schedule announcements with multi-channel broadcast.",
    points: [
      "Live visual embed builder with instant preview",
      "Two-person approval workflow for critical infrastructure alerts",
      "Scheduled publishing with automated rollback safeguards",
    ],
    discordPreview: {
      channel: "announcements",
      botTitle: "📢 Scheduled Maintenance: Frankfurt Node FRA-01",
      botDesc: "We are upgrading kernel drivers on the FRA-01 hypervisor cluster to boost NVMe throughput by 18%.",
      fields: [
        { name: "Window", value: "Nov 02, 02:00 - 02:30 UTC", inline: true },
        { name: "Expected Downtime", value: "< 90 seconds", inline: true },
        { name: "Impacted VMs", value: "KVM-FRA-1000 to 1400", inline: false },
      ],
      footer: "Cavrix Cloud NetOps Dispatcher • Priority Notice",
      buttons: [
        { label: "Check Node Status", style: "secondary" },
        { label: "Subscribe to Updates", style: "primary" },
      ],
    },
  },
];

export default function DiscordBotShowcase() {
  const [activeTab, setActiveTab] = useState<string>("tickets");

  const activeFeature = BOT_FEATURES.find((f) => f.id === activeTab) || BOT_FEATURES[0];

  return (
    <section id="bot" className="py-20 md:py-28 bg-[#090D15] border-b border-border/80 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wider uppercase">
            <Bot className="w-3.5 h-3.5" />
            Discord Automation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Complete Discord Bot & <span className="text-gradient">Web Console Synergy</span>
          </h2>
          <p className="text-muted text-sm sm:text-base">
            No fragmented tools. Everything that happens in your Discord server—tickets, AI replies, 
            verifications, and announcements—synchronizes seamlessly with the Cavrix Cloud Web Console.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Feature Tabs Selector (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {BOT_FEATURES.map((feature) => {
              const isSelected = activeTab === feature.id;
              const Icon = feature.icon;

              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? "bg-card border-accent shadow-glow"
                      : "bg-card/40 border-border hover:border-accent/40 hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                          isSelected
                            ? "bg-accent text-black font-bold"
                            : "bg-card-secondary text-accent border border-border"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent-light border border-accent/20">
                      {feature.badge}
                    </span>
                  </div>

                  <p className="text-xs text-muted mt-2 leading-relaxed">{feature.desc}</p>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                      {feature.points.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Discord Live UI Preview Mockup (Right 7 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-[#313338] shadow-2xl overflow-hidden text-slate-200">
              {/* Discord Top Window Bar */}
              <div className="bg-[#1E1F22] px-4 py-3 border-b border-[#111214] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                  <span className="text-slate-400 font-mono text-sm">#</span>
                  <span>{activeFeature.discordPreview.channel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] text-slate-400 font-mono">Gateway Ping: 18ms</span>
                </div>
              </div>

              {/* Chat Message Content */}
              <div className="p-6 space-y-4">
                {/* Bot Profile Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-subtle">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">Cavrix Cloud Bot</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-white text-[10px] font-bold uppercase tracking-wider">
                        BOT
                      </span>
                      <span className="text-[11px] text-slate-400">Today at 12:44 PM</span>
                    </div>

                    {/* Discord Embed Box */}
                    <div className="mt-3 rounded-lg bg-[#2B2D31] border-l-4 border-l-[#06B6D4] p-4 text-xs space-y-3 max-w-xl">
                      <div className="font-bold text-sm text-white">
                        {activeFeature.discordPreview.botTitle}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {activeFeature.discordPreview.botDesc}
                      </p>

                      {/* Embed Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {activeFeature.discordPreview.fields.map((f, i) => (
                          <div
                            key={i}
                            className={f.inline === false ? "sm:col-span-2" : "col-span-1"}
                          >
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                              {f.name}
                            </span>
                            <span className="text-xs text-white font-medium">{f.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Embed Footer */}
                      <div className="pt-2 border-t border-[#3F4147] text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{activeFeature.discordPreview.footer}</span>
                        <span className="font-mono">ID: 894120938</span>
                      </div>
                    </div>

                    {/* Discord Action Row Buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeFeature.discordPreview.buttons.map((btn, i) => {
                        let btnColor = "bg-[#4E5058] hover:bg-[#6D6F78] text-white";
                        if (btn.style === "primary") btnColor = "bg-[#5865F2] hover:bg-[#4752C4] text-white";
                        if (btn.style === "success") btnColor = "bg-[#248046] hover:bg-[#1A6334] text-white";
                        if (btn.style === "danger") btnColor = "bg-[#DA373C] hover:bg-[#A12828] text-white";

                        return (
                          <button
                            key={i}
                            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition ${btnColor}`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Integration Notice */}
                <div className="mt-4 p-3 rounded-lg bg-[#232428] border border-[#35363C] text-[11px] text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Real-time bidirectional synchronization with Web Console active</span>
                  </div>
                  <span className="font-mono text-cyan-400">REST + Gateway</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
