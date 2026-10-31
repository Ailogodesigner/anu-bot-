import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { prisma } from "../../lib/prisma";
import { calculateVpsPricing, VpsSpecs } from "../../lib/calculator";
import { searchKnowledgeBase } from "../../lib/ai";
import { escalateTicket } from "../../lib/escalation";
import { generateTicketTranscript } from "../../lib/transcripts";
import { logAuditEvent } from "../../lib/audit";

export const slashCommands = [
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage VPS hosting support tickets")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Open a new support ticket")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Ticket category")
            .setRequired(true)
            .addChoices(
              { name: "VPS Connectivity & Network", value: "vps-connectivity-network" },
              { name: "SSH Access & Firewall", value: "ssh-access-firewall" },
              { name: "Resource & Performance (OOM/CPU)", value: "resource-performance" },
              { name: "Billing & Invoices", value: "billing-inquiries" }
            )
        )
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Brief summary of your issue").setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("claim").setDescription("Claim this ticket (Staff only)"))
    .addSubcommand((sub) =>
      sub
        .setName("escalate")
        .setDescription("Escalate this ticket to human NetOps / Support Lead")
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for escalation").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("resolve")
        .setDescription("Resolve and close this ticket (Staff only)")
        .addStringOption((opt) =>
          opt.setName("summary").setDescription("Resolution summary").setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName("reopen").setDescription("Reopen a recently closed ticket")),

  new SlashCommandBuilder()
    .setName("calc")
    .setDescription("Calculate custom VPS resource configurations and pricing")
    .addIntegerOption((opt) => opt.setName("cpu").setDescription("Number of vCPU cores").setRequired(true))
    .addIntegerOption((opt) => opt.setName("ram").setDescription("Dedicated RAM in GB").setRequired(true))
    .addIntegerOption((opt) => opt.setName("nvme").setDescription("NVMe Storage in GB").setRequired(true))
    .addIntegerOption((opt) => opt.setName("bw").setDescription("Bandwidth in TB").setRequired(false))
    .addIntegerOption((opt) => opt.setName("ipv4").setDescription("Dedicated IPv4 count").setRequired(false))
    .addStringOption((opt) =>
      opt
        .setName("ddos")
        .setDescription("DDoS Mitigation Tier")
        .setRequired(false)
        .addChoices(
          { name: "Standard (Free)", value: "standard" },
          { name: "Advanced ($12/mo)", value: "advanced" },
          { name: "Enterprise ($35/mo)", value: "enterprise" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("backup")
        .setDescription("Automated Snapshot Frequency")
        .setRequired(false)
        .addChoices(
          { name: "None ($0/mo)", value: "none" },
          { name: "Weekly ($4/mo)", value: "weekly" },
          { name: "Daily ($8/mo)", value: "daily" }
        )
    ),

  new SlashCommandBuilder()
    .setName("kb")
    .setDescription("Search approved VPS technical documentation")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Keyword (e.g. ssh, ufw, oom, mtr)").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("View live bot health, uptime, and VPS support queue metrics"),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Staff shift management and live telemetry tracking")
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Update your active staff shift status")
        .addStringOption((opt) =>
          opt
            .setName("state")
            .setDescription("Your shift availability")
            .setRequired(true)
            .addChoices(
              { name: "Online (Active Shift)", value: "ONLINE" },
              { name: "Busy (Handling Priority Task)", value: "BUSY" },
              { name: "On Break (Temporarily Away)", value: "ON_BREAK" },
              { name: "Offline (Shift Ended)", value: "OFFLINE" }
            )
        )
    )
    .addSubcommand((sub) => sub.setName("stats").setDescription("View your personal ticket resolution performance"))
    .addSubcommand((sub) => sub.setName("leaderboard").setDescription("View staff rankings for server 1528401268354056293")),

  new SlashCommandBuilder()
    .setName("app-admin")
    .setDescription("Cavrix Bot Administration & Server Configuration")
    .addSubcommand((sub) =>
      sub
        .setName("dashboard")
        .setDescription("Open the web control panel dashboard link")
    )
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Auto-configure ticket categories, channels, and permissions for server 1528401268354056293")
    )
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Send the ticket creation button panel in this channel")
    )
    .addSubcommand((sub) =>
      sub
        .setName("verify")
        .setDescription("Send the member verification button panel in this channel")
    ),

  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Quick alias for app-admin commands")
    .addSubcommand((sub) => sub.setName("dashboard").setDescription("Open the web control panel dashboard link"))
    .addSubcommand((sub) => sub.setName("setup").setDescription("Auto-configure ticket categories and channels")),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("View command instructions and VPS support guidelines"),
];

/**
 * Handle Slash Command Interactions
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  if (commandName === "ticket") {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      await interaction.deferReply({ ephemeral: true });

      const categorySlug = interaction.options.getString("category", true);
      const title = interaction.options.getString("title", true);

      // Check user ticket rate limit
      const activeTicketsCount = await prisma.ticket.count({
        where: {
          customerDiscordId: interaction.user.id,
          status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] },
        },
      });

      const guildConfig = await prisma.guildConfig.findFirst();
      const maxAllowed = guildConfig?.maxTicketsPerUser || 3;

      if (activeTicketsCount >= maxAllowed) {
        await interaction.editReply({
          content: `❌ You already have **${activeTicketsCount} active tickets**. The maximum allowed per customer is **${maxAllowed}**. Please resolve existing tickets before opening a new one.`,
        });
        return;
      }

      const category = await prisma.ticketCategory.findUnique({
        where: { slug: categorySlug },
      });

      if (!category) {
        await interaction.editReply({ content: "❌ Invalid ticket category selected." });
        return;
      }

      // Generate next ticket number
      const highestTicket = await prisma.ticket.findFirst({
        orderBy: { ticketNumber: "desc" },
      });
      const nextNumber = (highestTicket?.ticketNumber || 1000) + 1;

      // Create ticket record
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: nextNumber,
          title,
          categoryId: category.id,
          customerDiscordId: interaction.user.id,
          customerUsername: interaction.user.username,
          customerAvatar: interaction.user.displayAvatarURL(),
          priority: category.defaultPriority,
          status: "OPEN",
          messages: {
            create: {
              senderDiscordId: interaction.user.id,
              senderUsername: interaction.user.username,
              senderAvatar: interaction.user.displayAvatarURL(),
              isStaff: false,
              content: title,
            },
          },
        },
      });

      // Audit log
      await logAuditEvent({
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
        action: "TICKET_CREATE",
        targetType: "TICKET",
        targetId: ticket.id,
        details: { ticketNumber: ticket.ticketNumber, category: category.name },
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.ticketNumber} Created`)
        .setDescription(`**${category.emoji || "📁"} ${category.name}**\n\n**Issue:** ${title}\n\nOur AI Assistant will analyze your problem and provide immediate troubleshooting guidance. If needed, you can click **Escalate to Human** at any time.`)
        .setColor(0x06b6d4)
        .addFields(
          { name: "Priority", value: `\`${ticket.priority}\``, inline: true },
          { name: "Status", value: "`OPEN`", inline: true },
          { name: "Customer", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: "Cavrix Cloud Support • Never share passwords or private keys" })
        .setTimestamp();

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel("Claim Ticket").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`ticket_escalate_${ticket.id}`).setLabel("Escalate to Staff").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`ticket_close_${ticket.id}`).setLabel("Close Ticket").setStyle(ButtonStyle.Danger)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow],
      });
      return;
    }

    if (subcommand === "claim") {
      await interaction.deferReply();

      // Check if user is staff
      const staffMember = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!staffMember || staffMember.role === "VIEWER") {
        await interaction.editReply({ content: "❌ You must have a staff role to claim tickets." });
        return;
      }

      // Find ticket by channelId or latest active ticket
      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "AWAITING_STAFF"] } },
        orderBy: { createdAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No unassigned open tickets found to claim." });
        return;
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          assignedStaffId: staffMember.id,
          claimedAt: new Date(),
          status: "STAFF_REPLY",
        },
      });

      await prisma.user.update({
        where: { id: staffMember.id },
        data: { activeTicketsCount: { increment: 1 } },
      });

      await logAuditEvent({
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
        action: "TICKET_CLAIM",
        targetType: "TICKET",
        targetId: ticket.id,
        details: { ticketNumber: ticket.ticketNumber },
      });

      await interaction.editReply({
        content: `✅ **Ticket #${ticket.ticketNumber}** has been claimed by <@${interaction.user.id}>. Customer has been notified.`,
      });
      return;
    }

    if (subcommand === "escalate") {
      await interaction.deferReply();
      const reason = interaction.options.getString("reason", true);

      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "STAFF_REPLY"] } },
        orderBy: { createdAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No active ticket found to escalate." });
        return;
      }

      const res = await escalateTicket({
        ticketId: ticket.id,
        reason,
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
      });

      await interaction.editReply({
        content: `🚨 **Ticket #${ticket.ticketNumber} Escalated to Staff!**\n\n${res.summary}`,
      });
      return;
    }

    if (subcommand === "resolve") {
      await interaction.deferReply();
      const summary = interaction.options.getString("summary", true);

      const staffMember = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!staffMember || staffMember.role === "VIEWER") {
        await interaction.editReply({ content: "❌ Only authorized staff can resolve tickets." });
        return;
      }

      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
        orderBy: { createdAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No active ticket found to resolve." });
        return;
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolutionSummary: summary,
        },
      });

      // Generate transcript automatically
      await generateTicketTranscript(ticket.id);

      await prisma.user.update({
        where: { id: staffMember.id },
        data: {
          totalResolvedTickets: { increment: 1 },
          activeTicketsCount: { decrement: 1 },
        },
      });

      await logAuditEvent({
        actorDiscordId: interaction.user.id,
        actorUsername: interaction.user.username,
        action: "TICKET_RESOLVE",
        targetType: "TICKET",
        targetId: ticket.id,
        details: { ticketNumber: ticket.ticketNumber, summary },
      });

      const embed = new EmbedBuilder()
        .setTitle(`✅ Ticket #${ticket.ticketNumber} Resolved`)
        .setDescription(`**Resolution:** ${summary}\n\nA persistent transcript has been generated and archived to the dashboard.`)
        .setColor(0x10b981)
        .setFooter({ text: "Cavrix Cloud Support • Thank you for choosing Cavrix Cloud" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  if (commandName === "calc") {
    await interaction.deferReply();

    const cpu = interaction.options.getInteger("cpu", true);
    const ram = interaction.options.getInteger("ram", true);
    const nvme = interaction.options.getInteger("nvme", true);
    const bandwidth = interaction.options.getInteger("bw") || 1;
    const ipv4 = interaction.options.getInteger("ipv4") || 1;
    const ddosTier = (interaction.options.getString("ddos") as any) || "standard";
    const backupTier = (interaction.options.getString("backup") as any) || "none";

    const calcConfig = await prisma.hostingCalculatorConfig.findFirst();
    if (!calcConfig) {
      await interaction.editReply({ content: "❌ Pricing calculator configuration unavailable." });
      return;
    }

    const pricing = calculateVpsPricing(
      { cpu, ram, nvme, bandwidth, ipv4, ddosTier, backupTier },
      {
        basePrice: calcConfig.basePrice,
        cpuCorePrice: calcConfig.cpuCorePrice,
        ramGbPrice: calcConfig.ramGbPrice,
        nvmeGbPrice: calcConfig.nvmeGbPrice,
        bandwidthTbPrice: calcConfig.bandwidthTbPrice,
        ipv4Price: calcConfig.ipv4Price,
        ddosTierPrice: JSON.parse(calcConfig.ddosTierPrice),
        backupTierPrice: JSON.parse(calcConfig.backupTierPrice),
        formulaExpression: calcConfig.formulaExpression,
      }
    );

    if (!pricing.isValid) {
      await interaction.editReply({ content: `❌ Error calculating quote: ${pricing.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("⚡ Cavrix Cloud Hosting Cost Calculator")
      .setDescription("Real-time quote calculated using verified enterprise hardware formulas.")
      .setColor(0x00f5d4)
      .addFields(
        { name: "vCPU Cores", value: `\`${cpu} Cores\` ($${pricing.itemized.cpu.total}/mo)`, inline: true },
        { name: "Dedicated RAM", value: `\`${ram} GB\` ($${pricing.itemized.ram.total}/mo)`, inline: true },
        { name: "NVMe Storage", value: `\`${nvme} GB\` ($${pricing.itemized.nvme.total}/mo)`, inline: true },
        { name: "Bandwidth", value: `\`${bandwidth} TB\` ($${pricing.itemized.bandwidth.total}/mo)`, inline: true },
        { name: "Dedicated IPv4", value: `\`${ipv4} IP(s)\` ($${pricing.itemized.ipv4.total}/mo)`, inline: true },
        { name: "DDoS Mitigation", value: `\`${ddosTier.toUpperCase()}\` ($${pricing.itemized.ddos.cost}/mo)`, inline: true },
        { name: "Automated Backup", value: `\`${backupTier.toUpperCase()}\` ($${pricing.itemized.backup.cost}/mo)`, inline: true },
        { name: "Monthly Total", value: `**$${pricing.monthlyPrice.toFixed(2)} / month**`, inline: true },
        { name: "Annual Prepay (10% Off)", value: `**$${pricing.yearlyPrice.toFixed(2)} / year**`, inline: true }
      )
      .setFooter({ text: "All instances include 10 Gbps uplink port & SLA Guarantee" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (commandName === "kb") {
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);

    const results = await searchKnowledgeBase(query);

    if (results.length === 0) {
      await interaction.editReply({
        content: `🔍 No documentation articles matched \`${query}\`. Please open a support ticket or ask in the support channel.`,
      });
      return;
    }

    const top = results[0];
    const embed = new EmbedBuilder()
      .setTitle(`📖 Knowledge Base: ${top.title}`)
      .setDescription(top.content.length > 2000 ? top.content.slice(0, 1950) + "..." : top.content)
      .setColor(0x06b6d4)
      .addFields({ name: "Category", value: `\`${top.category}\``, inline: true })
      .setFooter({ text: "Cavrix Cloud Documentation • Verified Solutions" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (commandName === "status") {
    await interaction.deferReply();

    const totalOpenTickets = await prisma.ticket.count({
      where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
    });

    const activeStaff = await prisma.user.count({
      where: { status: "ONLINE" },
    });

    const aiConfig = await prisma.aiConfig.findFirst();

    const memUsageMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const uptimeHours = (process.uptime() / 3600).toFixed(1);

    const embed = new EmbedBuilder()
      .setTitle("🛡️ Cavrix Bot & Support Gateway Status")
      .setColor(0x0084ff)
      .addFields(
        { name: "Gateway Latency", value: `\`${interaction.client.ws.ping} ms\``, inline: true },
        { name: "Bot Uptime", value: `\`${uptimeHours} hours\``, inline: true },
        { name: "Process Memory", value: `\`${memUsageMb} MB RSS\``, inline: true },
        { name: "Active Tickets", value: `\`${totalOpenTickets}\``, inline: true },
        { name: "Staff On Duty", value: `\`${activeStaff} Online\``, inline: true },
        { name: "AI Support Provider", value: `\`${aiConfig?.provider || "LOCAL_FALLBACK"}\``, inline: true }
      )
      .setFooter({ text: "Cavrix Cloud Management System v1.0.0" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (commandName === "staff") {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    let staffMember = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
      include: {
        assignedTickets: {
          where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
        },
      },
    });

    if (sub === "status") {
      const newState = interaction.options.getString("state", true);

      if (!staffMember) {
        staffMember = await prisma.user.create({
          data: {
            discordId: interaction.user.id,
            username: interaction.user.username,
            avatar: interaction.user.displayAvatarURL(),
            role: "SUPPORT_AGENT",
            status: newState,
            lastActiveAt: new Date(),
          },
          include: { assignedTickets: true },
        });
      } else {
        await prisma.user.update({
          where: { id: staffMember.id },
          data: { status: newState, lastActiveAt: new Date() },
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("⏱️ Staff Shift Status Updated")
        .setDescription(`Your shift status on server **1528401268354056293** is now **${newState}**. The Web Console has been updated.`)
        .setColor(0x00f2fe)
        .addFields(
          { name: "Staff Member", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Current Status", value: `\`${newState}\``, inline: true },
          { name: "Active Tickets", value: `\`${staffMember.assignedTickets?.length || 0}\``, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "stats") {
      if (!staffMember) {
        await interaction.editReply({
          content: "❌ You are not registered in the staff roster yet. Claim a ticket or set your `/staff status` to register.",
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📊 Staff Performance: ${staffMember.username}`)
        .setDescription(`Telemetry for server **1528401268354056293**`)
        .setColor(0x00f2fe)
        .addFields(
          { name: "Staff Role", value: `\`${staffMember.role}\``, inline: true },
          { name: "Shift Status", value: `\`${staffMember.status}\``, inline: true },
          { name: "Active Tickets", value: `\`${staffMember.activeTicketsCount}\``, inline: true },
          { name: "Total Resolved", value: `\`${staffMember.totalResolvedTickets}\``, inline: true },
          { name: "CSAT Rating", value: `\`⭐ ${staffMember.avgRating.toFixed(1)} / 5.0\``, inline: true },
          { name: "Last Active", value: staffMember.lastActiveAt ? `<t:${Math.floor(staffMember.lastActiveAt.getTime() / 1000)}:R>` : "N/A", inline: true }
        )
        .setFooter({ text: "Cavrix Cloud Staff Telemetry • Server 1528401268354056293" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "leaderboard") {
      const topStaff = await prisma.user.findMany({
        where: { role: { not: "VIEWER" } },
        orderBy: [{ totalResolvedTickets: "desc" }, { avgRating: "desc" }],
        take: 10,
      });

      const lines = topStaff.map((s, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `**#${idx + 1}**`;
        return `${medal} **${s.username}** — \`${s.totalResolvedTickets} resolved\` • ⭐ \`${s.avgRating.toFixed(1)}\` • \`[${s.status}]\``;
      });

      const embed = new EmbedBuilder()
        .setTitle("🏆 Staff Performance Leaderboard")
        .setDescription(`Live resolution rankings for server **1528401268354056293**:\n\n${lines.join("\n") || "No staff activity recorded yet."}`)
        .setColor(0x00f2fe)
        .setFooter({ text: "Cavrix Cloud NetOps • Live Rankings" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  if (commandName === "app-admin" || commandName === "admin" || commandName === "app_admin") {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

    if (sub === "dashboard") {
      const embed = new EmbedBuilder()
        .setTitle("👑 Cavrix Bot Control Panel")
        .setDescription(
          `**Server 1528401268354056293 Management Console**\n\nDirectly manage ticket queues, live staff shifts, response telemetry, embed dispatches, and diagnostics.`
        )
        .setColor(0xD4AF37) // Luxury Gold
        .addFields(
          { name: "🌐 Control Panel URL", value: `[${appUrl}/dashboard](${appUrl}/dashboard)`, inline: false },
          { name: "🛡️ Server ID", value: `\`1528401268354056293\``, inline: true },
          { name: "⚡ Gateway Status", value: `\`ONLINE & ACTIVE\``, inline: true },
          { name: "🔐 Staff Access", value: `\`ADMIN / NETOPS\``, inline: true }
        )
        .setFooter({ text: "Cavrix Cloud Control Panel • White, Gold & Black Edition" })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Open Web Dashboard")
          .setStyle(ButtonStyle.Link)
          .setURL(`${appUrl}/dashboard`),
        new ButtonBuilder()
          .setLabel("Staff Login")
          .setStyle(ButtonStyle.Link)
          .setURL(`${appUrl}/login`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    if (sub === "setup") {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply({ content: "❌ This command must be executed within a Discord server." });
        return;
      }

      // Check admin perms
      const isOwnerOrAdmin =
        interaction.memberPermissions?.has("Administrator") ||
        interaction.user.id === guild.ownerId;

      if (!isOwnerOrAdmin) {
        await interaction.editReply({
          content: "❌ Administrator permission is required to run server setup.",
        });
        return;
      }

      // 1. Locate or create Ticket Category
      let ticketCategory = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          (c.name.toLowerCase().includes("ticket") || c.name.toLowerCase().includes("cavrix"))
      );
      if (!ticketCategory) {
        try {
          ticketCategory = await guild.channels.create({
            name: "🎫 ┃ CAVRIX TICKETS",
            type: ChannelType.GuildCategory,
          });
        } catch {
          // Fallback if bot lacks category permissions
        }
      }

      // 2. Locate or create Transcripts channel
      let transcriptChannel = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          (c.name.includes("transcript") || c.name.includes("archive"))
      );
      if (!transcriptChannel && ticketCategory) {
        try {
          transcriptChannel = await guild.channels.create({
            name: "📜-ticket-transcripts",
            type: ChannelType.GuildText,
            parent: ticketCategory.id,
          });
        } catch {}
      }

      // 3. Locate or create Audit Log channel
      let auditChannel = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          (c.name.includes("audit") || c.name.includes("bot-log"))
      );
      if (!auditChannel && ticketCategory) {
        try {
          auditChannel = await guild.channels.create({
            name: "🛡️-bot-audit-logs",
            type: ChannelType.GuildText,
            parent: ticketCategory.id,
          });
        } catch {}
      }

      // 4. Save to database
      await prisma.guildConfig.upsert({
        where: { guildId: guild.id },
        update: {
          guildId: guild.id,
          guildName: guild.name,
          ticketCategoryId: ticketCategory?.id || null,
          transcriptChannelId: transcriptChannel?.id || null,
          auditLogChannelId: auditChannel?.id || null,
        },
        create: {
          guildId: guild.id,
          guildName: guild.name,
          ticketCategoryId: ticketCategory?.id || null,
          transcriptChannelId: transcriptChannel?.id || null,
          auditLogChannelId: auditChannel?.id || null,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ Server Auto-Setup Completed")
        .setDescription(`Successfully linked and auto-configured channels for **${guild.name}** (\`${guild.id}\`):`)
        .setColor(0xD4AF37) // Luxury Gold
        .addFields(
          {
            name: "📁 Ticket Category",
            value: ticketCategory ? `<#${ticketCategory.id}> (\`${ticketCategory.name}\`)` : "`Existing / Default`",
            inline: false,
          },
          {
            name: "📜 Transcripts Channel",
            value: transcriptChannel ? `<#${transcriptChannel.id}>` : "`Linked to default`",
            inline: true,
          },
          {
            name: "🛡️ Audit Logs Channel",
            value: auditChannel ? `<#${auditChannel.id}>` : "`Linked to default`",
            inline: true,
          },
          {
            name: "🌐 Dashboard Synced",
            value: `[Open Console](${appUrl}/dashboard)`,
            inline: true,
          }
        )
        .setFooter({ text: "Cavrix Cloud • Auto Configuration Completed" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "panel") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.editReply({ content: "❌ Please run this command inside a text channel." });
        return;
      }

      const panelEmbed = new EmbedBuilder()
        .setTitle("🎫 Cavrix Cloud Support Desk")
        .setDescription(
          "Welcome to **Cavrix Cloud** support center.\n\nClick a button below to open a private ticket with our team. A dedicated channel with 24/7 SLA monitoring will be generated instantly for you."
        )
        .setColor(0xD4AF37)
        .addFields(
          {
            name: "🛠️ Technical / Connectivity",
            value: "DDoS mitigation, latency, SSH, and server configuration",
            inline: false,
          },
          {
            name: "💳 Billing & Upgrades",
            value: "Invoice inquiries, resource upgrades, and order assistance",
            inline: false,
          }
        )
        .setFooter({ text: "Cavrix Cloud NetOps • 24/7 SLA Protected" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create_vps-connectivity-network")
          .setLabel("Open Tech Support Ticket")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🛠️"),
        new ButtonBuilder()
          .setCustomId("ticket_create_billing-inquiries")
          .setLabel("Billing Support")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("💳")
      );

      await channel.send({ embeds: [panelEmbed], components: [row] });
      await interaction.editReply({ content: "✅ Support ticket panel dispatched to this channel!" });
      return;
    }

    if (sub === "verify") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.editReply({ content: "❌ Please run this command inside a text channel." });
        return;
      }

      const verifyEmbed = new EmbedBuilder()
        .setTitle("🛡️ Member Verification")
        .setDescription("Welcome to **Cavrix Cloud**! Click the button below to verify your account and unlock access to all server channels.")
        .setColor(0xD4AF37)
        .setFooter({ text: "Cavrix Cloud Security System" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("verify_member")
          .setLabel("Verify Account")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅")
      );

      await channel.send({ embeds: [verifyEmbed], components: [row] });
      await interaction.editReply({ content: "✅ Verification panel dispatched to this channel!" });
      return;
    }
  }

  if (commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("Cavrix Cloud Support Bot - User Guide")
      .setDescription("Welcome to the official Cavrix Cloud technical support and hosting bot.")
      .setColor(0x0084ff)
      .addFields(
        { name: "/ticket create", value: "Open a categorized support ticket for connection, firewall, resource, or billing queries.", inline: false },
        { name: "/ticket escalate [reason]", value: "Request immediate handoff to human NetOps or Support Lead.", inline: false },
        { name: "/calc vps [specs...]", value: "Interactive hardware resource and monthly price calculator.", inline: false },
        { name: "/kb [query]", value: "Search approved technical documentation (e.g. SSH, UFW, OOM, MTR).", inline: false },
        { name: "/status", value: "View real-time support queue and bot metrics.", inline: false }
      )
      .setFooter({ text: "Cavrix Cloud Security Policy: Never share root passwords or private keys." });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  // Graceful fallback for any other command (e.g. legacy global commands)
  if (!interaction.replied && !interaction.deferred) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";
    await interaction.reply({
      content: `⚡ **Cavrix Cloud Bot**: Command \`/${commandName}\` acknowledged. Use \`/app-admin dashboard\` or \`/app-admin setup\` to manage the server, or open the [Cavrix Control Panel](${appUrl}/dashboard).`,
      ephemeral: true,
    });
  }
}
