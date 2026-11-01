import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

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

    const botClient = getBotClient();
    if (!botClient || !botClient.isReady()) {
      return NextResponse.json(
        { error: "Discord Bot is currently offline or reconnecting to gateway." },
        { status: 503 }
      );
    }

    const channel = await botClient.channels.fetch(channelId).catch(() => null);
    if (!channel || !("send" in channel)) {
      return NextResponse.json(
        { error: `Could not access text channel ${channelId}. Check bot permissions.` },
        { status: 400 }
      );
    }

    const title = body.title || config?.ticketPanelTitle || "🎫 Cavrix Cloud Support Desk";
    const description =
      body.description ||
      config?.ticketPanelDescription ||
      "Click a button below to open a private ticket with our team. A dedicated channel with 24/7 SLA monitoring will be generated instantly for you.";
    const colorHex = body.color || config?.ticketPanelColor || "#D4AF37";
    const color = parseInt(colorHex.replace("#", ""), 16) || 0xd4af37;

    const panelEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
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
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_create_billing-inquiries")
        .setLabel("Billing & Upgrade Support")
        .setStyle(ButtonStyle.Success)
    );

    const sent = await (channel as any).send({ embeds: [panelEmbed], components: [row] });

    // Save channel ID if updated
    if (config) {
      await prisma.guildConfig.update({
        where: { id: config.id },
        data: { ticketPanelChannelId: channelId },
      });
    }

    return NextResponse.json({
      success: true,
      messageId: sent.id,
      channelId,
    });
  } catch (err: any) {
    console.error("Dispatch panel error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
