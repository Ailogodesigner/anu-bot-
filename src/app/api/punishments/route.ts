import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { getBotClient } from "@/bot/discordService";
import { logStaffCommandAudit } from "@/bot/commands";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const targetId = searchParams.get("targetId");

    const where: any = {};
    if (type) where.type = type;
    if (targetId) where.targetDiscordId = targetId;

    const punishments = await prisma.punishment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const summary = {
      totalWarns: await prisma.punishment.count({ where: { type: "WARN" } }),
      totalTimeouts: await prisma.punishment.count({ where: { type: "TIMEOUT" } }),
      totalKicks: await prisma.punishment.count({ where: { type: "KICK" } }),
      totalBans: await prisma.punishment.count({ where: { type: "BAN" } }),
    };

    return NextResponse.json({ success: true, punishments, summary });
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
    const { type, targetDiscordId, targetUsername, reason, durationMinutes } = body;

    if (!type || !targetDiscordId) {
      return NextResponse.json({ error: "Type and target Discord ID are required." }, { status: 400 });
    }

    const botClient = getBotClient();
    const config = await prisma.guildConfig.findFirst();
    const guildId = config?.guildId || process.env.DISCORD_GUILD_ID || "1519559734808674444";

    let targetName = targetUsername || targetDiscordId;

    // Apply action in Discord if bot is ready
    if (botClient && botClient.isReady()) {
      try {
        const guild = await botClient.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          const member = await guild.members.fetch(targetDiscordId).catch(() => null);
          if (member) {
            targetName = member.user.username;
            if (type === "TIMEOUT" && durationMinutes) {
              await member.timeout(Number(durationMinutes) * 60 * 1000, reason || "Timed out via Web Console");
            } else if (type === "KICK") {
              await member.kick(reason || "Kicked via Web Console");
            } else if (type === "BAN") {
              await guild.members.ban(targetDiscordId, { reason: reason || "Banned via Web Console" });
            }
          } else if (type === "BAN") {
            await guild.members.ban(targetDiscordId, { reason: reason || "Banned via Web Console" });
          }
        }
      } catch (discordErr: any) {
        console.warn("Discord action notice:", discordErr.message);
      }
    }

    const punishment = await prisma.punishment.create({
      data: {
        type,
        guildId,
        targetDiscordId,
        targetUsername: targetName,
        staffDiscordId: user.discordId,
        staffUsername: user.username,
        reason: reason || "Moderation action via Web Dashboard",
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        isActive: true,
      },
    });

    await logStaffCommandAudit({
      staffDiscordId: user.discordId,
      staffUsername: user.username,
      commandName: `DASHBOARD_${type}`,
      targetDiscordId,
      targetUsername: targetName,
      guildId,
      parameters: { reason, durationMinutes },
      executionSource: "WEB_DASHBOARD",
    });

    return NextResponse.json({ success: true, punishment });
  } catch (err: any) {
    console.error("Create punishment error:", err);
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

    const punishment = await prisma.punishment.findUnique({ where: { id } });
    if (!punishment) return NextResponse.json({ error: "Punishment not found" }, { status: 404 });

    // Lift timeout or unban in Discord if active
    const botClient = getBotClient();
    if (botClient && botClient.isReady()) {
      try {
        const guild = await botClient.guilds.fetch(punishment.guildId).catch(() => null);
        if (guild) {
          if (punishment.type === "TIMEOUT") {
            const member = await guild.members.fetch(punishment.targetDiscordId).catch(() => null);
            await member?.timeout(null);
          } else if (punishment.type === "BAN") {
            await guild.members.unban(punishment.targetDiscordId).catch(() => null);
          }
        }
      } catch {}
    }

    await prisma.punishment.update({
      where: { id },
      data: { isActive: false },
    });

    await logStaffCommandAudit({
      staffDiscordId: user.discordId,
      staffUsername: user.username,
      commandName: `REVOKE_${punishment.type}`,
      targetDiscordId: punishment.targetDiscordId,
      targetUsername: punishment.targetUsername,
      guildId: punishment.guildId,
      executionSource: "WEB_DASHBOARD",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
