"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How fast is instance provisioning after ordering?",
    a: "All KVM VPS instances are automatically provisioned by our hypervisor cluster in under 60 seconds. You will receive your IP address, root credentials, and SSH access details instantly via the Web Console and Discord Bot.",
  },
  {
    q: "What Anti-DDoS mitigation is included?",
    a: "Every instance includes complimentary, always-on 2.5+ Tbps Anycast DDoS filtering powered by Path.net and Voxility. It automatically mitigates volumetric L3/L4 attacks (SYN floods, UDP amplification) as well as complex Layer 7 application attacks without introducing latency.",
  },
  {
    q: "How does the Discord Bot integrate with my VPS and community?",
    a: "The Cavrix Cloud Discord Bot bridges your Discord guild with our Web Console. You can manage support tickets, run 1-click verification, query VPS telemetry, and dispatch announcements. Tickets opened in Discord sync bi-directionally with the web dashboard in real time.",
  },
  {
    q: "Can I host 24/7 Discord bots, game servers, and Docker containers?",
    a: "Yes! You have 100% unrestricted root access via KVM virtualization. You can run Node.js, Python, Docker, Kubernetes, FiveM, Rust, Minecraft, databases, or any custom stack 24/7 without limitations.",
  },
  {
    q: "What operating systems are supported?",
    a: "We offer 1-click automated installations for Ubuntu 24.04 LTS, Ubuntu 22.04, Debian 12 Bookworm, AlmaLinux 9, Rocky Linux, and Windows Server 2022. You can also mount any custom ISO via our KVM control panel.",
  },
  {
    q: "Can I scale or upgrade my VPS resources later?",
    a: "Yes. You can seamlessly upgrade your vCPU, RAM, or NVMe storage from the client portal with a simple reboot. Your disk partitions resize automatically without data loss.",
  },
  {
    q: "What payment methods are supported?",
    a: "We accept all major Credit/Debit Cards (Visa, MasterCard, Amex), Apple Pay, Google Pay, PayPal, and major Cryptocurrencies (Bitcoin, Ethereum, USDT, Solana).",
  },
  {
    q: "Do you offer a money-back guarantee?",
    a: "Yes. We offer an unconditional 7-day money-back guarantee on all standard cloud VPS plans if you are not completely satisfied with our performance or network latency.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold text-xs tracking-wider uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything You Need to <span className="text-gradient">Know</span>
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Have questions about our cloud nodes, Discord bot integration, or network SLAs?
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-card border border-border overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-card-secondary/50 transition"
                >
                  <span className="text-sm sm:text-base font-semibold text-foreground">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-card-secondary border border-border flex items-center justify-center shrink-0 transition text-accent ${
                      isOpen ? "rotate-180 bg-accent text-black" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-12 p-6 rounded-2xl bg-card-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-foreground">Still have questions?</h4>
            <p className="text-xs text-muted mt-0.5">
              Our engineering team and Discord community are active 24/7 to assist you.
            </p>
          </div>
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs transition shadow-subtle shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask in Discord Community</span>
          </a>
        </div>
      </div>
    </section>
  );
}
