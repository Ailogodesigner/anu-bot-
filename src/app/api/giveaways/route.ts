import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export async function GET() {
  try {
    const giveaways = await prisma.giveaway.findMany({
      orderBy: { createdAt: "desc" },
    });

    const parsed = giveaways.map((g) => ({
      ...g,
      participantsCount: g.participants ? JSON.parse(g.participants).length : 0,
      participants: g.participants ? JSON.parse(g.participants) : [],
      winners: g.winners ? JSON.parse(g.winners) : [],
    }));

    return NextResponse.json({ success: true, giveaways: parsed });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prize, durationMinutes, winnerCount, channelId } = body;

    if (!prize || !durationMinutes) {
      return NextResponse.json({ error: "Prize and duration are required." }, { status: 400 });
    }

    const config = await prisma.guildConfig.findFirst();
    const targetChannelId = channelId || config?.announcementChannelId || config?.transcriptChannelId;

    const botClient = getBotClient();
    const guildId = config?.guildId || process.env.DISCORD_GUILD_ID || "1519559734808674444";
    const endsAt = new Date(Date.now() + Number(durationMinutes) * 60 * 1000);

    const giveaway = await prisma.giveaway.create({
      data: {
        guildId,
        channelId: targetChannelId || "PENDING",
        prize,
        winnerCount: Number(winnerCount) || 1,
        endsAt,
        status: "ACTIVE",
        hostedByDiscordId: user.discordId,
        hostedByUsername: user.username,
        participants: JSON.stringify([]),
      },
    });

    // Try posting to Discord channel if bot is ready
    if (botClient && botClient.isReady() && targetChannelId) {
      const channel = await botClient.channels.fetch(targetChannelId).catch(() => null);
      if (channel && "send" in channel) {
        const embed = new EmbedBuilder()
          .setTitle(`🎉 GIVEAWAY: ${prize}`)
          .setDescription(
            `Click the button below to enter!\n\n**Winners:** \`${winnerCount || 1}\`\n**Hosted By:** <@${
              user.discordId
            }>\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`
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

        const msg = await (channel as any).send({ embeds: [embed], components: [row] });

        await prisma.giveaway.update({
          where: { id: giveaway.id },
          data: { messageId: msg.id, channelId: targetChannelId },
        });
      }
    }

    return NextResponse.json({ success: true, giveaway });
  } catch (err: any) {
    console.error("Create giveaway error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.giveaway.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

