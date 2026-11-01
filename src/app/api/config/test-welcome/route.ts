import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";
import { EmbedBuilder, REST, Routes } from "discord.js";

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
      .setFooter({ text: "Cavrix Cloud Welcome Preview • Test Mode" })
      .setTimestamp();

    const bannerUrl = body.bannerUrl || config?.welcomeBannerUrl;
    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }

    let sent = false;
    const botClient = getBotClient();

    if (botClient && botClient.isReady()) {
      try {
        const channel = await botClient.channels.fetch(channelId).catch(() => null);
        if (channel && "send" in channel) {
          await (channel as any).send({ embeds: [embed] });
          sent = true;
        }
      } catch (e: any) {
        console.warn("Gateway test welcome notice, trying REST API:", e?.message || e);
      }
    }

    if (!sent) {
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) {
        return NextResponse.json({ error: "DISCORD_BOT_TOKEN missing." }, { status: 500 });
      }
      const rest = new REST({ version: "10" }).setToken(token);
      await rest.post(Routes.channelMessages(channelId), {
        body: { embeds: [embed.toJSON()] },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Test welcome error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
