import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "../../lib/prisma";
import { escalateTicket } from "../../lib/escalation";
import { generateTicketTranscript } from "../../lib/transcripts";
import { logAuditEvent } from "../../lib/audit";

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const customId = interaction.customId;

  if (customId.startsWith("ticket_claim_")) {
    await interaction.deferReply({ ephemeral: true });
    const ticketId = customId.replace("ticket_claim_", "");

    const staffMember = await prisma.user.findUnique({
      where: { discordId: interaction.user.id },
    });

    if (!staffMember || staffMember.role === "VIEWER") {
      await interaction.editReply({ content: "❌ You must have an authorized staff role to claim tickets." });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      await interaction.editReply({ content: "❌ Ticket not found." });
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
      content: `✅ You have successfully claimed **Ticket #${ticket.ticketNumber}**. The dashboard and ticket channel have been updated.`,
    });
    return;
  }

  if (customId.startsWith("ticket_escalate_")) {
    await interaction.deferReply();
    const ticketId = customId.replace("ticket_escalate_", "");

    const res = await escalateTicket({
      ticketId,
      reason: "Customer clicked 'Escalate to Staff' button",
      actorDiscordId: interaction.user.id,
      actorUsername: interaction.user.username,
    });

    if (!res.success) {
      await interaction.editReply({ content: `❌ Escalation error: ${res.error}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🚨 Ticket Escalated to Support Staff")
      .setDescription(res.summary)
      .setColor(0xf59e0b)
      .setFooter({ text: "A staff member will take over this ticket shortly." })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (customId.startsWith("ticket_close_")) {
    await interaction.deferReply();
    const ticketId = customId.replace("ticket_close_", "");

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedStaff: true },
    });

    if (!ticket) {
      await interaction.editReply({ content: "❌ Ticket not found." });
      return;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        resolutionSummary: "Closed via Discord action button.",
      },
    });

    if (ticket.assignedStaffId) {
      await prisma.user.update({
        where: { id: ticket.assignedStaffId },
        data: { activeTicketsCount: { decrement: 1 } },
      });
    }

    // Auto-generate transcript
    await generateTicketTranscript(ticket.id);

    await logAuditEvent({
      actorDiscordId: interaction.user.id,
      actorUsername: interaction.user.username,
      action: "TICKET_CLOSE",
      targetType: "TICKET",
      targetId: ticket.id,
      details: { ticketNumber: ticket.ticketNumber },
    });

    const embed = new EmbedBuilder()
      .setTitle(`🔒 Ticket #${ticket.ticketNumber} Closed`)
      .setDescription("This support ticket has been closed. An archived transcript has been generated and saved to your dashboard.")
      .setColor(0x64748b)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Handle support ticket creation via button panel
  if (customId.startsWith("ticket_create_")) {
    await interaction.deferReply({ ephemeral: true });
    const categorySlug = customId.replace("ticket_create_", "");
    const guild = interaction.guild;

    if (!guild) {
      await interaction.editReply({ content: "❌ Tickets can only be created inside the server." });
      return;
    }

    // Check user active ticket limit
    const activeTicketsCount = await prisma.ticket.count({
      where: {
        customerDiscordId: interaction.user.id,
        status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] },
      },
    });

    const guildConfig = await prisma.guildConfig.findFirst({
      where: { guildId: guild.id },
    });
    const maxAllowed = guildConfig?.maxTicketsPerUser || 3;

    if (activeTicketsCount >= maxAllowed) {
      await interaction.editReply({
        content: `❌ You already have **${activeTicketsCount} active ticket(s)**. Maximum allowed is **${maxAllowed}**. Please resolve or close your previous tickets first.`,
      });
      return;
    }

    let category = await prisma.ticketCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      category = await prisma.ticketCategory.findFirst({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    }

    if (!category) {
      await interaction.editReply({ content: "❌ No ticket category configured in the system." });
      return;
    }

    // Determine next ticket number
    const highestTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: "desc" },
    });
    const nextNumber = (highestTicket?.ticketNumber || 1000) + 1;
    const channelName = `ticket-${nextNumber}`;

    // Create private ticket text channel
    let channel;
    try {
      const parentId = guildConfig?.ticketCategoryId || undefined;
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentId,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: guild.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ],
      });
    } catch (e: any) {
      try {
        channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
        });
      } catch (err: any) {
        await interaction.editReply({
          content: `❌ Failed to create ticket channel: ${err?.message || err}`,
        });
        return;
      }
    }

    // Save ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber,
        title: `${category.name} Issue`,
        categoryId: category.id,
        channelId: channel.id,
        customerDiscordId: interaction.user.id,
        customerUsername: interaction.user.username,
        customerAvatar: interaction.user.displayAvatarURL(),
        priority: category.defaultPriority || "MEDIUM",
        status: "OPEN",
        messages: {
          create: {
            senderDiscordId: interaction.user.id,
            senderUsername: interaction.user.username,
            senderAvatar: interaction.user.displayAvatarURL(),
            isStaff: false,
            content: `Support session initiated by ${interaction.user.username} via Support Desk button.`,
          },
        },
      },
    });

    // Send Luxury Gold ticket panel in the newly created channel
    const ticketEmbed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticket.ticketNumber} • ${category.name}`)
      .setDescription(
        `Welcome <@${interaction.user.id}>! A member of the Cavrix Cloud support team has been notified.\n\n` +
        `**Issue Category:** ${category.emoji || "📁"} ${category.name}\n` +
        `**Priority:** \`${ticket.priority}\` • **Target SLA:** < 15 minutes\n\n` +
        `Please describe your issue, provide relevant IP addresses, server IDs, or error logs below. Our staff will respond shortly.`
      )
      .setColor(0xD4AF37) // Luxury Gold
      .addFields(
        { name: "🛡️ Customer", value: `<@${interaction.user.id}>`, inline: true },
        { name: "⚡ Status", value: "`OPEN (Awaiting Staff)`", inline: true },
        { name: "🆔 Ticket Reference", value: `\`#${ticket.ticketNumber}\``, inline: true }
      )
      .setFooter({ text: "Cavrix Cloud NetOps • White, Gold & Black Edition" })
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim_${ticket.id}`)
        .setLabel("Claim Ticket")
        .setStyle(ButtonStyle.Success)
        .setEmoji("⚡"),
      new ButtonBuilder()
        .setCustomId(`ticket_escalate_${ticket.id}`)
        .setLabel("Escalate to Tier-2")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🚨"),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticket.id}`)
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    await channel.send({
      content: `<@${interaction.user.id}> Your private support channel is ready!`,
      embeds: [ticketEmbed],
      components: [actionRow],
    });

    await logAuditEvent({
      actorDiscordId: interaction.user.id,
      actorUsername: interaction.user.username,
      action: "TICKET_CREATE",
      targetType: "TICKET",
      targetId: ticket.id,
      details: { ticketNumber: ticket.ticketNumber, channelId: channel.id },
    });

    await interaction.editReply({
      content: `✅ Support ticket **#${ticket.ticketNumber}** created successfully! Please head over to <#${channel.id}>.`,
    });
    return;
  }

  // Giveaway Enter Button
  if (customId.startsWith("giveaway_enter_")) {
    await interaction.deferReply({ ephemeral: true });
    const giveawayId = customId.replace("giveaway_enter_", "");

    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
    });

    if (!giveaway || giveaway.status !== "ACTIVE") {
      await interaction.editReply({ content: "❌ This giveaway has ended or does not exist." });
      return;
    }

    const participants: string[] = giveaway.participants ? JSON.parse(giveaway.participants) : [];

    if (participants.includes(interaction.user.id)) {
      await interaction.editReply({
        content: `ℹ️ You are already entered into this giveaway for **${giveaway.prize}**! Entries: \`${participants.length}\`.`,
      });
      return;
    }

    participants.push(interaction.user.id);

    await prisma.giveaway.update({
      where: { id: giveaway.id },
      data: { participants: JSON.stringify(participants) },
    });

    // Update the button label on the original message if possible
    try {
      if (interaction.message) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_enter_${giveaway.id}`)
            .setLabel(`🎉 Enter Giveaway (${participants.length})`)
            .setStyle(ButtonStyle.Success)
        );
        await interaction.message.edit({ components: [row] });
      }
    } catch {}

    await interaction.editReply({
      content: `🎉 You have successfully entered the giveaway for **${giveaway.prize}**! Best of luck! (Total Entries: \`${participants.length}\`)`,
    });
    return;
  }

  // Verification button handler for Cavrix Cloud #verify channel
  if (customId === "verify_member" || customId === "verify_button" || customId.startsWith("verify_")) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guild = interaction.guild;
      const member = interaction.member;
      const verifiedRole = guild?.roles.cache.find(
        (r) => r.name.toLowerCase() === "verified" || r.name.toLowerCase() === "member"
      );
      if (verifiedRole && member && "roles" in member) {
        await (member as any).roles.add(verifiedRole);
      }
      await interaction.editReply({
        content: "✅ **Verification Successful!** Welcome to **Cavrix Cloud** (`CVRX`). You now have full access to all announcements, updates, and community channels.",
      });
    } catch {
      await interaction.editReply({
        content: "✅ **You are verified!** Welcome to **Cavrix Cloud** (`CVRX`).",
      });
    }
    return;
  }
}
