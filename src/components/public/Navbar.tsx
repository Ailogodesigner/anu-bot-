"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  Terminal,
  Activity,
  ShieldCheck,
  Cpu,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Check if a staff session exists
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setIsStaffLoggedIn(true);
      })
      .catch(() => {});

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div className="bg-[#111827] border-b border-border/80 text-xs py-2 px-4 text-center text-muted flex items-center justify-center gap-2 relative z-50">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold text-[10px] tracking-wide uppercase border border-accent/30">
          <Sparkles className="w-3 h-3" />
          Network Update
        </span>
        <span className="hidden sm:inline text-slate-300">
          New Gen-4 AMD EPYC™ NVMe clusters deployed in Frankfurt & Singapore.
        </span>
        <Link
          href="#pricing"
          className="text-accent hover:text-accent-light underline underline-offset-2 font-medium inline-flex items-center gap-0.5 ml-1"
        >
          View Specs <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Navigation Bar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 border-b ${
          scrolled
            ? "bg-[#0B0F19]/90 backdrop-blur-md border-border shadow-card py-3"
            : "bg-[#0B0F19]/60 backdrop-blur-sm border-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-card border border-border group-hover:border-accent/50 flex items-center justify-center transition shadow-glow">
              <Server className="w-5 h-5 text-accent group-hover:text-accent-light transition" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>CAVRIX</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                  CLOUD
                </span>
              </div>
              <div className="text-[11px] text-muted -mt-0.5">High-Performance KVM & Discord Bot</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="#pricing" className="hover:text-foreground transition">
              VPS Plans
            </Link>
            <Link href="#calculator" className="hover:text-foreground transition">
              Spec Calculator
            </Link>
            <Link href="#bot" className="hover:text-foreground transition">
              Discord Bot
            </Link>
            <Link href="#network" className="hover:text-foreground transition">
              Global Network
            </Link>
            <Link href="/status" className="flex items-center gap-1.5 hover:text-foreground transition">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Status</span>
            </Link>
            <Link href="#faq" className="hover:text-foreground transition">
              FAQ
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card-secondary hover:bg-card border border-border text-xs font-semibold text-foreground transition"
            >
              <MessageSquare className="w-4 h-4 text-[#5865F2]" />
              <span>Discord Guild</span>
            </a>

            <Link
              href={isStaffLoggedIn ? "/dashboard" : "/login"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black text-xs font-bold transition shadow-glow"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{isStaffLoggedIn ? "Open Console" : "Client / Staff Portal"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-card border border-border text-muted hover:text-foreground"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-[#0B0F19] px-4 pt-3 pb-6 space-y-3">
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-card"
            >
              VPS Plans
            </Link>
            <Link
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-card"
            >
              Spec Calculator
            </Link>
            <Link
              href="#bot"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-card"
            >
              Discord Bot Features
            </Link>
            <Link
              href="#network"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-card"
            >
              Global Network
            </Link>
            <Link
              href="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-card"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Live System Status</span>
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-card"
            >
              FAQ
            </Link>

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-card-secondary border border-border text-xs font-semibold text-foreground"
              >
                <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                <span>Join Official Discord Server</span>
              </a>

              <Link
                href={isStaffLoggedIn ? "/dashboard" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-black text-xs font-bold"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isStaffLoggedIn ? "Open Console" : "Client / Staff Portal"}</span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

