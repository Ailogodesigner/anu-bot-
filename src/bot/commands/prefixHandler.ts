import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "../../lib/prisma";

export async function handlePrefixCommand(message: Message, prefix: string) {
  const content = message.content.slice(prefix.length).trim();
  const args = content.split(/\s+/);
  const command = (args.shift() || "").toLowerCase();

  if (!command) return;

  const member = message.member;
  const isStaff =
    member?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member?.permissions.has(PermissionFlagsBits.Administrator) ||
    member?.roles.cache.some((r) => {
      const n = r.name.toLowerCase();
      return n.includes("staff") || n.includes("support") || n.includes("admin") || n.includes("mod");
    }) ||
    false;

  // Helper to log staff command audit
  const logStaffCommand = async (commandName: string, targetUser?: { id: string; username: string }, params?: any) => {
    try {
      await prisma.staffCommandAudit.create({
        data: {
          staffDiscordId: message.author.id,
          staffUsername: message.author.username,
          commandName: `${prefix}${commandName}`,
          targetDiscordId: targetUser?.id || null,
          targetUsername: targetUser?.username || null,
          guildId: message.guildId,
          channelId: message.channel.id,
          channelName: "name" in message.channel ? (message.channel as any).name : "unknown",
          parameters: params ? JSON.stringify(params) : null,
          executionSource: "DISCORD",
        },
      });
    } catch (e) {
      console.error("Staff audit logging error:", e);
    }
  };

  // 1. HELP COMMAND
  if (command === "help") {
    const embed = new EmbedBuilder()
      .setTitle("👑 Cavrix Cloud Bot Command Guide")
      .setDescription(
        `Current Server Command Prefix: \`${prefix}\`\nYou can also use slash commands (e.g. \`/ticket\`, \`/pay\`, \`/giveaway\`).`
      )
      .setColor(0xd4af37)
      .addFields(
        {
          name: "🎫 Support Tickets",
          value: `\`${prefix}ticket [issue]\` — Open a private support ticket\n\`${prefix}status\` — Check bot latency and server telemetry`,
        },
        {
          name: "💳 Payments & Billing",
          value: `\`${prefix}pay\` — View UPI QR codes, Crypto wallets & PayPal instructions`,
        },
        {
          name: "🎉 Giveaways",
          value: `\`${prefix}giveaway start [minutes] [winners] [prize]\` — Host giveaway\n\`${prefix}giveaway reroll [giveaway_id]\` — Reroll winner`,
        },
        {
          name: "🛡️ Staff Moderation",
          value: `\`${prefix}warn @user [reason]\` — Warn user\n\`${prefix}timeout @user [minutes] [reason]\` — Timeout member\n\`${prefix}untimeout @user\` — Remove timeout\n\`${prefix}kick @user [reason]\` — Kick member\n\`${prefix}ban @user [reason]\` — Ban member\n\`${prefix}purge [1-100]\` — Bulk delete messages\n\`${prefix}lock\` / \`${prefix}unlock\` — Toggle channel chat`,
        },
        {
          name: "⚙️ Administration",
          value: `\`${prefix}prefix [symbol]\` — Change server command prefix\n\`${prefix}panel\` — Send luxury ticket desk embed`,
        }
      )
      .setFooter({ text: "Cavrix Cloud Control Panel • White, Gold & Black Edition" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }

  // 2. PAYMENT COMMAND
  if (command === "pay" || command === "payment" || command === "qr") {
    const paymentMethods = await prisma.paymentQr.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    if (!paymentMethods.length) {
      await message.reply("❌ No payment methods are currently active. Please contact server administration.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("💳 Cavrix Cloud Official Payment Gateways")
      .setDescription("Please select your preferred payment method below. Send transaction proof in your ticket.")
      .setColor(0xd4af37)
      .setFooter({ text: "Cavrix Cloud Secure Billing • 100% Verified Gateways" })
      .setTimestamp();

    paymentMethods.forEach((m) => {
      embed.addFields({
        name: `${m.provider === "UPI" ? "🇮🇳" : m.provider === "CRYPTO" ? "🪙" : "💳"} ${m.title}`,
        value: `**Address / VPA:** \`${m.accountAddress}\`\n${m.note ? `*${m.note}*\n` : ""}${
          m.qrImageUrl ? `[View QR Code](${m.qrImageUrl})` : ""
        }`,
      });
    });

    // If first has QR image, set as thumbnail or image
    const firstWithQr = paymentMethods.find((m) => m.qrImageUrl);
    if (firstWithQr?.qrImageUrl) {
      embed.setImage(firstWithQr.qrImageUrl);
    }

    await message.reply({ embeds: [embed] });
    return;
  }

  // 3. TICKET COMMAND
  if (command === "ticket") {
    const title = args.join(" ") || "General Support Inquiry";
    const category = await prisma.ticketCategory.findFirst({ where: { isActive: true } });
    if (!category) {
      await message.reply("❌ Support desk is temporarily unavailable.");
      return;
    }

    const highestTicket = await prisma.ticket.findFirst({ orderBy: { ticketNumber: "desc" } });
    const nextNumber = (highestTicket?.ticketNumber || 1000) + 1;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber,
        title,
        categoryId: category.id,
        customerDiscordId: message.author.id,
        customerUsername: message.author.username,
        customerAvatar: message.author.displayAvatarURL(),
        priority: "MEDIUM",
        status: "OPEN",
        messages: {
          create: {
            senderDiscordId: message.author.id,
            senderUsername: message.author.username,
            senderAvatar: message.author.displayAvatarURL(),
            isStaff: false,
            content: title,
          },
        },
      },
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticket.ticketNumber} Created`)
      .setDescription(`**Issue:** ${title}\n\nA support agent will assist you shortly.`)
      .setColor(0xd4af37)
      .addFields(
        { name: "Customer", value: `<@${message.author.id}>`, inline: true },
        { name: "Status", value: "`OPEN`", inline: true },
        { name: "Priority", value: "`MEDIUM`", inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }

  // 4. STATUS COMMAND
  if (command === "status") {
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = uptime % 60;

    const openTickets = await prisma.ticket.count({
      where: { status: { in: ["OPEN", "AWAITING_STAFF", "STAFF_REPLY"] } },
    });

    const embed = new EmbedBuilder()
      .setTitle("⚡ Cavrix Cloud Gateway Telemetry")
      .setColor(0xd4af37)
      .addFields(
        { name: "Gateway Latency", value: `\`${Math.round(message.client.ws.ping)} ms\``, inline: true },
        { name: "Uptime", value: `\`${hours}h ${mins}m ${secs}s\``, inline: true },
        { name: "Active Tickets", value: `\`${openTickets}\``, inline: true },
        { name: "Prefix", value: `\`${prefix}\``, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }

  // 5. CHANGE PREFIX (Staff / Admin Only)
  if (command === "prefix") {
    if (!isStaff) {
      await message.reply("❌ Administrator permission is required to change the bot prefix.");
      return;
    }
    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 5) {
      await message.reply(`❌ Please specify a valid prefix (1-5 characters). Example: \`${prefix}prefix !\``);
      return;
    }

    if (message.guildId) {
      await prisma.guildConfig.upsert({
        where: { guildId: message.guildId },
        update: { prefix: newPrefix },
        create: { guildId: message.guildId, guildName: message.guild?.name || "Server", prefix: newPrefix },
      });
    }

    await logStaffCommand("prefix", undefined, { oldPrefix: prefix, newPrefix });
    await message.reply(`✅ Command prefix updated to **\`${newPrefix}\`** for this server.`);
    return;
  }

  // 6. WARN USER (Staff Only)
  if (command === "warn") {
    if (!isStaff) {
      await message.reply("❌ You do not have permission to issue warnings.");
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      await message.reply(`❌ Usage: \`${prefix}warn @user [reason]\``);
      return;
    }

    const reason = args.slice(1).join(" ") || "Warned by Staff";

    await prisma.punishment.create({
      data: {
        type: "WARN",
        guildId: message.guildId || "UNKNOWN",
        targetDiscordId: targetUser.id,
        targetUsername: targetUser.username,
        staffDiscordId: message.author.id,
        staffUsername: message.author.username,
        reason,
        isActive: true,
      },
    });

    await logStaffCommand("warn", { id: targetUser.id, username: targetUser.username }, { reason });

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Member Formally Warned")
      .setDescription(`User <@${targetUser.id}> has received an official warning.`)
      .setColor(0xf59e0b)
      .addFields(
        { name: "Target", value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: "Moderator", value: `<@${message.author.id}>`, inline: true },
        { name: "Reason", value: reason, inline: false }
      )
      .setFooter({ text: "Cavrix Moderation Telemetry" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Try sending DM to warned user
    try {
      await targetUser.send(`⚠️ You received a formal warning in **${message.guild?.name}**.\nReason: *${reason}*`);
    } catch {}
    return;
  }

  // 7. TIMEOUT / MUTE (Staff Only)
  if (command === "timeout" || command === "mute") {
    if (!isStaff) {
      await message.reply("❌ You do not have permission to timeout members.");
      return;
    }

    const targetUser = message.mentions.users.first();
    const minutes = parseInt(args[1], 10);

    if (!targetUser || isNaN(minutes) || minutes < 1) {
      await message.reply(`❌ Usage: \`${prefix}timeout @user [minutes] [reason]\``);
      return;
    }

    const reason = args.slice(2).join(" ") || "Timed out by Staff";

    try {
      const targetMember = await message.guild?.members.fetch(targetUser.id);
      if (!targetMember) throw new Error("Member not in server");

      await targetMember.timeout(minutes * 60 * 1000, reason);

      await prisma.punishment.create({
        data: {
          type: "TIMEOUT",
          guildId: message.guildId || "UNKNOWN",
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          staffDiscordId: message.author.id,
          staffUsername: message.author.username,
          reason,
          durationMinutes: minutes,
          isActive: true,
        },
      });

      await logStaffCommand("timeout", { id: targetUser.id, username: targetUser.username }, { minutes, reason });

      const embed = new EmbedBuilder()
        .setTitle("⏳ Member Timed Out")
        .setDescription(`User <@${targetUser.id}> has been timed out for **${minutes} minutes**.`)
        .setColor(0xd4af37)
        .addFields(
          { name: "Target", value: `${targetUser.tag}`, inline: true },
          { name: "Duration", value: `${minutes}m`, inline: true },
          { name: "Reason", value: reason, inline: false }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (err: any) {
      await message.reply(`❌ Failed to timeout member: ${err?.message || err}`);
    }
    return;
  }

  // 8. UNTIMEOUT (Staff Only)
  if (command === "untimeout" || command === "unmute") {
    if (!isStaff) {
      await message.reply("❌ You do not have permission to remove timeouts.");
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      await message.reply(`❌ Usage: \`${prefix}untimeout @user\``);
      return;
    }

    try {
      const targetMember = await message.guild?.members.fetch(targetUser.id);
      await targetMember?.timeout(null);

      await prisma.punishment.create({
        data: {
          type: "UNTIMEOUT",
          guildId: message.guildId || "UNKNOWN",
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          staffDiscordId: message.author.id,
          staffUsername: message.author.username,
          reason: "Timeout lifted by staff",
          isActive: false,
        },
      });

      await logStaffCommand("untimeout", { id: targetUser.id, username: targetUser.username });
      await message.reply(`✅ Timeout lifted for <@${targetUser.id}>.`);
    } catch (err: any) {
      await message.reply(`❌ Failed to lift timeout: ${err?.message || err}`);
    }
    return;
  }

  // 9. KICK (Staff Only)
  if (command === "kick") {
    if (!isStaff) {
      await message.reply("❌ You do not have permission to kick members.");
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      await message.reply(`❌ Usage: \`${prefix}kick @user [reason]\``);
      return;
    }

    const reason = args.slice(1).join(" ") || "Kicked by Staff";

    try {
      const targetMember = await message.guild?.members.fetch(targetUser.id);
      if (!targetMember?.kickable) {
        await message.reply("❌ Cannot kick this user (their role is higher or equal to bot role).");
        return;
      }

      await targetMember.kick(reason);

      await prisma.punishment.create({
        data: {
          type: "KICK",
          guildId: message.guildId || "UNKNOWN",
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          staffDiscordId: message.author.id,
          staffUsername: message.author.username,
          reason,
          isActive: true,
        },
      });

      await logStaffCommand("kick", { id: targetUser.id, username: targetUser.username }, { reason });
      await message.reply(`👢 Member **${targetUser.tag}** was kicked. Reason: *${reason}*`);
    } catch (err: any) {
      await message.reply(`❌ Kick failed: ${err?.message || err}`);
    }
    return;
  }

  // 10. BAN (Staff Only)
  if (command === "ban") {
    if (!isStaff) {
      await message.reply("❌ You do not have permission to ban members.");
      return;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      await message.reply(`❌ Usage: \`${prefix}ban @user [reason]\``);
      return;
    }

    const reason = args.slice(1).join(" ") || "Banned by Staff";

    try {
      await message.guild?.members.ban(targetUser.id, { reason });

      await prisma.punishment.create({
        data: {
          type: "BAN",
          guildId: message.guildId || "UNKNOWN",
          targetDiscordId: targetUser.id,
          targetUsername: targetUser.username,
          staffDiscordId: message.author.id,
          staffUsername: message.author.username,
          reason,
          isActive: true,
        },
      });

      await logStaffCommand("ban", { id: targetUser.id, username: targetUser.username }, { reason });
      await message.reply(`🔨 Member **${targetUser.tag}** was banned. Reason: *${reason}*`);
    } catch (err: any) {
      await message.reply(`❌ Ban failed: ${err?.message || err}`);
    }
    return;
  }

  // 11. PURGE (Staff Only)
  if (command === "purge" || command === "clear") {
    if (!isStaff) {
      await message.reply("❌ You do not have permission to purge messages.");
      return;
    }

    const count = parseInt(args[0], 10);
    if (isNaN(count) || count < 1 || count > 100) {
      await message.reply(`❌ Please specify a valid number between 1 and 100. Example: \`${prefix}purge 15\``);
      return;
    }

    try {
      if ("bulkDelete" in message.channel) {
        const deleted = await (message.channel as any).bulkDelete(count + 1, true);

        await prisma.deletionLog.create({
          data: {
            type: "BULK_MESSAGE",
            guildId: message.guildId,
            channelId: message.channel.id,
            channelName: "name" in message.channel ? (message.channel as any).name : "unknown",
            deletedByDiscordId: message.author.id,
            deletedByUsername: message.author.username,
            count: deleted.size,
          },
        });

        await logStaffCommand("purge", undefined, { count: deleted.size });

        const notice = await (message.channel as any).send(
          `🧹 Cleaned up **${deleted.size - 1}** messages by <@${message.author.id}>.`
        );
        setTimeout(() => notice.delete().catch(() => {}), 4000);
      }
    } catch (err: any) {
      await message.reply(`❌ Purge failed: ${err?.message || err}`);
    }
    return;
  }

  // 12. LOCK / UNLOCK (Staff Only)
  if (command === "lock") {
    if (!isStaff || !message.guild) return;
    try {
      await (message.channel as any).permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      });
      await logStaffCommand("lock");
      await message.reply("🔒 Channel locked. Members cannot send messages.");
    } catch (e: any) {
      await message.reply(`❌ Lock failed: ${e?.message}`);
    }
    return;
  }

  if (command === "unlock") {
    if (!isStaff || !message.guild) return;
    try {
      await (message.channel as any).permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null,
      });
      await logStaffCommand("unlock");
      await message.reply("🔓 Channel unlocked. Chat restored.");
    } catch (e: any) {
      await message.reply(`❌ Unlock failed: ${e?.message}`);
    }
    return;
  }

  // 13. TICKET PANEL DISPATCH (Staff Only)
  if (command === "panel") {
    if (!isStaff) return;
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

    await (message.channel as any).send({ embeds: [panelEmbed], components: [row] });
    await logStaffCommand("panel");
    return;
  }

  // 14. GIVEAWAY COMMAND (Staff Only)
  if (command === "giveaway") {
    if (!isStaff) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "start") {
      const minutes = parseInt(args[1], 10) || 60;
      const winners = parseInt(args[2], 10) || 1;
      const prize = args.slice(3).join(" ") || "1 Month Cavrix VPS Nitro";

      const endsAt = new Date(Date.now() + minutes * 60 * 1000);

      const giveaway = await prisma.giveaway.create({
        data: {
          guildId: message.guildId || "UNKNOWN",
          channelId: message.channel.id,
          prize,
          winnerCount: winners,
          endsAt,
          status: "ACTIVE",
          hostedByDiscordId: message.author.id,
          hostedByUsername: message.author.username,
          participants: JSON.stringify([]),
        },
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎉 GIVEAWAY: ${prize}`)
        .setDescription(
          `Click the button below to enter!\n\n**Winners:** \`${winners}\`\n**Hosted By:** <@${message.author.id}>\n**Ends:** <t:${Math.floor(
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

      const sentMsg = await (message.channel as any).send({ embeds: [embed], components: [row] });

      await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { messageId: sentMsg.id },
      });

      await logStaffCommand("giveaway-start", undefined, { prize, minutes, winners });
      return;
    }

    if (sub === "reroll") {
      const id = args[1];
      if (!id) {
        await message.reply(`❌ Usage: \`${prefix}giveaway reroll [giveaway_id]\``);
        return;
      }

      const giveaway = await prisma.giveaway.findUnique({ where: { id } });
      if (!giveaway) {
        await message.reply("❌ Giveaway not found.");
        return;
      }

      const participants: string[] = giveaway.participants ? JSON.parse(giveaway.participants) : [];
      if (!participants.length) {
        await message.reply("❌ No participants entered this giveaway.");
        return;
      }

      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const newWinners = shuffled.slice(0, giveaway.winnerCount);

      await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { winners: JSON.stringify(newWinners), status: "REROLLED" },
      });

      await logStaffCommand("giveaway-reroll", undefined, { id, newWinners });

      await message.reply(
        `🎉 **Giveaway Rerolled!** New winner(s) for **${giveaway.prize}**: ${newWinners.map((w) => `<@${w}>`).join(", ")}! Congratulations!`
      );
      return;
    }

    await message.reply(`❌ Usage: \`${prefix}giveaway start [minutes] [winners] [prize]\` or \`${prefix}giveaway reroll [id]\``);
    return;
  }
}

