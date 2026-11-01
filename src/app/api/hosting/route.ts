import { NextResponse } from "next/server";
import os from "os";
import { getBotClient } from "@/bot/discordService";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botClient = getBotClient();
    const memUsage = process.memoryUsage();

    const ticketsCount = await prisma.ticket.count();
    const staffCount = await prisma.user.count();

    const clientId = process.env.DISCORD_CLIENT_ID || "1528401268354056293";
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;

    return NextResponse.json({
      success: true,
      system: {
        platform: `${os.type()} ${os.arch()}`,
        release: os.release(),
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      },
      process: {
        pid: process.pid,
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        port: process.env.PORT || 3005,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005",
      },
      discord: {
        connected: !!botClient?.isReady(),
        botTag: botClient?.user?.tag || "Cavrix Cloud#1775",
        botId: botClient?.user?.id || clientId,
        guildId: process.env.DISCORD_GUILD_ID || "1519559734808674444",
        guildName: botClient?.guilds.cache.get(process.env.DISCORD_GUILD_ID || "")?.name || "Cavrix Core",
        pingMs: botClient?.ws?.ping || 0,
        inviteUrl,
      },
      database: {
        type: "SQLite",
        status: "HEALTHY",
        totalTickets: ticketsCount,
        totalStaff: staffCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Diagnostics failed" }, { status: 500 });
  }
}

