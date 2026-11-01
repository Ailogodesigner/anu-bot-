import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";
import { EmbedBuilder } from "discord.js";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const config = await prisma.guildConfig.findFirst();

    const channelId = body.channelId || config?.welcomeChannelId;
    if (!channelId) {
      return NextResponse.json(
        { error: "No welcome channel specified. Please set a Welcome Channel ID." },
        { status: 400 }
      );
    }

    const botClient = getBotClient();
    if (!botClient || !botClient.isReady()) {
      return NextResponse.json(
        { error: "Discord Bot is currently offline or reconnecting." },
        { status: 503 }
      );
    }

    const channel = await botClient.channels.fetch(channelId).catch(() => null);
    if (!channel || !("send" in channel)) {
      return NextResponse.json(
        { error: `Could not access channel ${channelId}. Check bot permissions.` },
        { status: 400 }
      );
    }

    const title = body.title || config?.welcomeTitle || "Welcome to Cavrix Cloud";
    let messageText =
      body.message ||
      config?.welcomeMessage ||
      "Welcome {user} to {server}! Verify in the verify channel.";
    messageText = messageText
      .replace(/{user}/g, `<@${user.discordId}>`)
      .replace(/{username}/g, user.username)
      .replace(/{server}/g, "Cavrix Cloud")
      .replace(/{memberCount}/g, "1,248");

    const colorHex = body.color || config?.welcomeColor || "#D4AF37";
    const color = parseInt(colorHex.replace("#", ""), 16) || 0xd4af37;

    const embed = new EmbedBuilder()
      .setTitle(`[TEST PREVIEW] ${title}`)
      .setDescription(messageText)
      .setColor(color)
      .setThumbnail(user.avatar || botClient.user?.displayAvatarURL() || "")
      .setFooter({ text: "Cavrix Cloud Welcome Preview • Test Mode" })
      .setTimestamp();

    const bannerUrl = body.bannerUrl || config?.welcomeBannerUrl;
    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }

    await (channel as any).send({ embeds: [embed] });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Test welcome error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
