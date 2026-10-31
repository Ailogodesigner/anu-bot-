import { Client, GatewayIntentBits, REST, Routes, Events, ActivityType } from "discord.js";
import { setBotClient } from "./discordService";
import { slashCommands, handleSlashCommand } from "./commands";
import { handleButtonInteraction } from "./handlers/buttonHandler";
import { prisma } from "../lib/prisma";
import { generateSupportResponse } from "../lib/ai";
import { escalateTicket } from "../lib/escalation";
import { processDueJobs } from "../lib/queue";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🤖 Discord Bot connected as ${readyClient.user.tag}`);
  setBotClient(readyClient);

  readyClient.user.setPresence({
    activities: [{ name: "Cavrix Cloud • /ticket", type: ActivityType.Watching }],
    status: "online",
  });

  // Register slash commands if client credentials are provided
  if (token && clientId) {
    try {
      const rest = new REST({ version: "10" }).setToken(token);
      console.log("🔄 Registering slash commands with Discord API...");

      const body = slashCommands.map((c) => c.toJSON());

      if (guildId) {
        try {
          await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
          console.log(`✅ Successfully registered slash commands for guild: ${guildId}`);
        } catch (guildErr: any) {
          console.warn(`⚠️ Guild-specific command registration notice (${guildErr?.message}).`);
        }
      }
      try {
        await rest.put(Routes.applicationCommands(clientId), { body });
        console.log("✅ Successfully registered global slash commands.");
      } catch (globalErr: any) {
        console.warn("⚠️ Global command registration notice:", globalErr?.message);
      }
    } catch (err) {
      console.error("❌ Failed to register Discord slash commands:", err);
    }
  }

  // Start background job queue polling loop (every 30 seconds)
  setInterval(async () => {
    try {
      await processDueJobs();
    } catch (err) {
      console.error("Error processing scheduled queue jobs:", err);
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
  } catch (err) {
    console.error("Interaction handling error:", err);
    if (interaction.isRepliable() && !interaction.replied) {
      const content = "❌ An unexpected error occurred while executing this command.";
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
});

// Message listener for Ticket Conversation & AI Troubleshooting synchronization
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if this channel is a registered ticket channel
  const ticket = await prisma.ticket.findFirst({
    where: { channelId: message.channel.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      assignedStaff: true,
    },
  });

  if (!ticket) return;

  // Determine if sender is staff
  let staffMember = await prisma.user.findUnique({
    where: { discordId: message.author.id },
  });

  const member = message.member;
  const isGuildStaff = member?.permissions.has("ManageChannels") || 
    member?.roles.cache.some((r) => {
      const n = r.name.toLowerCase();
      return n.includes("staff") || n.includes("support") || n.includes("admin") || n.includes("lead") || n.includes("mod");
    });

  if (!staffMember && isGuildStaff) {
    staffMember = await prisma.user.create({
      data: {
        discordId: message.author.id,
        username: message.author.username,
        avatar: message.author.displayAvatarURL(),
        role: member?.permissions.has("Administrator") ? "ADMIN" : "SUPPORT_AGENT",
        status: "ONLINE",
        lastActiveAt: new Date(),
      },
    });
  }

  const isStaff = !!(staffMember && staffMember.role !== "VIEWER") || !!isGuildStaff;

  // 1. Record incoming message in database
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

  // If staff replied, track staff activity and update ticket
  if (isStaff && staffMember) {
    const isFirstClaim = !ticket.assignedStaffId;
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "STAFF_REPLY",
        ...(isFirstClaim ? { assignedStaffId: staffMember.id, claimedAt: new Date() } : {}),
      },
    });

    await prisma.user.update({
      where: { id: staffMember.id },
      data: {
        lastActiveAt: new Date(),
        status: "ONLINE",
        ...(isFirstClaim ? { activeTicketsCount: { increment: 1 } } : {}),
      },
    });
    return;
  }

  // If customer replied and ticket is open, invoke AI assistant or check escalation
  if (!isStaff && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    // If ticket is already awaiting staff, inform customer without spamming
    if (ticket.status === "AWAITING_STAFF") {
      return;
    }

    // Call AI support service
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

      // Send escalation response to Discord
      await message.reply(
        `🚨 **Ticket #${ticket.ticketNumber} Escalated to Staff**\n${aiRes.reply}\n\nA support lead or assigned NetOps engineer has been notified.`
      );

      // Record in DB
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
      // Send regular AI troubleshooting response
      const reply = await message.reply(aiRes.reply);

      // Record in DB
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

// Launch client if token is present, else log configuration guide
if (!token || token === "your_discord_bot_token_here") {
  console.log("------------------------------------------------------------------");
  console.log("⚠️  DISCORD_BOT_TOKEN is not configured in your environment.");
  console.log("ℹ️  The bot process is in Standby / Testing mode.");
  console.log("ℹ️  Configure DISCORD_BOT_TOKEN in .env when ready to connect to Discord Gateway.");
  console.log("ℹ️  Background job worker & API endpoints are active.");
  console.log("------------------------------------------------------------------");

  // Still run the persistent scheduled job queue worker
  setInterval(async () => {
    try {
      await processDueJobs();
    } catch (err) {
      console.error("Queue worker error:", err);
    }
  }, 30000);
} else {
  client.login(token).catch((err) => {
    console.error("❌ Failed to log into Discord Gateway:", err);
  });
}
