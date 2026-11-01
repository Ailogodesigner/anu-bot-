import { Client, GatewayIntentBits, REST, Routes, Events, ActivityType, EmbedBuilder } from "discord.js";
import { setBotClient } from "./discordService";
import { slashCommands, handleSlashCommand } from "./commands";
import { handleButtonInteraction } from "./handlers/buttonHandler";
import { handlePrefixCommand } from "./commands/prefixHandler";
import { prisma } from "../lib/prisma";
import { generateSupportResponse } from "../lib/ai";
import { escalateTicket } from "../lib/escalation";
import { processDueJobs } from "../lib/queue";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

const globalForBot = globalThis as unknown as {
  __discordClient?: Client;
  __discordInitialized?: boolean;
};

let client: Client;

if (!globalForBot.__discordClient) {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });
  globalForBot.__discordClient = client;

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`🤖 Discord Bot connected as ${readyClient.user.tag}`);
    setBotClient(readyClient);

    readyClient.user.setPresence({
      activities: [{ name: "Cavrix Cloud • /ticket", type: ActivityType.Watching }],
      status: "online",
    });

    // Register slash commands for all joined guilds (immediate sync) and globally
    if (token && clientId) {
      try {
        const rest = new REST({ version: "10" }).setToken(token);
        console.log("🔄 Registering slash commands with Discord API...");

        const body = slashCommands.map((c) => c.toJSON());

        // 1. Register to configured guild
        if (guildId) {
          try {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
            console.log(`✅ Registered slash commands for primary guild: ${guildId}`);
          } catch (guildErr: any) {
            console.warn(`⚠️ Guild command registration notice (${guildErr?.message})`);
          }
        }

        // 2. Register to all other guilds the bot is currently in (instant availability)
        for (const [gId, guild] of readyClient.guilds.cache) {
          if (gId !== guildId) {
            try {
              await rest.put(Routes.applicationGuildCommands(clientId, gId), { body });
              console.log(`✅ Registered slash commands for server: ${guild.name} (${gId})`);
            } catch {}
          }
        }

        // 3. Register global commands
        try {
          await rest.put(Routes.applicationCommands(clientId), { body });
          console.log("✅ Successfully registered global slash commands.");
        } catch (globalErr: any) {
          console.warn(`⚠️ Global command registration notice: ${globalErr?.message}`);
        }
      } catch (err) {
        console.error("❌ Failed to register Discord slash commands:", err);
      }
    }

    // Background job queue & giveaway winner polling loop (every 30 seconds)
    setInterval(async () => {
      try {
        await processDueJobs();

        // Check expiring giveaways
        const dueGiveaways = await prisma.giveaway.findMany({
          where: {
            status: "ACTIVE",
            endsAt: { lte: new Date() },
          },
        });

        for (const giveaway of dueGiveaways) {
          try {
            const participants: string[] = giveaway.participants ? JSON.parse(giveaway.participants) : [];
            const shuffled = [...participants].sort(() => 0.5 - Math.random());
            const winners = shuffled.slice(0, giveaway.winnerCount);

            await prisma.giveaway.update({
              where: { id: giveaway.id },
              data: {
                status: "ENDED",
                winners: JSON.stringify(winners),
              },
            });

            // Update Discord embed if message is accessible
            const channel = await readyClient.channels.fetch(giveaway.channelId).catch(() => null);
            if (channel && "send" in channel) {
              if (giveaway.messageId && "messages" in channel) {
                const msg = await (channel as any).messages.fetch(giveaway.messageId).catch(() => null);
                if (msg) {
                  const endEmbed = new EmbedBuilder()
                    .setTitle(`🎉 GIVEAWAY ENDED: ${giveaway.prize}`)
                    .setDescription(
                      `This giveaway has concluded!\n\n**Winner(s):** ${
                        winners.length ? winners.map((w) => `<@${w}>`).join(", ") : "No valid participants."
                      }\n**Hosted By:** <@${giveaway.hostedByDiscordId}>`
                    )
                    .setColor(0xd4af37)
                    .setFooter({ text: `Giveaway ID: ${giveaway.id}` })
                    .setTimestamp();

                  await msg.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
                }
              }

              if (winners.length) {
                await (channel as any).send(
                  `🎊 Congratulations to ${winners.map((w) => `<@${w}>`).join(", ")}! You won the giveaway for **${
                    giveaway.prize
                  }**!`
                );
              }
            }
          } catch (giveawayErr) {
            console.error("Error processing due giveaway:", giveawayErr);
          }
        }
      } catch (err) {
        console.error("Error in background polling loop:", err);
      }
    }, 30000);
  });

  // Interaction handler (Slash commands and buttons)
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        console.log(
          `[Discord Gateway] Slash command: /${interaction.commandName} from ${interaction.user.tag} (${interaction.user.id}) in guild ${interaction.guildId}`
        );
        await handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        console.log(
          `[Discord Gateway] Button clicked: ${interaction.customId} by ${interaction.user.tag} (${interaction.user.id})`
        );
        await handleButtonInteraction(interaction);
      }
    } catch (err: any) {
      if (err?.code === 10062 || err?.code === 40060) {
        return;
      }
      console.error("Interaction handling error:", err);
      try {
        if (interaction.isRepliable() && !interaction.replied) {
          const content = "❌ An unexpected error occurred while executing this command.";
          if (interaction.deferred) {
            await interaction.editReply({ content }).catch(() => {});
          } else {
            await interaction.reply({ content, ephemeral: true }).catch(() => {});
          }
        }
      } catch {}
    }
  });

  // Welcome Message on New Member Join
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const guildConfig = await prisma.guildConfig.findUnique({
        where: { guildId: member.guild.id },
      });

      if (!guildConfig || !guildConfig.welcomeEnabled) return;

      // Assign auto-role if configured
      if (guildConfig.autoRoleId) {
        try {
          const role = member.guild.roles.cache.get(guildConfig.autoRoleId);
          if (role) await member.roles.add(role);
        } catch (e) {
          console.warn("Failed to assign auto-role to new member:", e);
        }
      }

      // Send welcome embed to configured channel
      if (guildConfig.welcomeChannelId) {
        const welcomeChannel = member.guild.channels.cache.get(guildConfig.welcomeChannelId);
        if (welcomeChannel && "send" in welcomeChannel) {
          const title = guildConfig.welcomeTitle || "Welcome to Cavrix Cloud";
          let messageText =
            guildConfig.welcomeMessage || "Welcome {user} to {server}! Verify in the verify channel.";
          messageText = messageText
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, member.guild.name)
            .replace(/{memberCount}/g, String(member.guild.memberCount));

          const color =
            (guildConfig.welcomeColor ? parseInt(guildConfig.welcomeColor.replace("#", ""), 16) : 0xd4af37) ||
            0xd4af37;

          const welcomeEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(messageText)
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(color)
            .setFooter({ text: `${member.guild.name} • Member #${member.guild.memberCount}` })
            .setTimestamp();

          if (guildConfig.welcomeBannerUrl) {
            welcomeEmbed.setImage(guildConfig.welcomeBannerUrl);
          }

          await (welcomeChannel as any).send({ embeds: [welcomeEmbed] });
        }
      }
    } catch (welcomeErr) {
      console.error("Welcome handler error:", welcomeErr);
    }
  });

  // Message listener (Prefix Commands, Auto-responses, and Ticket Sync)
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    // Fetch guild config for prefix
    const guildConfig = message.guildId
      ? await prisma.guildConfig.findUnique({ where: { guildId: message.guildId } })
      : null;
    const prefix = guildConfig?.prefix || "!";

    // 1. Check for Command Prefix (e.g. !help, !ticket, !pay, etc.)
    if (message.content.startsWith(prefix)) {
      try {
        await handlePrefixCommand(message, prefix);
        return;
      } catch (prefixErr) {
        console.error("Prefix command error:", prefixErr);
      }
    }

    // 2. Check for Auto-responses
    try {
      const activeResponses = await prisma.autoResponse.findMany({
        where: { isActive: true },
      });

      const msgLower = message.content.toLowerCase().trim();

      for (const auto of activeResponses) {
        const trigLower = auto.trigger.toLowerCase().trim();
        let isMatch = false;

        if (auto.matchType === "EXACT") {
          isMatch = msgLower === trigLower;
        } else if (auto.matchType === "STARTS_WITH") {
          isMatch = msgLower.startsWith(trigLower);
        } else if (auto.matchType === "REGEX") {
          try {
            const regex = new RegExp(auto.trigger, "i");
            isMatch = regex.test(message.content);
          } catch {}
        } else {
          // CONTAINS
          isMatch = msgLower.includes(trigLower);
        }

        if (isMatch) {
          // Increment use count
          await prisma.autoResponse.update({
            where: { id: auto.id },
            data: { useCount: { increment: 1 } },
          });

          if (auto.embedTitle || auto.embedDescription) {
            const color =
              (auto.embedColor ? parseInt(auto.embedColor.replace("#", ""), 16) : 0xd4af37) || 0xd4af37;
            const embed = new EmbedBuilder()
              .setTitle(auto.embedTitle || "Cavrix Cloud")
              .setDescription(auto.embedDescription || auto.responseContent)
              .setColor(color)
              .setTimestamp();
            await message.reply({ embeds: [embed] });
          } else {
            await message.reply(auto.responseContent);
          }
          return;
        }
      }
    } catch (autoErr) {
      console.error("Auto response check error:", autoErr);
    }

    // 3. Ticket Conversation & AI Troubleshooting synchronization
    const ticket = await prisma.ticket.findFirst({
      where: { channelId: message.channel.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        assignedStaff: true,
      },
    });

    if (!ticket) return;

    let staffMember = await prisma.user.findUnique({
      where: { discordId: message.author.id },
    });

    const member = message.member;
    const isGuildStaff =
      member?.permissions.has("ManageChannels") ||
      member?.roles.cache.some((r) => {
        const n = r.name.toLowerCase();
        return n.includes("staff") || n.includes("support") || n.includes("admin") || n.includes("mod");
      }) ||
      false;

    const isStaff = staffMember?.role !== "VIEWER" && (!!staffMember || isGuildStaff);

    // Save message to database
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderDiscordId: message.author.id,
        senderUsername: message.author.username,
        senderAvatar: message.author.displayAvatarURL(),
        isStaff,
        isBot: false,
        isAi: false,
        content: message.content,
        discordMessageId: message.id,
      },
    });

    if (isStaff) {
      if (staffMember) {
        await prisma.user.update({
          where: { id: staffMember.id },
          data: { lastActiveAt: new Date(), status: "ONLINE" },
        });
      }

      if (!ticket.assignedStaffId && staffMember) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { assignedStaffId: staffMember.id, status: "STAFF_REPLY" },
        });
      } else if (ticket.status !== "STAFF_REPLY") {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: "STAFF_REPLY" },
        });
      }
      return;
    }

    // Customer message logic
    if (ticket.status === "STAFF_REPLY") {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "AWAITING_STAFF" },
      });
    }

    // AI Troubleshooting if ticket is still OPEN and unassigned
    if (ticket.status === "OPEN" && !ticket.assignedStaffId) {
      const history = ticket.messages.map((m) => ({
        role: (m.isStaff || m.isBot ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      }));

      const aiRes = await generateSupportResponse(message.content, history);

      if (aiRes.shouldEscalate) {
        await escalateTicket({
          ticketId: ticket.id,
          reason: aiRes.escalationReason || "Automated escalation triggered by customer message",
          actorDiscordId: "AI_ENGINE",
          actorUsername: "Cavrix AI Assistant",
          isAiTriggered: true,
        });

        await message.reply(
          `🚨 **Ticket #${ticket.ticketNumber} Escalated to Staff**\n${aiRes.reply}\n\nA support lead or assigned NetOps engineer has been notified.`
        );

        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderDiscordId: client.user?.id || "BOT",
            senderUsername: "Cavrix AI Assistant",
            isStaff: false,
            isBot: true,
            isAi: true,
            content: aiRes.reply,
          },
        });
      } else {
        const reply = await message.reply(aiRes.reply);

        await prisma.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderDiscordId: client.user?.id || "BOT",
            senderUsername: "Cavrix AI Assistant",
            isStaff: false,
            isBot: true,
            isAi: true,
            content: aiRes.reply,
            discordMessageId: reply.id,
          },
        });
      }
    }
  });

  // Message Delete Audit Log
  client.on(Events.MessageDelete, async (message) => {
    try {
      if (message.author?.bot) return;

      await prisma.deletionLog.create({
        data: {
          type: "MESSAGE",
          guildId: message.guildId,
          channelId: message.channel.id,
          channelName: "name" in message.channel ? (message.channel as any).name : undefined,
          authorDiscordId: message.author?.id,
          authorUsername: message.author?.username,
          content: message.content || "[Embed / Attachment / Empty]",
          count: 1,
        },
      });
    } catch {}
  });

  // Bulk Delete Audit Log
  client.on(Events.MessageBulkDelete, async (messages, channel) => {
    try {
      await prisma.deletionLog.create({
        data: {
          type: "BULK_MESSAGE",
          guildId: "guild" in channel ? (channel as any).guild?.id : undefined,
          channelId: channel.id,
          channelName: "name" in channel ? (channel as any).name : undefined,
          count: messages.size,
          content: `Bulk purge of ${messages.size} messages`,
        },
      });
    } catch {}
  });

  // Channel Delete Audit Log
  client.on(Events.ChannelDelete, async (channel) => {
    try {
      await prisma.deletionLog.create({
        data: {
          type: "CHANNEL",
          guildId: "guild" in channel ? (channel as any).guild?.id : undefined,
          channelId: channel.id,
          channelName: "name" in channel ? (channel as any).name : undefined,
          content: `Channel deleted: ${"name" in channel ? (channel as any).name : channel.id}`,
        },
      });
    } catch {}
  });

  // Launch client if token is present
  if (token && token !== "your_discord_bot_token_here") {
    client.login(token).catch((err) => {
      console.error("❌ Failed to log into Discord Gateway:", err);
    });
  }
} else {
  client = globalForBot.__discordClient;
}

export { client };
