"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Globe,
  Lock,
  Layers,
  FileCode2,
} from "lucide-react";

interface HostingInfo {
  system: {
    platform: string;
    release: string;
    nodeVersion: string;
    uptimeSeconds: number;
    hostname: string;
    cpus: number;
    totalMemoryMB: number;
    freeMemoryMB: number;
  };
  process: {
    pid: number;
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    port: string | number;
    appUrl: string;
  };
  discord: {
    connected: boolean;
    botTag: string;
    botId: string;
    guildId: string;
    guildName: string;
    pingMs: number;
    inviteUrl: string;
  };
  database: {
    type: string;
    status: string;
    totalTickets: number;
    totalStaff: number;
  };
}

export default function HostingPage() {
  const [data, setData] = useState<HostingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedScriptTab, setSelectedScriptTab] = useState<"pm2" | "linux" | "docker" | "systemd" | "nginx">("pm2");

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hosting");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 15000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const formatUptime = (totalSeconds: number) => {
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const scriptSnippets = {
    pm2: `# 1. Install PM2 process manager globally
npm install -g pm2

# 2. Build production assets
npm run build

# 3. Launch with PM2 (automatic restart on reboot/crash)
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Monitor live logs:
pm2 logs cavrix-bot-dashboard`,

    linux: `# 1. Make startup scripts executable
chmod +x start.sh deploy.sh

# 2. 1-Click Launch (installs dependencies, builds & starts)
./start.sh

# 3. Whenever you push updates to GitHub, run:
./deploy.sh`,

    docker: `# Run completely isolated in Docker container
docker compose up -d --build

# View container logs:
docker compose logs -f

# Stop container:
docker compose down`,

    systemd: `# 1. Copy the systemd service file
sudo cp cavrix-bot.service /etc/systemd/system/

# 2. Reload daemon and start service
sudo systemctl daemon-reload
sudo systemctl enable cavrix-bot
sudo systemctl start cavrix-bot

# 3. Check status & logs
sudo systemctl status cavrix-bot
journalctl -u cavrix-bot -f`,

    nginx: `# /etc/nginx/sites-available/cavrix-panel
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-accent" />
              Self-Hosting & Automation Center
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent border border-accent/30">
              OWNER PORTAL
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            24/7 VPS deployment commands, process management, PM2 scripts, and live system metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:border-accent/40 text-xs text-muted hover:text-foreground transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>

          {data?.discord.inviteUrl && (
            <a
              href={data.discord.inviteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-light text-black font-bold text-xs transition shadow-subtle"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Bot Invite Link</span>
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gateway State */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium">Bot Gateway</span>
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
          <div className="text-lg font-bold text-foreground font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span>{data?.discord.connected ? "ONLINE & SYNCED" : "CONNECTING..."}</span>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/60">
            <span>Server: {data?.discord.guildName || "Cavrix Core"}</span>
            <span className="font-mono text-accent">{data?.discord.pingMs || 0}ms ping</span>
          </div>
        </div>

        {/* Process Uptime */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium">Process Uptime</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="text-lg font-bold text-foreground font-mono">
            {data ? formatUptime(data.system.uptimeSeconds) : "..."}
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/60">
            <span>PID: {data?.process.pid || "..."}</span>
            <span className="font-mono text-foreground">Port {data?.process.port || 3005}</span>
          </div>
        </div>

        {/* Memory RSS */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium">Memory Allocation</span>
            <HardDrive className="w-4 h-4 text-accent" />
          </div>
          <div className="text-lg font-bold text-foreground font-mono flex items-baseline gap-1.5">
            <span>{data?.process.rssMB || 0} MB</span>
            <span className="text-[11px] text-muted font-normal">/ {data?.system.totalMemoryMB || 0} MB Total</span>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/60">
            <span>Heap Used: {data?.process.heapUsedMB || 0} MB</span>
            <span className="font-mono text-accent">Node {data?.system.nodeVersion || "..."}</span>
          </div>
        </div>

        {/* Database & Records */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-accent/40 transition">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium">Local Database</span>
            <ShieldCheck className="w-4 h-4 text-accent" />
          </div>
          <div className="text-lg font-bold text-foreground font-mono">
            {data?.database.totalTickets || 0} Tickets Logged
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1 border-t border-border/60">
            <span>Staff Count: {data?.database.totalStaff || 0}</span>
            <span className="font-mono text-accent">SQLite Engine</span>
          </div>
        </div>
      </div>

      {/* 24/7 Hosting Automation Guide */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" />
              1-Click Production Hosting Commands
            </h2>
            <p className="text-xs text-muted">
              Choose your hosting environment below to copy ready-to-run automation scripts for your VPS:
            </p>
          </div>

          <div className="flex flex-wrap gap-1 p-1 bg-card-secondary rounded-xl border border-border">
            {(["pm2", "linux", "docker", "systemd", "nginx"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedScriptTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  selectedScriptTab === tab
                    ? "bg-accent text-black font-bold shadow-subtle"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-xl bg-black border border-border p-4 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => copyToClipboard(scriptSnippets[selectedScriptTab], selectedScriptTab)}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card-secondary hover:bg-card border border-border text-[11px] text-foreground transition"
          >
            {copiedKey === selectedScriptTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-accent" />
                <span className="text-accent font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted" />
                <span>Copy Script</span>
              </>
            )}
          </button>
          <pre className="text-muted leading-relaxed whitespace-pre font-mono pr-20">
            {scriptSnippets[selectedScriptTab]}
          </pre>
        </div>
      </div>

      {/* Server Owner Credentials & Environment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Master Login Card */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              Owner Master Password Access
            </h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold">
              SECURITY ACTIVE
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Because this panel automatically directs to <code className="text-foreground">/dashboard</code>, you can log in directly using the Master Credentials configured in your host&apos;s <code className="text-foreground">.env</code>:
          </p>

          <div className="p-3.5 rounded-xl bg-card-secondary border border-border space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted">Master Username:</span>
              <span className="text-foreground font-bold">admin</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Master Passcode:</span>
              <span className="text-accent font-bold">cavrix@2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Direct Login Route:</span>
              <span className="text-foreground font-bold">/login</span>
            </div>
          </div>

          <div className="text-[11px] text-muted leading-relaxed">
            💡 To customize these credentials, edit <code className="text-foreground">ADMIN_USERNAME</code> and <code className="text-foreground">ADMIN_PASSWORD</code> inside your server&apos;s <code className="text-foreground">.env</code> file.
          </div>
        </div>

        {/* Discord Bot Direct Controls */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              Discord Gateway Integration
            </h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold">
              GUILD LOCKED
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Your bot gateway connects directly to Discord API on startup. You can run all administrative commands from within your Discord server:
          </p>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="p-2 rounded-lg bg-card-secondary border border-border flex items-center justify-between">
              <span className="text-accent">/admin setup</span>
              <span className="text-muted text-[11px]">Auto-configure channels</span>
            </div>
            <div className="p-2 rounded-lg bg-card-secondary border border-border flex items-center justify-between">
              <span className="text-accent">/admin panel</span>
              <span className="text-muted text-[11px]">Dispatch support desk</span>
            </div>
            <div className="p-2 rounded-lg bg-card-secondary border border-border flex items-center justify-between">
              <span className="text-accent">/admin purge 50</span>
              <span className="text-muted text-[11px]">Bulk message cleanup</span>
            </div>
            <div className="p-2 rounded-lg bg-card-secondary border border-border flex items-center justify-between">
              <span className="text-accent">/admin announce</span>
              <span className="text-muted text-[11px]">Broadcast gold notice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
