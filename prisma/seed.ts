import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding essential configurations and categories...");

  // 1. Guild Configuration for Dedicated Target Server
  const targetGuildId = process.env.DISCORD_GUILD_ID || "1519559734808674444";
  await prisma.guildConfig.upsert({
    where: { guildId: targetGuildId },
    update: {
      guildId: targetGuildId,
      guildName: "Cavrix Cloud Server",
      prefix: "!",
      ticketPanelTitle: "🎫 Cavrix Cloud Support Desk",
      ticketPanelDescription: "Click a button below to open a private ticket with our team.",
      ticketPanelColor: "#D4AF37",
      welcomeTitle: "Welcome to Cavrix Cloud",
      welcomeMessage: "Welcome {user} to {server}! Please read the rules and verify.",
      welcomeColor: "#D4AF37",
      welcomeEnabled: true,
    },
    create: {
      guildId: targetGuildId,
      guildName: "Cavrix Cloud Server",
      prefix: "!",
      maxTicketsPerUser: 3,
      autoCloseHours: 48,
      enableAiSupport: true,
      aiEscalationSensitivity: "NORMAL",
      ticketPanelTitle: "🎫 Cavrix Cloud Support Desk",
      ticketPanelDescription: "Click a button below to open a private ticket with our team.",
      ticketPanelColor: "#D4AF37",
      welcomeTitle: "Welcome to Cavrix Cloud",
      welcomeMessage: "Welcome {user} to {server}! Please read the rules and verify.",
      welcomeColor: "#D4AF37",
      welcomeEnabled: true,
    },
  });

  // 2. Ticket Categories
  await prisma.ticketCategory.upsert({
    where: { slug: "buy" },
    update: { name: "Order & Purchases", emoji: "🛒", order: 1 },
    create: {
      name: "Order & Purchases",
      slug: "buy",
      description: "Purchase custom VPS hosting, dedicated server nodes & add-ons",
      emoji: "🛒",
      defaultPriority: "HIGH",
      order: 1,
    },
  });

  await prisma.ticketCategory.upsert({
    where: { slug: "support" },
    update: { name: "General Support", emoji: "💬", order: 2 },
    create: {
      name: "General Support",
      slug: "support",
      description: "Account assistance, billing questions, and general guidance",
      emoji: "💬",
      defaultPriority: "MEDIUM",
      order: 2,
    },
  });

  await prisma.ticketCategory.upsert({
    where: { slug: "claim" },
    update: { name: "Claim Rewards", emoji: "🎁", order: 3 },
    create: {
      name: "Claim Rewards",
      slug: "claim",
      description: "Claim giveaway prizes, event rewards, invite perks & VIP roles",
      emoji: "🎁",
      defaultPriority: "MEDIUM",
      order: 3,
    },
  });

  await prisma.ticketCategory.upsert({
    where: { slug: "technical-issues" },
    update: { name: "Technical Issues", emoji: "⚙️", order: 4 },
    create: {
      name: "Technical Issues",
      slug: "technical-issues",
      description: "DDoS mitigation, latency, SSH access & server troubleshooting",
      emoji: "⚙️",
      defaultPriority: "URGENT",
      order: 4,
    },
  });

  await prisma.ticketCategory.upsert({
    where: { slug: "promotion" },
    update: { name: "Promotion & Collab", emoji: "📢", order: 5 },
    create: {
      name: "Promotion & Collab",
      slug: "promotion",
      description: "Partnership inquiries, sponsorships, bot invites & collabs",
      emoji: "📢",
      defaultPriority: "LOW",
      order: 5,
    },
  });

  // 3. AI Config
  await prisma.aiConfig.upsert({
    where: { id: "default-ai-config" },
    update: {},
    create: {
      id: "default-ai-config",
      provider: "LOCAL_FALLBACK",
      modelName: "gemini-1.5-flash",
      temperature: 0.2,
      maxTokens: 1024,
      systemPrompt: "You are the Cavrix Cloud Tier-1 Support AI. Assist customers with VPS issues calmly and professionally.",
      guardrailsEnabled: true,
      autoTroubleshootSsh: true,
      autoTroubleshootFirewall: true,
      autoTroubleshootResources: true,
      forbidServerCredentialRequests: true,
      monthlyTokenLimit: 500000,
    },
  });

  // 4. Default Auto-responses
  const existingAuto = await prisma.autoResponse.findFirst();
  if (!existingAuto) {
    await prisma.autoResponse.create({
      data: {
        trigger: "ip",
        matchType: "CONTAINS",
        responseContent: "Cavrix Cloud server test IP: `185.196.220.14` (Datacenter: Frankfurt, Germany). 10 Gbps DDoS Protected.",
        embedTitle: "🌐 Cavrix Global Test IPs",
        embedDescription: "• Frankfurt: `185.196.220.14`\n• Singapore: `103.145.22.8`\n• New York: `198.51.100.22`",
        embedColor: "#D4AF37",
        isActive: true,
      },
    });
  }

  // 5. Default Payment QR
  const existingQr = await prisma.paymentQr.findFirst();
  if (!existingQr) {
    await prisma.paymentQr.create({
      data: {
        title: "UPI / Google Pay / PhonePe",
        provider: "UPI",
        accountAddress: "cavrixcloud@upi",
        qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cavrixcloud@upi&pn=CavrixCloud",
        note: "Scan to pay via any UPI app. After payment, send transaction ID or screenshot in ticket.",
        isActive: true,
        order: 1,
      },
    });
    await prisma.paymentQr.create({
      data: {
        title: "USDT (TRC20)",
        provider: "CRYPTO",
        accountAddress: "TYDnyCnzWvNuGj5V6vUeK2Wq5j9tBqXabc",
        qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=TYDnyCnzWvNuGj5V6vUeK2Wq5j9tBqXabc",
        note: "Send USDT via TRC-20 network only. Minimum deposit: 10 USDT.",
        isActive: true,
        order: 2,
      },
    });
  }

  // 6. Default Random Vanity Link
  const existingLink = await prisma.randomLink.findFirst();
  if (!existingLink) {
    await prisma.randomLink.create({
      data: {
        title: "Discord Community Invite",
        slug: "discord",
        targetUrl: "https://discord.gg/cavrix",
        isActive: true,
      },
    });
  }

  console.log("✅ Seed completed without dummy users or mock tickets.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
