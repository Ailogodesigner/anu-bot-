import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } from "discord.js";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const config = await prisma.guildConfig.findFirst();

    const channelId = body.channelId || config?.ticketPanelChannelId;
    if (!channelId) {
      return NextResponse.json(
        { error: "No channel ID provided. Please specify a Discord channel ID." },
        { status: 400 }
      );
    }

    const title = body.title || config?.ticketPanelTitle || "🎫 Cavrix Cloud Support Desk";
    const description =
      body.description ||
      config?.ticketPanelDescription ||
      "Select a department below to create a secure 1-on-1 support ticket.";
    const colorHex = body.color || config?.ticketPanelColor || "#D4AF37";
    const color = parseInt(colorHex.replace("#", ""), 16) || 0xd4af37;

    const panelEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .addFields(
        {
          name: "🛒 Buy",
          value: "Purchase VPS hosting, dedicated server nodes & custom upgrades",
          inline: false,
        },
        {
          name: "💬 Support",
          value: "General questions, billing assistance, and account guidance",
          inline: false,
        },
        {
          name: "🎁 Claim",
          value: "Claim giveaway prizes, event rewards, invite perks & VIP roles",
          inline: false,
        },
        {
          name: "⚙️ Technical Issues",
          value: "DDoS mitigation, latency, SSH access & server troubleshooting",
          inline: false,
        },
        {
          name: "📢 Promotion",
          value: "Partnership inquiries, sponsorships, bot invites & collabs",
          inline: false,
        }
      )
      .setFooter({ text: "Cavrix Cloud Operations • 24/7 SLA Protected" });

    // 5 Distinct Luxury Action Buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create_buy")
        .setLabel("Buy")
        .setEmoji("🛒")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("ticket_create_support")
        .setLabel("Support")
        .setEmoji("💬")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_create_claim")
        .setLabel("Claim")
        .setEmoji("🎁")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket_create_technical-issues")
        .setLabel("Technical Issues")
        .setEmoji("⚙️")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket_create_promotion")
        .setLabel("Promotion")
        .setEmoji("📢")
        .setStyle(ButtonStyle.Secondary)
    );

    let sentMessageId: string | null = null;
    const botClient = getBotClient();

    // 1. Try via Gateway Client if connected
    if (botClient && botClient.isReady()) {
      try {
        const channel = await botClient.channels.fetch(channelId).catch(() => null);
        if (channel && "send" in channel) {
          const sent = await (channel as any).send({ embeds: [panelEmbed], components: [row] });
          sentMessageId = sent.id;
        }
      } catch (err: any) {
        console.warn("Gateway send notice, trying REST API:", err?.message || err);
      }
    }

    // 2. Direct Discord REST API fallback (Always works via HTTPS without WebSocket gateway)
    if (!sentMessageId) {
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) {
        return NextResponse.json({ error: "DISCORD_BOT_TOKEN is missing." }, { status: 500 });
      }
      try {
        const rest = new REST({ version: "10" }).setToken(token);
        const res: any = await rest.post(Routes.channelMessages(channelId), {
          body: {
            embeds: [panelEmbed.toJSON()],
            components: [row.toJSON()],
          },
        });
        sentMessageId = res?.id;
      } catch (restErr: any) {
        console.error("REST API dispatch error:", restErr);
        return NextResponse.json(
          { error: `Discord API error: ${restErr?.message || "Failed to post message to channel"}. Please check bot channel permissions.` },
          { status: 400 }
        );
      }
    }

    // Save channel ID in database
    if (config) {
      await prisma.guildConfig.update({
        where: { id: config.id },
        data: { ticketPanelChannelId: channelId },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: sentMessageId,
      channelId,
    });
  } catch (err: any) {
    console.error("Dispatch panel error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
