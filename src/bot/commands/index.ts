import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActivityType,
} from "discord.js";
import os from "os";
import { prisma } from "../../lib/prisma";
import { calculateVpsPricing, VpsSpecs, PricingConfig } from "../../lib/calculator";
import { searchKnowledgeBase } from "../../lib/ai";
import { escalateTicket } from "../../lib/escalation";
import { generateTicketTranscript } from "../../lib/transcripts";
import { logAuditEvent } from "../../lib/audit";

/**
 * Audit log helper for staff command execution telemetry
 */
export async function logStaffCommandAudit(params: {
  staffDiscordId: string;
  staffUsername: string;
  commandName: string;
  targetDiscordId?: string | null;
  targetUsername?: string | null;
  guildId?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  parameters?: any;
  executionSource?: string;
}) {
  try {
    await prisma.staffCommandAudit.create({
      data: {
        staffDiscordId: params.staffDiscordId,
        staffUsername: params.staffUsername,
        commandName: params.commandName,
        targetDiscordId: params.targetDiscordId || null,
        targetUsername: params.targetUsername || null,
        guildId: params.guildId || null,
        channelId: params.channelId || null,
        channelName: params.channelName || null,
        parameters: params.parameters
          ? typeof params.parameters === "string"
            ? params.parameters
            : JSON.stringify(params.parameters)
          : null,
        executionSource: params.executionSource || "DISCORD",
      },
    });
  } catch (err) {
    console.error("Staff audit logging error:", err);
  }
}

function configureOwnerSubcommands(builder: SlashCommandBuilder) {
  return builder
    .addSubcommand((sub) =>
      sub.setName("dashboard").setDescription("Open the web control panel dashboard link")
    )
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Auto-configure ticket categories, channels, and permissions")
    )
    .addSubcommand((sub) =>
      sub.setName("panel").setDescription("Send the support ticket creation button desk")
    )
    .addSubcommand((sub) =>
      sub.setName("verify").setDescription("Send the member verification button panel")
    )
    .addSubcommand((sub) =>
      sub
        .setName("prefix")
        .setDescription("Set server custom command prefix")
        .addStringOption((opt) => opt.setName("prefix").setDescription("New prefix symbol (e.g. !, ?, ., >)").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("announce")
        .setDescription("Broadcast an official luxury gold embed announcement")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Target announcement channel").setRequired(true))
        .addStringOption((opt) => opt.setName("title").setDescription("Announcement title").setRequired(true))
        .addStringOption((opt) => opt.setName("message").setDescription("Announcement body text").setRequired(true))
        .addBooleanOption((opt) => opt.setName("ping_everyone").setDescription("Ping @everyone").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("purge")
        .setDescription("Bulk delete recent messages in this channel")
        .addIntegerOption((opt) =>
          opt.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)
        )
    )
    .addSubcommand((sub) => sub.setName("lock").setDescription("Lock channel to prevent regular members from chatting"))
    .addSubcommand((sub) => sub.setName("unlock").setDescription("Unlock channel to restore chat permissions"))
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("Kick a member from the server")
        .addUserOption((opt) => opt.setName("user").setDescription("User to kick").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for kick").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("Ban a member from the server")
        .addUserOption((opt) => opt.setName("user").setDescription("User to ban").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for ban").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("timeout")
        .setDescription("Timeout (mute) a member")
        .addUserOption((opt) => opt.setName("user").setDescription("User to timeout").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("minutes").setDescription("Duration in minutes (1-40320)").setRequired(true).setMinValue(1).setMaxValue(40320)
        )
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for timeout").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("untimeout")
        .setDescription("Remove timeout from a member")
        .addUserOption((opt) => opt.setName("user").setDescription("User to untimeout").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("staff-add")
        .setDescription("Add or promote a staff member in database")
        .addUserOption((opt) => opt.setName("user").setDescription("User to promote").setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName("role")
            .setDescription("Role to assign")
            .setRequired(true)
            .addChoices(
              { name: "Administrator", value: "ADMIN" },
              { name: "Support Lead", value: "SUPPORT_LEAD" },
              { name: "Support Agent", value: "SUPPORT_AGENT" },
              { name: "Viewer", value: "VIEWER" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("staff-remove")
        .setDescription("Demote staff member from database")
        .addUserOption((opt) => opt.setName("user").setDescription("User to demote").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("staff-list").setDescription("View all registered staff members and their active shifts")
    )
    .addSubcommand((sub) =>
      sub
        .setName("bot-status")
        .setDescription("Update bot custom activity and status presence")
        .addStringOption((opt) => opt.setName("activity").setDescription("Status text (e.g. Cavrix Cloud • /ticket)").setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Activity type")
            .setRequired(false)
            .addChoices(
              { name: "Watching", value: "Watching" },
              { name: "Playing", value: "Playing" },
              { name: "Listening", value: "Listening" },
              { name: "Competing", value: "Competing" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("host-info").setDescription("Self-hosting system diagnostics (RAM, CPU, Uptime, Node)")
    );
}

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
    .setName("pay")
    .setDescription("View verified payment QR codes (UPI, Crypto, PayPal)"),

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
    .addSubcommand((sub) => sub.setName("leaderboard").setDescription("View staff rankings")),

  configureOwnerSubcommands(
    new SlashCommandBuilder()
      .setName("owner")
      .setDescription("Server Owner Master Administration & Automation Control")
  ),

  configureOwnerSubcommands(
    new SlashCommandBuilder()
      .setName("admin")
      .setDescription("Server Administration & Moderation Control")
  ),

  configureOwnerSubcommands(
    new SlashCommandBuilder()
      .setName("app-admin")
      .setDescription("Cavrix Bot Administration & Server Configuration")
  ),

  new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Create, manage, and roll giveaways")
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a new giveaway")
        .addStringOption((opt) => opt.setName("prize").setDescription("Prize description").setRequired(true))
        .addIntegerOption((opt) => opt.setName("minutes").setDescription("Duration in minutes").setRequired(true))
        .addIntegerOption((opt) => opt.setName("winners").setDescription("Number of winners").setRequired(false))
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to post giveaway in").setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End a giveaway immediately and pick winners")
        .addStringOption((opt) => opt.setName("id").setDescription("Giveaway ID").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("Reroll winners for a past giveaway")
        .addStringOption((opt) => opt.setName("id").setDescription("Giveaway ID").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List all giveaways")),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Issue a formal warning to a server member")
    .addUserOption((opt) => opt.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for warning").setRequired(false)),

  new SlashCommandBuilder()
    .setName("punishments")
    .setDescription("View moderation history (warnings, timeouts, kicks, bans) for a member")
    .addUserOption((opt) => opt.setName("user").setDescription("User to inspect").setRequired(true)),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by their Discord user ID")
    .addStringOption((opt) => opt.setName("userid").setDescription("Discord User ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Send the support ticket creation desk embed"),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete recent messages in this channel")
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock this channel to prevent regular members from chatting"),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock this channel to allow chatting again"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display comprehensive server statistics and security status"),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Broadcast an official luxury gold embed announcement")
    .addChannelOption((opt) => opt.setName("channel").setDescription("Target channel").setRequired(true))
    .addStringOption((opt) => opt.setName("title").setDescription("Announcement title").setRequired(true))
    .addStringOption((opt) => opt.setName("message").setDescription("Announcement content").setRequired(true))
    .addBooleanOption((opt) => opt.setName("ping_everyone").setDescription("Ping @everyone").setRequired(false)),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("View command instructions and VPS support guidelines"),
];

/**
 * Handle Slash Command Interactions
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

  // Safe immediate deferral so Discord Gateway never times out with "The application did not respond"
  const isPublicCommand =
    commandName === "announce" ||
    commandName === "pay" ||
    commandName === "panel" ||
    (commandName === "giveaway" && interaction.options.getSubcommand() === "start");

  if (!interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply({ ephemeral: !isPublicCommand });
    } catch (e: any) {
      if (e?.code === 10062) return;
    }
  }

  // Helper for staff check
  const member = interaction.member;
  const isStaff =
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    interaction.user.id === interaction.guild?.ownerId;

  // 1. TICKET COMMANDS
  if (commandName === "ticket") {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const categorySlug = interaction.options.getString("category", true);
      const title = interaction.options.getString("title", true);

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

      const highestTicket = await prisma.ticket.findFirst({
        orderBy: { ticketNumber: "desc" },
      });
      const nextNumber = (highestTicket?.ticketNumber || 1000) + 1;

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

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/ticket create",
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        parameters: { ticketNumber: ticket.ticketNumber, category: category.name },
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.ticketNumber} Created`)
        .setDescription(
          `**${category.emoji || "📁"} ${category.name}**\n\n**Issue:** ${title}\n\nOur team will assist you shortly.`
        )
        .setColor(0xd4af37)
        .addFields(
          { name: "Priority", value: `\`${ticket.priority}\``, inline: true },
          { name: "Status", value: "`OPEN`", inline: true },
          { name: "Customer", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: "Cavrix Cloud Support Desk" })
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
      const staffMember = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
      });

      if (!staffMember || staffMember.role === "VIEWER") {
        await interaction.editReply({ content: "❌ You must have a staff role to claim tickets." });
        return;
      }

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

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/ticket claim",
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        parameters: { ticketNumber: ticket.ticketNumber },
      });

      await interaction.editReply({
        content: `✅ **Ticket #${ticket.ticketNumber}** has been claimed by <@${interaction.user.id}>.`,
      });
      return;
    }

    if (subcommand === "escalate") {
      const reason = interaction.options.getString("reason", true);
      const ticket = await prisma.ticket.findFirst({
        where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
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

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/ticket escalate",
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        parameters: { ticketNumber: ticket.ticketNumber, reason },
      });

      if (!res.success) {
        await interaction.editReply({ content: `❌ Escalation failed: ${res.error}` });
        return;
      }

      await interaction.editReply({ content: `🚨 **Ticket #${ticket.ticketNumber}** escalated. ${res.summary}` });
      return;
    }

    if (subcommand === "resolve") {
      const summary = interaction.options.getString("summary", true);
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

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/ticket resolve",
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        parameters: { ticketNumber: ticket.ticketNumber, summary },
      });

      await interaction.editReply({
        content: `✅ **Ticket #${ticket.ticketNumber}** has been marked **RESOLVED**. Summary: *${summary}*`,
      });
      return;
    }

    if (subcommand === "reopen") {
      const ticket = await prisma.ticket.findFirst({
        where: { status: "RESOLVED" },
        orderBy: { resolvedAt: "desc" },
      });

      if (!ticket) {
        await interaction.editReply({ content: "❌ No recently resolved ticket found to reopen." });
        return;
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "OPEN", reopenedAt: new Date() },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/ticket reopen",
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        parameters: { ticketNumber: ticket.ticketNumber },
      });

      await interaction.editReply({
        content: `🔄 **Ticket #${ticket.ticketNumber}** has been reopened.`,
      });
      return;
    }
  }

  // 2. PAYMENT COMMAND
  if (commandName === "pay") {
    const paymentMethods = await prisma.paymentQr.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    if (!paymentMethods.length) {
      await interaction.editReply({ content: "❌ No payment methods configured. Please contact server administration." });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("💳 Cavrix Cloud Official Payment Gateways")
      .setDescription("Please select your preferred payment method below. Send transaction confirmation in your ticket.")
      .setColor(0xd4af37)
      .setFooter({ text: "Cavrix Cloud Secure Billing • 100% Verified Gateways" })
      .setTimestamp();

    paymentMethods.forEach((m) => {
      embed.addFields({
        name: `${m.provider === "UPI" ? "🇮🇳" : m.provider === "CRYPTO" ? "🪙" : "💳"} ${m.title}`,
        value: `**Address / VPA:** \`${m.accountAddress}\`\n${m.note ? `*${m.note}*\n` : ""}${
          m.qrImageUrl ? `[View QR Image](${m.qrImageUrl})` : ""
        }`,
      });
    });

    const firstWithQr = paymentMethods.find((m) => m.qrImageUrl);
    if (firstWithQr?.qrImageUrl) {
      embed.setImage(firstWithQr.qrImageUrl);
    }

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 3. GIVEAWAY COMMAND
  if (commandName === "giveaway") {
    if (!isStaff) {
      await interaction.editReply({ content: "❌ Only server staff and administrators can manage giveaways." });
      return;
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const prize = interaction.options.getString("prize", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const winners = interaction.options.getInteger("winners") || 1;
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as any;

      const endsAt = new Date(Date.now() + minutes * 60 * 1000);

      const giveaway = await prisma.giveaway.create({
        data: {
          guildId: interaction.guildId || "UNKNOWN",
          channelId: channel?.id || interaction.channelId,
          prize,
          winnerCount: winners,
          endsAt,
          status: "ACTIVE",
          hostedByDiscordId: interaction.user.id,
          hostedByUsername: interaction.user.username,
          participants: JSON.stringify([]),
        },
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎉 GIVEAWAY: ${prize}`)
        .setDescription(
          `Click the button below to enter!\n\n**Winners:** \`${winners}\`\n**Hosted By:** <@${interaction.user.id}>\n**Ends:** <t:${Math.floor(
            endsAt.getTime() / 1000
          )}:R>`
        )
        .setColor(0xd4af37)
        .setFooter({ text: `Giveaway ID: ${giveaway.id}` })
        .setTimestamp(endsAt);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_enter_${giveaway.id}`)
          .setLabel("🎉 Enter Giveaway (0)")
          .setStyle(ButtonStyle.Success)
      );

      const sentMsg = await channel.send({ embeds: [embed], components: [row] });

      await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { messageId: sentMsg.id },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/giveaway start",
        guildId: interaction.guildId,
        channelId: channel.id,
        parameters: { prize, minutes, winners },
      });

      await interaction.editReply({ content: `✅ Giveaway started in <#${channel.id}>! ID: \`${giveaway.id}\`` });
      return;
    }

    if (sub === "end") {
      const id = interaction.options.getString("id", true);
      const giveaway = await prisma.giveaway.findUnique({ where: { id } });

      if (!giveaway || giveaway.status !== "ACTIVE") {
        await interaction.editReply({ content: "❌ Giveaway not found or already ended." });
        return;
      }

      const participants: string[] = giveaway.participants ? JSON.parse(giveaway.participants) : [];
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const selectedWinners = shuffled.slice(0, giveaway.winnerCount);

      await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { status: "ENDED", winners: JSON.stringify(selectedWinners) },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/giveaway end",
        guildId: interaction.guildId,
        parameters: { id, winners: selectedWinners },
      });

      await interaction.editReply({
        content: `🎉 Giveaway ended! Winner(s): ${
          selectedWinners.length ? selectedWinners.map((w) => `<@${w}>`).join(", ") : "No valid participants."
        }`,
      });
      return;
    }

    if (sub === "reroll") {
      const id = interaction.options.getString("id", true);
      const giveaway = await prisma.giveaway.findUnique({ where: { id } });

      if (!giveaway) {
        await interaction.editReply({ content: "❌ Giveaway not found." });
        return;
      }

      const participants: string[] = giveaway.participants ? JSON.parse(giveaway.participants) : [];
      if (!participants.length) {
        await interaction.editReply({ content: "❌ No participants found in this giveaway." });
        return;
      }

      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const newWinners = shuffled.slice(0, giveaway.winnerCount);

      await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { status: "REROLLED", winners: JSON.stringify(newWinners) },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/giveaway reroll",
        guildId: interaction.guildId,
        parameters: { id, winners: newWinners },
      });

      await interaction.editReply({
        content: `🎉 Giveaway rerolled! New Winner(s): ${newWinners.map((w) => `<@${w}>`).join(", ")}`,
      });
      return;
    }

    if (sub === "list") {
      const all = await prisma.giveaway.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const lines = all.map(
        (g) =>
          `• **${g.prize}** — Status: \`${g.status}\` | Winners: \`${g.winnerCount}\` | ID: \`${g.id.slice(0, 8)}...\``
      );

      const embed = new EmbedBuilder()
        .setTitle("🎉 Recent Server Giveaways")
        .setDescription(lines.length ? lines.join("\n") : "No giveaways recorded.")
        .setColor(0xd4af37)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  // 4. WARN COMMAND
  if (commandName === "warn") {
    if (!isStaff) {
      await interaction.editReply({ content: "❌ Only server staff can issue warnings." });
      return;
    }

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "Warned by staff";

    await prisma.punishment.create({
      data: {
        type: "WARN",
        guildId: interaction.guildId || "UNKNOWN",
        targetDiscordId: targetUser.id,
        targetUsername: targetUser.username,
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        reason,
        isActive: true,
      },
    });

    await logStaffCommandAudit({
      staffDiscordId: interaction.user.id,
      staffUsername: interaction.user.username,
      commandName: "/warn",
      targetDiscordId: targetUser.id,
      targetUsername: targetUser.username,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      parameters: { reason },
    });

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Official Warning Issued")
      .setDescription(`User <@${targetUser.id}> has received a recorded warning.`)
      .setColor(0xf59e0b)
      .addFields(
        { name: "Target", value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: "Staff Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Reason", value: reason, inline: false }
      )
      .setFooter({ text: "Cavrix Moderation Telemetry" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    try {
      await targetUser.send(`⚠️ You have received a formal warning in **${interaction.guild?.name}**.\nReason: *${reason}*`);
    } catch {}
    return;
  }

  // 5. PUNISHMENTS HISTORY
  if (commandName === "punishments") {
    const targetUser = interaction.options.getUser("user", true);
    const records = await prisma.punishment.findMany({
      where: { targetDiscordId: targetUser.id },
      orderBy: { createdAt: "desc" },
    });

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Moderation History: ${targetUser.tag}`)
      .setDescription(`Records for user <@${targetUser.id}>:`)
      .setColor(0xd4af37)
      .setFooter({ text: "Cavrix Cloud Security Telemetry" })
      .setTimestamp();

    if (!records.length) {
      embed.setDescription(`✅ No warnings, timeouts, or bans found for <@${targetUser.id}>. Clean record!`);
    } else {
      records.slice(0, 10).forEach((r, idx) => {
        embed.addFields({
          name: `#${idx + 1} [${r.type}] by ${r.staffUsername} • <t:${Math.floor(r.createdAt.getTime() / 1000)}:R>`,
          value: `Reason: *${r.reason || "No reason specified"}* ${
            r.durationMinutes ? `(Duration: ${r.durationMinutes}m)` : ""
          }`,
        });
      });
    }

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 6. UNBAN COMMAND
  if (commandName === "unban") {
    if (!isStaff) {
      await interaction.editReply({ content: "❌ Only server staff can unban members." });
      return;
    }

    const userId = interaction.options.getString("userid", true);

    try {
      await interaction.guild?.members.unban(userId);

      await prisma.punishment.create({
        data: {
          type: "UNBAN",
          guildId: interaction.guildId || "UNKNOWN",
          targetDiscordId: userId,
          targetUsername: "Unknown / ID",
          staffDiscordId: interaction.user.id,
          staffUsername: interaction.user.username,
          reason: "Unbanned by staff",
          isActive: false,
        },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/unban",
        targetDiscordId: userId,
        guildId: interaction.guildId,
      });

      await interaction.editReply({ content: `✅ Successfully unbanned user ID \`${userId}\`.` });
    } catch (err: any) {
      await interaction.editReply({ content: `❌ Failed to unban: ${err?.message || err}` });
    }
    return;
  }

  // 7. PANEL COMMAND
  if (commandName === "panel") {
    if (!isStaff) {
      await interaction.editReply({ content: "❌ Staff permission required to dispatch ticket panel." });
      return;
    }

    const config = await prisma.guildConfig.findFirst();
    const title = config?.ticketPanelTitle || "🎫 Cavrix Cloud Support Desk";
    const desc =
      config?.ticketPanelDescription ||
      "Click a button below to open a private ticket with our team. A dedicated channel with 24/7 SLA monitoring will be generated instantly for you.";
    const color = (config?.ticketPanelColor ? parseInt(config.ticketPanelColor.replace("#", ""), 16) : 0xd4af37) || 0xd4af37;

    const panelEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(desc)
      .setColor(color)
      .addFields(
        { name: "🛠️ Technical / Connectivity", value: "DDoS mitigation, latency, SSH, and server configuration", inline: false },
        { name: "💳 Billing & Upgrades", value: "Invoice inquiries, resource upgrades, and order assistance", inline: false }
      )
      .setFooter({ text: "Cavrix Cloud NetOps • 24/7 SLA Protected" });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create_vps-connectivity-network")
        .setLabel("Open Tech Support Ticket")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_create_billing-inquiries")
        .setLabel("Billing & Upgrade Support")
        .setStyle(ButtonStyle.Success)
    );

    await (interaction.channel as any).send({ embeds: [panelEmbed], components: [row] });
    await logStaffCommandAudit({
      staffDiscordId: interaction.user.id,
      staffUsername: interaction.user.username,
      commandName: "/panel",
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });

    await interaction.editReply({ content: "✅ Ticket panel sent to channel!" });
    return;
  }

  // 8. OWNER / ADMIN / APP-ADMIN MASTER COMMANDS
  if (commandName === "owner" || commandName === "app-admin" || commandName === "admin" || commandName === "app_admin") {
    const sub = interaction.options.getSubcommand();

    if (sub === "dashboard") {
      const embed = new EmbedBuilder()
        .setTitle("👑 Cavrix Bot Control Panel")
        .setDescription(
          `Directly manage ticket queues, staff command audits, live telemetry, giveaways, payment QR codes, and deletions.`
        )
        .setColor(0xd4af37)
        .addFields(
          { name: "🌐 Control Panel URL", value: `[${appUrl}/dashboard](${appUrl}/dashboard)`, inline: false },
          { name: "⚡ Gateway Status", value: `\`ONLINE & ACTIVE\``, inline: true },
          { name: "🔐 Staff Access", value: `\`ADMIN / NETOPS\``, inline: true }
        )
        .setFooter({ text: "Cavrix Cloud Control Panel • White, Gold & Black Edition" })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel("Open Web Dashboard").setStyle(ButtonStyle.Link).setURL(`${appUrl}/dashboard`),
        new ButtonBuilder().setLabel("Staff Login").setStyle(ButtonStyle.Link).setURL(`${appUrl}/login`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    if (sub === "prefix") {
      if (!isStaff) {
        await interaction.editReply({ content: "❌ Administrator permission is required to change prefix." });
        return;
      }
      const newPrefix = interaction.options.getString("prefix", true);
      if (interaction.guildId) {
        await prisma.guildConfig.upsert({
          where: { guildId: interaction.guildId },
          update: { prefix: newPrefix },
          create: { guildId: interaction.guildId, guildName: interaction.guild?.name || "Server", prefix: newPrefix },
        });
      }

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: `/${commandName} prefix`,
        guildId: interaction.guildId,
        parameters: { newPrefix },
      });

      await interaction.editReply({ content: `✅ Bot command prefix updated to **\`${newPrefix}\`**.` });
      return;
    }

    if (sub === "setup") {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply({ content: "❌ This command must be executed within a Discord server." });
        return;
      }

      if (!isStaff) {
        await interaction.editReply({ content: "❌ Administrator permission is required to run server setup." });
        return;
      }

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
        } catch {}
      }

      let transcriptChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && (c.name.includes("transcript") || c.name.includes("archive"))
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

      let auditChannel = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildText && (c.name.includes("audit") || c.name.includes("bot-log"))
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
        .setDescription(`Successfully linked and auto-configured channels for **${guild.name}**:`)
        .setColor(0xd4af37)
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
          }
        )
        .setFooter({ text: "Cavrix Cloud • Auto Configuration Completed" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "panel") {
      const config = await prisma.guildConfig.findFirst();
      const title = config?.ticketPanelTitle || "🎫 Cavrix Cloud Support Desk";
      const desc =
        config?.ticketPanelDescription ||
        "Click a button below to open a private ticket with our team. A dedicated channel with 24/7 SLA monitoring will be generated instantly for you.";
      const color = (config?.ticketPanelColor ? parseInt(config.ticketPanelColor.replace("#", ""), 16) : 0xd4af37) || 0xd4af37;

      const panelEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor(color)
        .addFields(
          { name: "🛠️ Technical / Connectivity", value: "DDoS mitigation, latency, SSH, and server configuration", inline: false },
          { name: "💳 Billing & Upgrades", value: "Invoice inquiries, resource upgrades, and order assistance", inline: false }
        )
        .setFooter({ text: "Cavrix Cloud NetOps • 24/7 SLA Protected" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_create_vps-connectivity-network")
          .setLabel("Open Tech Support Ticket")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ticket_create_billing-inquiries")
          .setLabel("Billing & Upgrade Support")
          .setStyle(ButtonStyle.Success)
      );

      await (interaction.channel as any).send({ embeds: [panelEmbed], components: [row] });
      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: `/${commandName} panel`,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
      });

      await interaction.editReply({ content: "✅ Ticket panel sent to channel!" });
      return;
    }

    if (sub === "verify") {
      const verifyEmbed = new EmbedBuilder()
        .setTitle("🛡️ Cavrix Cloud Member Verification")
        .setDescription(
          "Welcome to **Cavrix Cloud**.\n\nClick the button below to verify your account, unlock community discussions, product announcements, and VPS support."
        )
        .setColor(0xd4af37)
        .setFooter({ text: "Cavrix Cloud Security Protocol • Instant Access" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("verify_member").setLabel("Verify Account").setStyle(ButtonStyle.Success).setEmoji("✅")
      );

      await (interaction.channel as any).send({ embeds: [verifyEmbed], components: [row] });
      await interaction.editReply({ content: "✅ Verification panel dispatched." });
      return;
    }

    if (sub === "kick") {
      const guild = interaction.guild;
      const targetUser = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || "Kicked by Staff";

      if (!guild) return;
      try {
        const targetMember = await guild.members.fetch(targetUser.id);
        if (!targetMember.kickable) {
          await interaction.editReply({ content: "❌ I cannot kick this user (their role is higher or equal to my bot role)." });
          return;
        }

        await targetMember.kick(reason);

        await prisma.punishment.create({
          data: {
            type: "KICK",
            guildId: guild.id,
            targetDiscordId: targetUser.id,
            targetUsername: targetUser.username,
            staffDiscordId: interaction.user.id,
            staffUsername: interaction.user.username,
            reason,
            isActive: true,
          },
        });

        await logStaffCommandAudit({
          staffDiscordId: interaction.user.id,
          staffUsername: interaction.user.username,
          commandName: `/${commandName} kick`,
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          guildId: guild.id,
          channelId: interaction.channelId,
          parameters: { reason },
        });

        await interaction.editReply({ content: `👢 Member **${targetUser.tag}** was kicked. Reason: *${reason}*` });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Kick failed: ${err?.message || err}` });
      }
      return;
    }

    if (sub === "ban") {
      const guild = interaction.guild;
      const targetUser = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || "Banned by Staff";

      if (!guild) return;
      try {
        await guild.members.ban(targetUser.id, { reason });

        await prisma.punishment.create({
          data: {
            type: "BAN",
            guildId: guild.id,
            targetDiscordId: targetUser.id,
            targetUsername: targetUser.username,
            staffDiscordId: interaction.user.id,
            staffUsername: interaction.user.username,
            reason,
            isActive: true,
          },
        });

        await logStaffCommandAudit({
          staffDiscordId: interaction.user.id,
          staffUsername: interaction.user.username,
          commandName: `/${commandName} ban`,
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          guildId: guild.id,
          channelId: interaction.channelId,
          parameters: { reason },
        });

        await interaction.editReply({ content: `🔨 Member **${targetUser.tag}** was banned. Reason: *${reason}*` });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Ban failed: ${err?.message || err}` });
      }
      return;
    }

    if (sub === "timeout") {
      const guild = interaction.guild;
      const targetUser = interaction.options.getUser("user", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") || "Timed out by staff";

      if (!guild) return;
      try {
        const targetMember = await guild.members.fetch(targetUser.id);
        await targetMember.timeout(minutes * 60 * 1000, reason);

        await prisma.punishment.create({
          data: {
            type: "TIMEOUT",
            guildId: guild.id,
            targetDiscordId: targetUser.id,
            targetUsername: targetUser.username,
            staffDiscordId: interaction.user.id,
            staffUsername: interaction.user.username,
            reason,
            durationMinutes: minutes,
            isActive: true,
          },
        });

        await logStaffCommandAudit({
          staffDiscordId: interaction.user.id,
          staffUsername: interaction.user.username,
          commandName: `/${commandName} timeout`,
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          guildId: guild.id,
          channelId: interaction.channelId,
          parameters: { minutes, reason },
        });

        await interaction.editReply({
          content: `⏳ Member **${targetUser.tag}** timed out for **${minutes} minutes**. Reason: *${reason}*`,
        });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Timeout failed: ${err?.message || err}` });
      }
      return;
    }

    if (sub === "untimeout") {
      const guild = interaction.guild;
      const targetUser = interaction.options.getUser("user", true);

      if (!guild) return;
      try {
        const targetMember = await guild.members.fetch(targetUser.id);
        await targetMember.timeout(null);

        await prisma.punishment.create({
          data: {
            type: "UNTIMEOUT",
            guildId: guild.id,
            targetDiscordId: targetUser.id,
            targetUsername: targetUser.username,
            staffDiscordId: interaction.user.id,
            staffUsername: interaction.user.username,
            reason: "Timeout lifted",
            isActive: false,
          },
        });

        await logStaffCommandAudit({
          staffDiscordId: interaction.user.id,
          staffUsername: interaction.user.username,
          commandName: `/${commandName} untimeout`,
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          guildId: guild.id,
          channelId: interaction.channelId,
        });

        await interaction.editReply({ content: `✅ Timeout removed for **${targetUser.tag}**.` });
      } catch (err: any) {
        await interaction.editReply({ content: `❌ Failed to remove timeout: ${err?.message || err}` });
      }
      return;
    }

    if (sub === "staff-add") {
      const targetUser = interaction.options.getUser("user", true);
      const role = interaction.options.getString("role", true) as any;

      await prisma.user.upsert({
        where: { discordId: targetUser.id },
        update: {
          username: targetUser.username,
          avatar: targetUser.displayAvatarURL(),
          role,
          status: "ONLINE",
          lastActiveAt: new Date(),
        },
        create: {
          discordId: targetUser.id,
          username: targetUser.username,
          avatar: targetUser.displayAvatarURL(),
          role,
          status: "ONLINE",
          lastActiveAt: new Date(),
        },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: `/${commandName} staff-add`,
        targetDiscordId: targetUser.id,
        targetUsername: targetUser.username,
        guildId: interaction.guildId,
        parameters: { role },
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ Staff Privileges Granted")
        .setDescription(`User <@${targetUser.id}> has been assigned role **${role}** in database.`)
        .setColor(0xd4af37)
        .addFields(
          { name: "Staff Member", value: `${targetUser.tag}`, inline: true },
          { name: "Assigned Role", value: `\`${role}\``, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "staff-remove") {
      const targetUser = interaction.options.getUser("user", true);

      await prisma.user.upsert({
        where: { discordId: targetUser.id },
        update: { role: "VIEWER", status: "OFFLINE" },
        create: {
          discordId: targetUser.id,
          username: targetUser.username,
          role: "VIEWER",
          status: "OFFLINE",
        },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: `/${commandName} staff-remove`,
        targetDiscordId: targetUser.id,
        targetUsername: targetUser.username,
        guildId: interaction.guildId,
      });

      await interaction.editReply({ content: `❌ Revoked staff privileges for <@${targetUser.id}>.` });
      return;
    }

    if (sub === "staff-list") {
      const allStaff = await prisma.user.findMany({
        where: { role: { not: "VIEWER" } },
        orderBy: { role: "asc" },
      });

      const list = allStaff.map(
        (s) =>
          `• **${s.username}** (\`${s.role}\`) — Status: \`${s.status}\` | Resolved: \`${s.totalResolvedTickets}\` | ⭐ \`${s.avgRating.toFixed(1)}\``
      );

      const embed = new EmbedBuilder()
        .setTitle("🛡️ Registered Server Staff Directory")
        .setDescription(list.length ? list.join("\n") : "No staff members configured in database.")
        .setColor(0xd4af37)
        .setFooter({ text: "Cavrix Cloud NetOps" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "bot-status") {
      const activity = interaction.options.getString("activity", true);
      const typeStr = interaction.options.getString("type") || "Watching";

      let actType = ActivityType.Watching;
      if (typeStr === "Playing") actType = ActivityType.Playing;
      if (typeStr === "Listening") actType = ActivityType.Listening;
      if (typeStr === "Competing") actType = ActivityType.Competing;

      interaction.client.user?.setPresence({
        activities: [{ name: activity, type: actType }],
        status: "online",
      });

      await interaction.editReply({ content: `🤖 Bot presence updated to: **${typeStr} ${activity}**` });
      return;
    }

    if (sub === "host-info") {
      const memUsage = process.memoryUsage();
      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);

      const embed = new EmbedBuilder()
        .setTitle("🖥️ Cavrix Host Telemetry")
        .setColor(0xd4af37)
        .addFields(
          { name: "⚡ Gateway Latency", value: `\`${interaction.client.ws.ping} ms\``, inline: true },
          { name: "⏱️ Host Uptime", value: `\`${hours}h ${mins}m\``, inline: true },
          { name: "🧠 RAM (RSS)", value: `\`${Math.round(memUsage.rss / 1024 / 1024)} MB\``, inline: true },
          { name: "📦 Node Runtime", value: `\`${process.version}\``, inline: true },
          { name: "💻 OS Platform", value: `\`${os.type()} ${os.arch()}\``, inline: true }
        )
        .setFooter({ text: "Cavrix Cloud Host Controller" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  // 9. PURGE
  if (commandName === "purge") {
    if (!isStaff) {
      await interaction.editReply({ content: "❌ You need Manage Messages permission to use this command." });
      return;
    }

    const amount = interaction.options.getInteger("amount", true);
    const channel = interaction.channel;
    if (!channel || !("bulkDelete" in channel)) {
      await interaction.editReply({ content: "❌ Cannot purge in this channel." });
      return;
    }

    try {
      const deleted = await (channel as any).bulkDelete(amount, true);

      await prisma.deletionLog.create({
        data: {
          type: "BULK_MESSAGE",
          guildId: interaction.guildId,
          channelId: channel.id,
          channelName: "name" in channel ? (channel as any).name : undefined,
          deletedByDiscordId: interaction.user.id,
          deletedByUsername: interaction.user.username,
          count: deleted.size,
        },
      });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/purge",
        guildId: interaction.guildId,
        channelId: channel.id,
        parameters: { amount, deletedCount: deleted.size },
      });

      await interaction.editReply({ content: `🧹 Successfully purged **${deleted.size} messages**.` });
    } catch (err: any) {
      await interaction.editReply({ content: `❌ Purge error: ${err?.message || err}` });
    }
    return;
  }

  // 10. LOCK / UNLOCK
  if (commandName === "lock") {
    const guild = interaction.guild;
    const channel = interaction.channel;
    if (!guild || !channel || !("permissionOverwrites" in channel)) {
      await interaction.editReply({ content: "❌ Command must be used in a text channel." });
      return;
    }

    try {
      await (channel as any).permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      const lockEmbed = new EmbedBuilder()
        .setTitle("🔒 Channel Lockdown")
        .setDescription("This channel has been locked by administration.")
        .setColor(0xd4af37)
        .setTimestamp();
      await (channel as any).send({ embeds: [lockEmbed] });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/lock",
        guildId: interaction.guildId,
        channelId: channel.id,
      });

      await interaction.editReply({ content: "✅ Channel locked." });
    } catch (err: any) {
      await interaction.editReply({ content: `❌ Error: ${err?.message || err}` });
    }
    return;
  }

  if (commandName === "unlock") {
    const guild = interaction.guild;
    const channel = interaction.channel;
    if (!guild || !channel || !("permissionOverwrites" in channel)) {
      await interaction.editReply({ content: "❌ Command must be used in a text channel." });
      return;
    }

    try {
      await (channel as any).permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
      const unlockEmbed = new EmbedBuilder()
        .setTitle("🔓 Channel Unlocked")
        .setDescription("Lockdown lifted. Chatting is enabled.")
        .setColor(0xd4af37)
        .setTimestamp();
      await (channel as any).send({ embeds: [unlockEmbed] });

      await logStaffCommandAudit({
        staffDiscordId: interaction.user.id,
        staffUsername: interaction.user.username,
        commandName: "/unlock",
        guildId: interaction.guildId,
        channelId: channel.id,
      });

      await interaction.editReply({ content: "✅ Channel unlocked." });
    } catch (err: any) {
      await interaction.editReply({ content: `❌ Error: ${err?.message || err}` });
    }
    return;
  }

  // 11. ANNOUNCE
  if (commandName === "announce") {
    const targetChannel = interaction.options.getChannel("channel", true);
    const title = interaction.options.getString("title", true);
    const message = interaction.options.getString("message", true);
    const pingEveryone = interaction.options.getBoolean("ping_everyone") || false;

    if (!("send" in targetChannel)) {
      await interaction.editReply({ content: "❌ Invalid target text channel." });
      return;
    }

    const announceEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(0xd4af37)
      .setFooter({ text: "Cavrix Cloud Official Broadcast" })
      .setTimestamp();

    await (targetChannel as any).send({
      content: pingEveryone ? "@everyone" : undefined,
      embeds: [announceEmbed],
    });

    await logStaffCommandAudit({
      staffDiscordId: interaction.user.id,
      staffUsername: interaction.user.username,
      commandName: "/announce",
      guildId: interaction.guildId,
      channelId: (targetChannel as any).id,
      parameters: { title, pingEveryone },
    });

    await interaction.editReply({ content: `✅ Broadcasted to <#${(targetChannel as any).id}>!` });
    return;
  }

  // 12. STATUS
  if (commandName === "status") {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);

    const totalOpenTickets = await prisma.ticket.count({
      where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
    });

    const activeStaff = await prisma.user.count({
      where: { status: "ONLINE", role: { not: "VIEWER" } },
    });

    const embed = new EmbedBuilder()
      .setTitle("⚡ Cavrix Cloud System Status")
      .setColor(0xd4af37)
      .addFields(
        { name: "Gateway Latency", value: `\`${Math.round(interaction.client.ws.ping)} ms\``, inline: true },
        { name: "Host Uptime", value: `\`${hours}h ${mins}m\``, inline: true },
        { name: "Active Tickets", value: `\`${totalOpenTickets}\``, inline: true },
        { name: "Staff On Duty", value: `\`${activeStaff} Online\``, inline: true }
      )
      .setFooter({ text: "Cavrix Cloud Management System" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 13. SERVERINFO
  if (commandName === "serverinfo") {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: "❌ Must be run in a server." });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${guild.name} • Server Overview`)
      .setThumbnail(guild.iconURL() || "")
      .setColor(0xd4af37)
      .addFields(
        { name: "🆔 Server ID", value: `\`${guild.id}\``, inline: true },
        { name: "👑 Server Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Members Count", value: `\`${guild.memberCount}\``, inline: true },
        { name: "📁 Channels", value: `\`${guild.channels.cache.size}\``, inline: true },
        { name: "🏷️ Roles", value: `\`${guild.roles.cache.size}\``, inline: true }
      )
      .setFooter({ text: "Cavrix Cloud Intelligence System" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 14. HELP
  if (commandName === "help") {
    const guildConfig = await prisma.guildConfig.findFirst();
    const prefix = guildConfig?.prefix || "!";

    const embed = new EmbedBuilder()
      .setTitle("👑 Cavrix Cloud Support Bot Guide")
      .setDescription(
        `Bot Prefix: \`${prefix}\` | All features are also available as slash commands.`
      )
      .setColor(0xd4af37)
      .addFields(
        { name: "/ticket create", value: "Open a categorized support ticket.", inline: false },
        { name: "/pay", value: "View verified UPI QR codes and Crypto wallets.", inline: false },
        { name: "/giveaway start / end", value: "Create and roll server giveaways.", inline: false },
        { name: "/warn /timeout /kick /ban", value: "Staff moderation and telemetry tracking.", inline: false },
        { name: "/status", value: "View real-time support queue and bot metrics.", inline: false }
      )
      .setFooter({ text: "Cavrix Cloud Security Policy" });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 15. CALC
  if (commandName === "calc") {
    const cpu = interaction.options.getInteger("cpu", true);
    const ram = interaction.options.getInteger("ram", true);
    const nvme = interaction.options.getInteger("nvme", true);
    const bw = interaction.options.getInteger("bw") || 2;
    const ipv4 = interaction.options.getInteger("ipv4") || 1;
    const ddos = (interaction.options.getString("ddos") || "standard") as any;
    const backup = (interaction.options.getString("backup") || "weekly") as any;

    const specs: VpsSpecs = { cpu, ram, nvme, bandwidth: bw, ipv4, ddosTier: ddos, backupTier: backup };

    const configRecord = await prisma.hostingCalculatorConfig.findFirst({ where: { isActive: true } });
    const pricingConfig: PricingConfig = {
      basePrice: configRecord?.basePrice ?? 5.0,
      cpuCorePrice: configRecord?.cpuCorePrice ?? 2.5,
      ramGbPrice: configRecord?.ramGbPrice ?? 1.5,
      nvmeGbPrice: configRecord?.nvmeGbPrice ?? 0.1,
      bandwidthTbPrice: configRecord?.bandwidthTbPrice ?? 1.0,
      ipv4Price: configRecord?.ipv4Price ?? 2.0,
      ddosTierPrice: configRecord
        ? typeof configRecord.ddosTierPrice === "string"
          ? JSON.parse(configRecord.ddosTierPrice)
          : configRecord.ddosTierPrice
        : { standard: 0, advanced: 12, enterprise: 35 },
      backupTierPrice: configRecord
        ? typeof configRecord.backupTierPrice === "string"
          ? JSON.parse(configRecord.backupTierPrice)
          : configRecord.backupTierPrice
        : { none: 0, weekly: 4, daily: 8 },
      formulaExpression:
        configRecord?.formulaExpression ??
        "base + (cpu * cpuPrice) + (ram * ramPrice) + (nvme * nvmePrice) + (bw * bwPrice) + (ip * ipPrice) + ddos + backup",
    };

    const quote = calculateVpsPricing(specs, pricingConfig);

    const embed = new EmbedBuilder()
      .setTitle("⚡ VPS Pricing Calculator")
      .setDescription(`Monthly estimated cost: **$${quote.monthlyPrice.toFixed(2)} USD**`)
      .setColor(0xd4af37)
      .addFields(
        { name: "Hardware", value: `${cpu} vCPU • ${ram} GB RAM • ${nvme} GB NVMe`, inline: true },
        { name: "Network", value: `${bw} TB Bandwidth • ${ipv4} IPv4`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 16. KB
  if (commandName === "kb") {
    const query = interaction.options.getString("query", true);
    const articles = await searchKnowledgeBase(query);

    if (!articles.length) {
      await interaction.editReply({ content: `❌ No documentation found for query: *${query}*` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📚 Knowledge Base: "${query}"`)
      .setColor(0xd4af37);

    articles.slice(0, 3).forEach((a) => {
      embed.addFields({ name: a.title, value: a.content.slice(0, 200) + "..." });
    });

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // 17. STAFF
  if (commandName === "staff") {
    const sub = interaction.options.getSubcommand();
    let staffMember = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
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
        });
      } else {
        await prisma.user.update({
          where: { id: staffMember.id },
          data: { status: newState, lastActiveAt: new Date() },
        });
      }

      await interaction.editReply({
        content: `⏱️ Your staff shift status is now **${newState}**. The Web Console has been updated.`,
      });
      return;
    }

    if (sub === "stats") {
      if (!staffMember) {
        await interaction.editReply({ content: "❌ You are not registered in the staff roster yet." });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📊 Staff Telemetry: ${staffMember.username}`)
        .setColor(0xd4af37)
        .addFields(
          { name: "Shift Status", value: `\`${staffMember.status}\``, inline: true },
          { name: "Role", value: `\`${staffMember.role}\``, inline: true },
          { name: "Total Resolved", value: `\`${staffMember.totalResolvedTickets}\``, inline: true },
          { name: "CSAT Rating", value: `\`⭐ ${staffMember.avgRating.toFixed(1)} / 5.0\``, inline: true }
        )
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

      const lines = topStaff.map(
        (s, idx) => `**#${idx + 1}** **${s.username}** — \`${s.totalResolvedTickets} resolved\` • ⭐ \`${s.avgRating.toFixed(1)}\``
      );

      const embed = new EmbedBuilder()
        .setTitle("🏆 Staff Performance Leaderboard")
        .setDescription(lines.join("\n") || "No staff activity recorded.")
        .setColor(0xd4af37)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  }

  // Graceful fallback
  if (!interaction.replied) {
    await interaction.editReply({
      content: `⚡ Command \`/${commandName}\` acknowledged. Open the [Cavrix Control Panel](${appUrl}/dashboard).`,
    });
  }
}
