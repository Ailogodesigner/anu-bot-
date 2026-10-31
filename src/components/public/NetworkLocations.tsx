"use client";

import React, { useState } from "react";
import {
  Globe2,
  Shield,
  Activity,
  Zap,
  Server,
  Terminal,
  CheckCircle2,
  ArrowRight,
  HardDrive,
} from "lucide-react";

interface Datacenter {
  id: string;
  name: string;
  facility: string;
  city: string;
  country: string;
  flag: string;
  transit: string[];
  ddos: string;
  testIp: string;
  ping: number;
}

const DATACENTERS: Datacenter[] = [
  {
    id: "fra",
    name: "Frankfurt (FRA-01)",
    facility: "Equinix FR2 Campus",
    city: "Frankfurt",
    country: "Germany",
    flag: "🇩🇪",
    transit: ["DE-CIX", "Telia Carrier", "Lumen", "NTT"],
    ddos: "2.5 Tbps Path.net Anycast",
    testIp: "185.193.125.1",
    ping: 4,
  },
  {
    id: "lon",
    name: "London (LON-01)",
    facility: "Telehouse North Two",
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    transit: ["LINX", "Arelion", "Colt", "GTT"],
    ddos: "2.5 Tbps Path.net Anycast",
    testIp: "194.26.229.1",
    ping: 7,
  },
  {
    id: "nyc",
    name: "New York (NYC-01)",
    facility: "Equinix NY4 Secaucus",
    city: "New York",
    country: "United States",
    flag: "🇺🇸",
    transit: ["NYIIX", "Cogent", "Zayo", "Lumen"],
    ddos: "2.5 Tbps Path.net Anycast",
    testIp: "199.195.250.1",
    ping: 14,
  },
  {
    id: "sin",
    name: "Singapore (SIN-01)",
    facility: "Equinix SG1 One-North",
    city: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    transit: ["Equinix IX", "Singtel", "Tata", "Telstra"],
    ddos: "2.5 Tbps Path.net Anycast",
    testIp: "103.152.112.1",
    ping: 9,
  },
];

export default function NetworkLocations() {
  const [selectedDc, setSelectedDc] = useState<Datacenter>(DATACENTERS[0]);
  const [pingRunning, setPingRunning] = useState(false);
  const [pingResult, setPingResult] = useState<number | null>(null);

  const handleTestPing = (dc: Datacenter) => {
    setSelectedDc(dc);
    setPingRunning(true);
    setPingResult(null);

    setTimeout(() => {
      // Simulate live measured ping with +/- 2ms jitter
      const simulated = Math.max(3, dc.ping + Math.floor(Math.random() * 3) - 1);
      setPingResult(simulated);
      setPingRunning(false);
    }, 600);
  };

  return (
    <section id="network" className="py-20 md:py-28 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wider uppercase">
            <Globe2 className="w-3.5 h-3.5" />
            Global Backbone
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Tier-IV Datacenters. <span className="text-gradient">Engineered for Sub-10ms Latency</span>.
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Every Cavrix Cloud node operates on redundant 10 Gbps uplinks, premium Tier-1 carrier transit, 
            and multi-terabit inline hardware DDoS filtering.
          </p>
        </div>

        {/* Datacenters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DATACENTERS.map((dc) => {
            const isSelected = selectedDc.id === dc.id;

            return (
              <div
                key={dc.id}
                onClick={() => setSelectedDc(dc)}
                className={`cursor-pointer rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-card border-accent shadow-glow"
                    : "bg-card/50 border-border hover:border-accent/40 hover:bg-card"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{dc.flag}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                      OPERATIONAL
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{dc.name}</h3>
                  <div className="text-xs text-muted mt-0.5">{dc.facility}</div>

                  <div className="mt-5 space-y-2 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>DDoS Filtering</span>
                      <span className="text-cyan-400 font-mono font-semibold">Path.net 2.5T</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Port Speed</span>
                      <span className="text-foreground font-mono font-semibold">10 Gbps Uplink</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Test IP</span>
                      <span className="text-slate-300 font-mono text-[11px]">{dc.testIp}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-1.5">
                    {dc.transit.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-card-secondary border border-border text-muted font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestPing(dc);
                  }}
                  className={`mt-6 w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    isSelected
                      ? "bg-accent/20 border border-accent text-accent-light"
                      : "bg-card-secondary hover:bg-border text-foreground border border-border"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  <span>Test Live Latency</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Live Looking Glass & Ping Simulator Panel */}
        <div className="mt-10 p-6 md:p-8 rounded-2xl bg-card border border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Interactive Looking Glass: {selectedDc.name}
                </h4>
              </div>
              <p className="text-xs text-muted mt-1">
                Simulate ICMP round-trip latency to {selectedDc.city}, {selectedDc.country} via Anycast BGP.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-muted">Target Host:</span>
                <span className="text-accent font-semibold px-2 py-1 rounded bg-card-secondary border border-border">
                  {selectedDc.testIp}
                </span>
              </div>

              <button
                onClick={() => handleTestPing(selectedDc)}
                disabled={pingRunning}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-xs transition shadow-glow flex items-center gap-2"
              >
                {pingRunning ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Measuring...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Run Ping Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result bar */}
          {(pingResult !== null || pingRunning) && (
            <div className="mt-6 p-4 rounded-xl bg-card-secondary/70 border border-border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-muted">PING {selectedDc.testIp} (56 bytes of data):</span>
                {pingRunning ? (
                  <span className="text-accent-light animate-pulse">Transmitting 4 packets...</span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    64 bytes from {selectedDc.testIp}: icmp_seq=1 ttl=58 time={pingResult} ms
                  </span>
                )}
              </div>
              {pingResult !== null && (
                <div className="text-muted flex items-center gap-2">
                  <span>Packet loss:</span>
                  <span className="text-emerald-400 font-bold">0.0%</span>
                  <span>• Status:</span>
                  <span className="text-accent font-bold">OPTIMAL</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

