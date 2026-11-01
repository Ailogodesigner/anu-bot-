"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Server,
  Hash,
  Shield,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck,
  LayoutTemplate,
  MessageSquare,
} from "lucide-react";

interface GuildConfigData {
  guildId: string;
  guildName: string;
  prefix: string;
  ticketCategoryId: string | null;
  transcriptChannelId: string | null;
  auditLogChannelId: string | null;
  announcementChannelId: string | null;
  adminRoleId: string | null;
  supportRoleId: string | null;
  escalationRoleId: string | null;
  maxTicketsPerUser: number;
  autoCloseHours: number;
  enableAiSupport: boolean;
  aiEscalationSensitivity: string;
  // Welcome
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeTitle: string | null;
  welcomeMessage: string | null;
  welcomeBannerUrl: string | null;
  welcomeThumbnailUrl: string | null;
  welcomeColor: string;
  autoRoleId: string | null;
  // Ticket Panel
  ticketPanelTitle: string | null;
  ticketPanelDescription: string | null;
  ticketPanelColor: string;
  ticketPanelChannelId: string | null;
}

export default function ServerConfigPage() {
  const [config, setConfig] = useState<GuildConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dispatch states
  const [dispatchingPanel, setDispatchingPanel] = useState(false);
  const [dispatchPanelSuccess, setDispatchPanelSuccess] = useState(false);
  const [testingWelcome, setTestingWelcome] = useState(false);
  const [testWelcomeSuccess, setTestWelcomeSuccess] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig(data.guildConfig);
    } catch (err) {
      console.error("Config fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchPanel = async () => {
    if (!config?.ticketPanelChannelId && !config?.transcriptChannelId) {
      alert("Please configure a Ticket Panel Channel ID below first.");
      return;
    }
    setDispatchingPanel(true);
    try {
      const res = await fetch("/api/config/dispatch-panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: config.ticketPanelChannelId,
          title: config.ticketPanelTitle,
          description: config.ticketPanelDescription,
          color: config.ticketPanelColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchPanelSuccess(true);
        setTimeout(() => setDispatchPanelSuccess(false), 4000);
      } else {
        alert(data.error || "Failed to dispatch panel to Discord");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDispatchingPanel(false);
    }
  };

  const handleTestWelcome = async () => {
    if (!config?.welcomeChannelId) {
      alert("Please configure a Welcome Channel ID below first.");
      return;
    }
    setTestingWelcome(true);
    try {
      const res = await fetch("/api/config/test-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: config.welcomeChannelId,
          title: config.welcomeTitle,
          message: config.welcomeMessage,
          color: config.welcomeColor,
          bannerUrl: config.welcomeBannerUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestWelcomeSuccess(true);
        setTimeout(() => setTestWelcomeSuccess(false), 4000);
      } else {
        alert(data.error || "Failed to send test welcome embed");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTestingWelcome(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="p-8 text-center text-xs text-muted flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
        <span>Loading server configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0D0D10] border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-accent/15 border border-accent/40 text-accent font-bold">
              CORE SERVER ARCHITECTURE
            </span>
            <span className="text-[11px] font-mono text-muted">Server ID: {config.guildId}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Prefixes, Ticket Panels & Welcome Embeds</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Configure custom bot prefixes, design and dispatch interactive ticket button panels, and personalize welcome embeds for new members.
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved to Database</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Command Prefix & Identity */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Server className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Command Prefix & Bot Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Command Prefix *</label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={config.prefix || "!"}
                  onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white text-sm font-mono font-bold focus:outline-none focus:border-accent text-accent"
                />
              </div>
              <p className="text-[11px] text-muted mt-1">Commands trigger via {config.prefix || "!"}help, {config.prefix || "!"}ticket, {config.prefix || "!"}pay, etc.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Server Name</label>
              <input
                type="text"
                value={config.guildName}
                onChange={(e) => setConfig({ ...config, guildName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Server ID</label>
              <input
                type="text"
                disabled
                value={config.guildId}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-muted font-mono text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Ticket Panel Customization & Live Dispatch */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Support Ticket Desk Panel Customizer
              </h2>
            </div>

            <button
              type="button"
              onClick={handleDispatchPanel}
              disabled={dispatchingPanel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-black font-bold text-xs hover:bg-accent-hover transition shadow-glow self-start sm:self-auto"
            >
              <Send className={`w-3.5 h-3.5 ${dispatchingPanel ? "animate-pulse" : ""}`} />
              <span>{dispatchingPanel ? "Dispatching..." : "Dispatch Panel to Discord"}</span>
            </button>
          </div>

          {dispatchPanelSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ticket button panel dispatched successfully to Discord text channel!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Controls */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Panel Embed Title</label>
                <input
                  type="text"
                  value={config.ticketPanelTitle || ""}
                  onChange={(e) => setConfig({ ...config, ticketPanelTitle: e.target.value })}
                  placeholder="🎫 Cavrix Cloud Support Desk"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Panel Description & Instructions</label>
                <textarea
                  rows={3}
                  value={config.ticketPanelDescription || ""}
                  onChange={(e) => setConfig({ ...config, ticketPanelDescription: e.target.value })}
                  placeholder="Click a button below to open a private ticket with our team..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Panel Embed Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.ticketPanelColor || "#D4AF37"}
                      onChange={(e) => setConfig({ ...config, ticketPanelColor: e.target.value })}
                      className="w-8 h-8 rounded border border-border bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.ticketPanelColor || "#D4AF37"}
                      onChange={(e) => setConfig({ ...config, ticketPanelColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Target Discord Channel ID</label>
                  <input
                    type="text"
                    value={config.ticketPanelChannelId || ""}
                    onChange={(e) => setConfig({ ...config, ticketPanelChannelId: e.target.value })}
                    placeholder="e.g. 1507025172845297744"
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Discord Accurate Embed Preview */}
            <div className="p-4 rounded-xl bg-[#050505] border border-border/80 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2 block">
                Discord Live Embed Preview
              </span>

              <div
                className="p-4 rounded-lg bg-[#0D0D10] border-l-4 space-y-2.5 shadow-inner"
                style={{ borderLeftColor: config.ticketPanelColor || "#D4AF37" }}
              >
                <h4 className="text-sm font-bold text-white">
                  {config.ticketPanelTitle || "🎫 Cavrix Cloud Support Desk"}
                </h4>
                <p className="text-xs text-muted whitespace-pre-wrap">
                  {config.ticketPanelDescription ||
                    "Select a department below to create a secure 1-on-1 support ticket."}
                </p>

                <div className="space-y-1.5 text-[11px] pt-1 border-t border-border/40">
                  <div>
                    <span className="font-semibold text-white">🛒 Buy</span>
                    <p className="text-muted text-[10px]">Purchase VPS hosting, dedicated server nodes & custom upgrades</p>
                  </div>
                  <div>
                    <span className="font-semibold text-white">💬 Support</span>
                    <p className="text-muted text-[10px]">General questions, billing assistance, and account guidance</p>
                  </div>
                  <div>
                    <span className="font-semibold text-white">🎁 Claim</span>
                    <p className="text-muted text-[10px]">Claim giveaway prizes, event rewards, invite perks & VIP roles</p>
                  </div>
                  <div>
                    <span className="font-semibold text-white">⚙️ Technical Issues</span>
                    <p className="text-muted text-[10px]">DDoS mitigation, latency, SSH access & server troubleshooting</p>
                  </div>
                  <div>
                    <span className="font-semibold text-white">📢 Promotion</span>
                    <p className="text-muted text-[10px]">Partnership inquiries, sponsorships, bot invites & collabs</p>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-muted font-mono border-t border-border/60">
                  Cavrix Cloud Operations • 24/7 SLA Protected
                </div>
              </div>

              {/* Interactive 5-Button Mockup */}
              <div className="flex flex-wrap gap-1.5 pt-3">
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-default flex items-center gap-1 shadow-subtle"
                >
                  <span>🛒</span>
                  <span>Buy</span>
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs cursor-default flex items-center gap-1 shadow-subtle"
                >
                  <span>💬</span>
                  <span>Support</span>
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-xs cursor-default flex items-center gap-1 shadow-subtle"
                >
                  <span>🎁</span>
                  <span>Claim</span>
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs cursor-default flex items-center gap-1 shadow-subtle"
                >
                  <span>⚙️</span>
                  <span>Technical Issues</span>
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-xs cursor-default flex items-center gap-1 shadow-subtle"
                >
                  <span>📢</span>
                  <span>Promotion</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Embedded Welcome Messages */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Embedded Welcome Messages
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestWelcome}
                disabled={testingWelcome}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-accent/40 text-white font-medium text-xs hover:border-accent transition"
              >
                <span>{testingWelcome ? "Sending..." : "Send Test Welcome"}</span>
              </button>
              <label className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.welcomeEnabled}
                  onChange={(e) => setConfig({ ...config, welcomeEnabled: e.target.checked })}
                  className="rounded border-border bg-[#050505] text-accent focus:ring-accent"
                />
                <span>Enabled</span>
              </label>
            </div>
          </div>

          {testWelcomeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Test welcome embed sent to Discord channel!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Welcome Title</label>
                <input
                  type="text"
                  value={config.welcomeTitle || ""}
                  onChange={(e) => setConfig({ ...config, welcomeTitle: e.target.value })}
                  placeholder="Welcome to Cavrix Cloud"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-1 block">
                  Greeting Message Body (Supports <code>{`{user}`}</code>, <code>{`{username}`}</code>, <code>{`{server}`}</code>, <code>{`{memberCount}`}</code>)
                </label>
                <textarea
                  rows={3}
                  value={config.welcomeMessage || ""}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  placeholder="Welcome {user} to {server}! Please read the rules and verify."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Welcome Channel ID</label>
                  <input
                    type="text"
                    value={config.welcomeChannelId || ""}
                    onChange={(e) => setConfig({ ...config, welcomeChannelId: e.target.value })}
                    placeholder="e.g. 1507025172845297744"
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted mb-1 block">Auto-Assign Role ID</label>
                  <input
                    type="text"
                    value={config.autoRoleId || ""}
                    onChange={(e) => setConfig({ ...config, autoRoleId: e.target.value })}
                    placeholder="Optional Role ID"
                    className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Welcome Banner Image URL</label>
                <input
                  type="url"
                  value={config.welcomeBannerUrl || ""}
                  onChange={(e) => setConfig({ ...config, welcomeBannerUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#050505] border border-border text-white text-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Welcome Embed Preview */}
            <div className="p-4 rounded-xl bg-[#050505] border border-border/80 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2 block">
                Welcome Embed Preview
              </span>

              <div
                className="p-4 rounded-lg bg-[#0D0D10] border-l-4 space-y-2 shadow-inner"
                style={{ borderLeftColor: config.welcomeColor || "#D4AF37" }}
              >
                <h4 className="text-sm font-bold text-white">
                  {config.welcomeTitle || "Welcome to Cavrix Cloud"}
                </h4>
                <p className="text-xs text-muted whitespace-pre-wrap">
                  {(config.welcomeMessage || "Welcome {user} to {server}!")
                    .replace(/{user}/g, "@NewMember")
                    .replace(/{username}/g, "NewMember")
                    .replace(/{server}/g, config.guildName || "Cavrix Cloud")
                    .replace(/{memberCount}/g, "1,248")}
                </p>

                {config.welcomeBannerUrl && (
                  <div className="pt-2">
                    <img
                      src={config.welcomeBannerUrl}
                      alt="Banner Preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="pt-2 text-[10px] text-muted font-mono border-t border-border/60">
                  {config.guildName || "Cavrix Cloud"} • Member #1,248
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Routing Channels & Escalation Guardrails */}
        <div className="p-6 rounded-2xl bg-[#0D0D10] border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Hash className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Discord Channel Routing & Guardrails
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Ticket Category ID</label>
              <input
                type="text"
                value={config.ticketCategoryId || ""}
                onChange={(e) => setConfig({ ...config, ticketCategoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Transcripts Channel ID</label>
              <input
                type="text"
                value={config.transcriptChannelId || ""}
                onChange={(e) => setConfig({ ...config, transcriptChannelId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Audit Logs Channel ID</label>
              <input
                type="text"
                value={config.auditLogChannelId || ""}
                onChange={(e) => setConfig({ ...config, auditLogChannelId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Max Tickets Per Customer</label>
              <input
                type="number"
                min={1}
                max={10}
                value={config.maxTicketsPerUser}
                onChange={(e) => setConfig({ ...config, maxTicketsPerUser: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Auto-Close Inactive Tickets (Hours)</label>
              <input
                type="number"
                min={1}
                value={config.autoCloseHours}
                onChange={(e) => setConfig({ ...config, autoCloseHours: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#050505] border border-border text-white font-mono text-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-black font-bold text-xs hover:bg-accent-hover transition shadow-glow"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Server Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
