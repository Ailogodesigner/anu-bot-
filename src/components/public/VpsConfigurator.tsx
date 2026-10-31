"use client";

import React, { useState, useMemo } from "react";
import {
  Cpu,
  Server,
  Zap,
  HardDrive,
  Globe2,
  Check,
  ShieldCheck,
  ArrowRight,
  Flame,
  Info,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
} from "lucide-react";

interface PresetPlan {
  id: string;
  name: string;
  badge?: string;
  vCpu: number;
  ramGb: number;
  nvmeGb: number;
  bandwidthTb: number;
  monthlyPrice: number;
  popular?: boolean;
  features: string[];
}

const PRESET_PLANS: PresetPlan[] = [
  {
    id: "starter",
    name: "Cloud Nano",
    vCpu: 1,
    ramGb: 2,
    nvmeGb: 40,
    bandwidthTb: 2,
    monthlyPrice: 4.99,
    features: [
      "1 Dedicated AMD EPYC Core",
      "2 GB DDR5 ECC Memory",
      "40 GB NVMe Gen4 Storage",
      "2 TB High-Speed Bandwidth",
      "10 Gbps Path.net Anti-DDoS",
      "Automated Daily Snapshots",
    ],
  },
  {
    id: "bot_developer",
    name: "Developer & Bot",
    badge: "MOST POPULAR",
    popular: true,
    vCpu: 2,
    ramGb: 4,
    nvmeGb: 80,
    bandwidthTb: 5,
    monthlyPrice: 9.99,
    features: [
      "2 Dedicated AMD EPYC Cores",
      "4 GB DDR5 ECC Memory",
      "80 GB NVMe Gen4 Storage",
      "5 TB High-Speed Bandwidth",
      "Discord Bot 24/7 Zero Sleep",
      "Dedicated IPv4 + /64 IPv6",
      "Priority 15m Staff SLA",
    ],
  },
  {
    id: "pro_gaming",
    name: "Pro Gaming & Compute",
    badge: "HIGH PERFORMANCE",
    vCpu: 4,
    ramGb: 16,
    nvmeGb: 160,
    bandwidthTb: 10,
    monthlyPrice: 24.99,
    features: [
      "4 Ryzen 9 7950X / EPYC Cores",
      "16 GB High-Frequency DDR5",
      "160 GB Enterprise NVMe SSD",
      "10 TB Premium Tier-1 Transit",
      "L7 Advanced Gaming Anti-DDoS",
      "Custom rDNS & BGP Routing",
      "VIP Support Queue",
    ],
  },
  {
    id: "enterprise_cluster",
    name: "Enterprise Node",
    badge: "ENTERPRISE",
    vCpu: 8,
    ramGb: 32,
    nvmeGb: 320,
    bandwidthTb: 20,
    monthlyPrice: 49.99,
    features: [
      "8 High-Clock EPYC Cores",
      "32 GB Registered ECC RAM",
      "320 GB Gen4 Mirror NVMe",
      "20 TB Redundant Uplinks",
      "Custom Firewall Rules & VLAN",
      "Dedicated Technical Account Mgr",
      "99.99% Hardware Financial SLA",
    ],
  },
];

const LOCATIONS = [
  { id: "fra", city: "Frankfurt", country: "Germany", flag: "🇩🇪", ping: "4ms", status: "Optimal" },
  { id: "lon", city: "London", country: "United Kingdom", flag: "🇬🇧", ping: "7ms", status: "Optimal" },
  { id: "nyc", city: "New York", country: "United States", flag: "🇺🇸", ping: "14ms", status: "Optimal" },
  { id: "sin", city: "Singapore", country: "Asia-Pacific", flag: "🇸🇬", ping: "9ms", status: "Optimal" },
];

const OPERATING_SYSTEMS = [
  { id: "ubuntu", name: "Ubuntu 24.04 LTS", type: "Linux" },
  { id: "debian", name: "Debian 12 Bookworm", type: "Linux" },
  { id: "almalinux", name: "AlmaLinux 9 Enterprise", type: "Linux" },
  { id: "windows", name: "Windows Server 2022", type: "Windows", surcharge: 8 },
];

export default function VpsConfigurator() {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("bot_developer");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [selectedLocation, setSelectedLocation] = useState<string>("fra");
  const [selectedOs, setSelectedOs] = useState<string>("ubuntu");

  // Custom configuration sliders
  const [customCpu, setCustomCpu] = useState<number>(2);
  const [customRam, setCustomRam] = useState<number>(4);
  const [customNvme, setCustomNvme] = useState<number>(80);
  const [customBandwidth, setCustomBandwidth] = useState<number>(5);

  // Deploy modal state
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Calculate pricing
  const activePlan = useMemo(() => {
    return PRESET_PLANS.find((p) => p.id === selectedPlanId) || PRESET_PLANS[1];
  }, [selectedPlanId]);

  const customCalculatedPrice = useMemo(() => {
    // Formula: CPU ($2.5/core) + RAM ($1.2/GB) + NVMe ($0.08/GB) + Bandwidth ($0.4/TB)
    const base = customCpu * 2.5 + customRam * 1.2 + customNvme * 0.08 + customBandwidth * 0.4;
    return Math.max(4.99, Number(base.toFixed(2)));
  }, [customCpu, customRam, customNvme, customBandwidth]);

  const basePrice = mode === "preset" ? activePlan.monthlyPrice : customCalculatedPrice;
  const osSurcharge = OPERATING_SYSTEMS.find((os) => os.id === selectedOs)?.surcharge || 0;
  const subtotalMonthly = basePrice + osSurcharge;
  const finalPrice = billingCycle === "annually" ? subtotalMonthly * 0.8 : subtotalMonthly;

  const handleDeployClick = () => {
    setDeployModalOpen(true);
    setDeploySuccess(false);
  };

  const handleConfirmDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeploySuccess(true);
    }, 1200);
  };

  return (
    <section id="pricing" className="py-20 md:py-28 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wider uppercase">
            <Flame className="w-3.5 h-3.5" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Instant Deployment. <span className="text-gradient">Zero Hidden Fees</span>.
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Choose from battle-tested turn-key configurations or slide your custom resources.
            Every cloud VPS includes full root access, dedicated IPv4, and 10 Gbps Path.net mitigation.
          </p>

          {/* Mode & Billing Toggles */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Preset vs Custom toggle */}
            <div className="p-1 rounded-xl bg-card border border-border inline-flex items-center text-xs font-semibold">
              <button
                onClick={() => setMode("preset")}
                className={`px-4 py-2 rounded-lg transition ${
                  mode === "preset"
                    ? "bg-accent text-black font-bold shadow-subtle"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Curated Presets
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`px-4 py-2 rounded-lg transition ${
                  mode === "custom"
                    ? "bg-accent text-black font-bold shadow-subtle"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Custom Spec Sliders
              </button>
            </div>

            {/* Monthly vs Annual toggle */}
            <div className="p-1 rounded-xl bg-card border border-border inline-flex items-center text-xs font-semibold">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-lg transition ${
                  billingCycle === "monthly"
                    ? "bg-card-secondary text-foreground font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annually")}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  billingCycle === "annually"
                    ? "bg-card-secondary text-foreground font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span>Annually</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* PRESET PLANS GRID */}
        {mode === "preset" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRESET_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const planPrice =
                billingCycle === "annually" ? plan.monthlyPrice * 0.8 : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`cursor-pointer rounded-2xl p-6 transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-card border-2 border-accent shadow-glow scale-[1.02]"
                      : "bg-card/70 border border-border hover:border-accent/40 hover:bg-card"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-accent text-black font-extrabold text-[10px] uppercase tracking-wider shadow-subtle">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <div className="w-8 h-8 rounded-lg bg-card-secondary border border-border flex items-center justify-center text-accent">
                        <Cpu className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="mt-4 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-foreground">
                          ${planPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted">/ month</span>
                      </div>
                      {billingCycle === "annually" && (
                        <div className="text-[11px] text-emerald-400 mt-0.5 font-mono">
                          Billed ${(planPrice * 12).toFixed(2)} / year
                        </div>
                      )}
                    </div>

                    {/* Spec Chips */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-card-secondary/70 border border-border mb-6">
                      <div>
                        <span className="text-muted block text-[10px]">CPU</span>
                        <span className="text-foreground font-semibold">{plan.vCpu} vCPU</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">RAM</span>
                        <span className="text-foreground font-semibold">{plan.ramGb} GB DDR5</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">NVMe</span>
                        <span className="text-foreground font-semibold">{plan.nvmeGb} GB Gen4</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">PORT</span>
                        <span className="text-foreground font-semibold">{plan.bandwidthTb} TB @ 10G</span>
                      </div>
                    </div>

                    {/* Feature List */}
                    <ul className="space-y-2.5 text-xs text-muted mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanId(plan.id);
                      handleDeployClick();
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isSelected
                        ? "bg-accent hover:bg-accent-hover text-black shadow-glow"
                        : "bg-card-secondary hover:bg-border text-foreground border border-border"
                    }`}
                  >
                    <span>Deploy {plan.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* CUSTOM SLIDERS CONFIGURATOR */
          <div id="calculator" className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sliders column */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-foreground flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-accent" />
                      Dedicated AMD EPYC™ vCPU
                    </span>
                    <span className="font-mono text-accent-light px-2.5 py-0.5 rounded bg-accent/15 border border-accent/30">
                      {customCpu} Cores
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={customCpu}
                    onChange={(e) => setCustomCpu(Number(e.target.value))}
                    className="w-full h-2 bg-card-secondary rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[11px] text-muted font-mono mt-1">
                    <span>1 Core</span>
                    <span>4 Cores</span>
                    <span>8 Cores</span>
                    <span>16 Cores</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent" />
                      DDR5 High-Frequency ECC RAM
                    </span>
                    <span className="font-mono text-accent-light px-2.5 py-0.5 rounded bg-accent/15 border border-accent/30">
                      {customRam} GB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="64"
                    step="2"
                    value={customRam}
                    onChange={(e) => setCustomRam(Number(e.target.value))}
                    className="w-full h-2 bg-card-secondary rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[11px] text-muted font-mono mt-1">
                    <span>2 GB</span>
                    <span>16 GB</span>
                    <span>32 GB</span>
                    <span>64 GB</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-foreground flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-accent" />
                      Enterprise PCIe 4.0 NVMe Storage
                    </span>
                    <span className="font-mono text-accent-light px-2.5 py-0.5 rounded bg-accent/15 border border-accent/30">
                      {customNvme} GB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="800"
                    step="20"
                    value={customNvme}
                    onChange={(e) => setCustomNvme(Number(e.target.value))}
                    className="w-full h-2 bg-card-secondary rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[11px] text-muted font-mono mt-1">
                    <span>20 GB</span>
                    <span>200 GB</span>
                    <span>500 GB</span>
                    <span>800 GB</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-foreground flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-accent" />
                      High-Performance Tier-1 Bandwidth
                    </span>
                    <span className="font-mono text-accent-light px-2.5 py-0.5 rounded bg-accent/15 border border-accent/30">
                      {customBandwidth} TB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={customBandwidth}
                    onChange={(e) => setCustomBandwidth(Number(e.target.value))}
                    className="w-full h-2 bg-card-secondary rounded-lg appearance-none cursor-pointer accent-[#06B6D4]"
                  />
                  <div className="flex justify-between text-[11px] text-muted font-mono mt-1">
                    <span>1 TB</span>
                    <span>10 TB</span>
                    <span>20 TB</span>
                    <span>30 TB</span>
                  </div>
                </div>
              </div>

              {/* Real-time configuration summary box */}
              <div className="rounded-xl bg-card-secondary/70 border border-border p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
                    Custom Instance Summary
                  </h4>

                  <div className="space-y-3 text-xs mb-6">
                    <div className="flex justify-between text-muted pb-2 border-b border-border">
                      <span>Compute</span>
                      <span className="text-foreground font-mono font-semibold">{customCpu} AMD EPYC™ vCPU</span>
                    </div>
                    <div className="flex justify-between text-muted pb-2 border-b border-border">
                      <span>Memory</span>
                      <span className="text-foreground font-mono font-semibold">{customRam} GB DDR5 ECC</span>
                    </div>
                    <div className="flex justify-between text-muted pb-2 border-b border-border">
                      <span>NVMe Storage</span>
                      <span className="text-foreground font-mono font-semibold">{customNvme} GB Gen4</span>
                    </div>
                    <div className="flex justify-between text-muted pb-2 border-b border-border">
                      <span>Bandwidth</span>
                      <span className="text-foreground font-mono font-semibold">{customBandwidth} TB @ 10G</span>
                    </div>
                    <div className="flex justify-between text-muted pb-2 border-b border-border">
                      <span>Anti-DDoS</span>
                      <span className="text-emerald-400 font-mono font-semibold">2.5+ Tbps Path.net</span>
                    </div>
                    <div className="flex justify-between text-muted pb-2 border-b border-border">
                      <span>Dedicated IP</span>
                      <span className="text-foreground font-mono font-semibold">1x IPv4 + /64 IPv6</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs text-muted">Estimated Investment:</div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-extrabold text-foreground">
                        ${finalPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted">/ month</span>
                    </div>
                    {billingCycle === "annually" && (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Includes 20% annual discount
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleDeployClick}
                  className="mt-6 w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Deploy Custom Instance</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Datacenter & OS Selector Bar */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datacenter selection */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-accent" />
                Select Datacenter Region
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">All Regions Operational</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {LOCATIONS.map((loc) => {
                const isSelected = selectedLocation === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? "bg-accent/10 border-accent text-foreground"
                        : "bg-card-secondary border-border text-muted hover:border-accent/40"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>{loc.flag}</span>
                        <span>{loc.city}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{loc.country}</div>
                    </div>
                    <span className="text-[11px] font-mono text-accent-light px-1.5 py-0.5 rounded bg-accent/15 border border-accent/20">
                      {loc.ping}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operating System selection */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                Select Operating System
              </span>
              <span className="text-[11px] text-muted font-mono">1-Click Auto Install</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {OPERATING_SYSTEMS.map((os) => {
                const isSelected = selectedOs === os.id;
                return (
                  <button
                    key={os.id}
                    onClick={() => setSelectedOs(os.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? "bg-accent/10 border-accent text-foreground"
                        : "bg-card-secondary border-border text-muted hover:border-accent/40"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-foreground">{os.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {os.surcharge ? `+$${os.surcharge}/mo license` : "Included Free"}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DEPLOY MODAL */}
      {deployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0F131D] border border-border rounded-2xl shadow-2xl p-6 md:p-8 relative">
            <button
              onClick={() => setDeployModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card"
            >
              <X className="w-5 h-5" />
            </button>

            {!deploySuccess ? (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-[10px] uppercase">
                    Order Confirmation
                  </div>
                  <h3 className="text-xl font-bold text-foreground mt-2">Deploy Cloud Instance</h3>
                  <p className="text-xs text-muted">
                    Review your node parameters before provisioning begins.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Configuration:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {mode === "preset" ? activePlan.name : "Custom Scaled VPS"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Compute & Memory:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {mode === "preset"
                        ? `${activePlan.vCpu} vCPU / ${activePlan.ramGb} GB RAM`
                        : `${customCpu} vCPU / ${customRam} GB RAM`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Storage:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {mode === "preset" ? `${activePlan.nvmeGb} GB NVMe` : `${customNvme} GB NVMe`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Location:</span>
                    <span className="font-semibold text-accent font-mono uppercase">
                      {LOCATIONS.find((l) => l.id === selectedLocation)?.city} (
                      {LOCATIONS.find((l) => l.id === selectedLocation)?.flag})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">OS Template:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {OPERATING_SYSTEMS.find((o) => o.id === selectedOs)?.name}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-foreground">Total Price:</span>
                    <span className="text-xl font-bold text-accent font-mono">
                      ${finalPrice.toFixed(2)} / month
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleConfirmDeploy}
                    disabled={deploying}
                    className="w-full py-3.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow flex items-center justify-center gap-2"
                  >
                    {deploying ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>Reserving Node Resources...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Instant Provisioning</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-card border border-border hover:border-accent/40 text-muted hover:text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>Or Order via Discord Ticket Bot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Node Allocation Initialized!</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Your VPS reservation has been dispatched to the Cavrix Cloud orchestrator. 
                  Join the official Discord server to link your Discord ID with the bot and monitor server status.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://discord.gg"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <span>Open Discord Bot Ticket</span>
                  </a>
                  <button
                    onClick={() => setDeployModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

