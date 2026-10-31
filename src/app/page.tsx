import React from "react";
import Navbar from "@/components/public/Navbar";
import Hero from "@/components/public/Hero";
import VpsConfigurator from "@/components/public/VpsConfigurator";
import DiscordBotShowcase from "@/components/public/DiscordBotShowcase";
import NetworkLocations from "@/components/public/NetworkLocations";
import Testimonials from "@/components/public/Testimonials";
import FaqSection from "@/components/public/FaqSection";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-black">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <VpsConfigurator />
        <DiscordBotShowcase />
        <NetworkLocations />
        <Testimonials />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
