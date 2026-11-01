import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN", "SUPPORT_LEAD"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    const giveaway = await prisma.giveaway.findUnique({ where: { id } });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }

    const participants: string[] = giveaway.participants ? JSON.parse(giveaway.participants) : [];
    if (!participants.length) {
      return NextResponse.json({ error: "No participants in this giveaway" }, { status: 400 });
    }

    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, giveaway.winnerCount);

    const updated = await prisma.giveaway.update({
      where: { id },
      data: {
        status: "REROLLED",
        winners: JSON.stringify(winners),
      },
    });

    // Notify channel
    const botClient = getBotClient();
    if (botClient && botClient.isReady() && giveaway.channelId) {
      const channel = await botClient.channels.fetch(giveaway.channelId).catch(() => null);
      if (channel && "send" in channel) {
        await (channel as any).send(
          `🎲 **Giveaway Rerolled!** New winner(s) for **${giveaway.prize}**: ${winners
            .map((w) => `<@${w}>`)
            .join(", ")}! Congratulations!`
        );
      }
    }

    return NextResponse.json({ success: true, giveaway: updated, winners });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

