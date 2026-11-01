import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let guildConfig = await prisma.guildConfig.findFirst();
  if (!guildConfig) {
    guildConfig = await prisma.guildConfig.create({
      data: {
        guildId: process.env.DISCORD_GUILD_ID || "1519559734808674444",
        guildName: "Cavrix Cloud",
        prefix: "!",
      },
    });
  }

  const categories = await prisma.ticketCategory.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ guildConfig, categories });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const body = await req.json();
  const existing = await prisma.guildConfig.findFirst();

  const updateData: any = {};
  if (body.guildName !== undefined) updateData.guildName = body.guildName;
  if (body.prefix !== undefined) updateData.prefix = body.prefix;
  if (body.ticketCategoryId !== undefined) updateData.ticketCategoryId = body.ticketCategoryId;
  if (body.transcriptChannelId !== undefined) updateData.transcriptChannelId = body.transcriptChannelId;
  if (body.auditLogChannelId !== undefined) updateData.auditLogChannelId = body.auditLogChannelId;
  if (body.announcementChannelId !== undefined) updateData.announcementChannelId = body.announcementChannelId;
  if (body.adminRoleId !== undefined) updateData.adminRoleId = body.adminRoleId;
  if (body.supportRoleId !== undefined) updateData.supportRoleId = body.supportRoleId;
  if (body.escalationRoleId !== undefined) updateData.escalationRoleId = body.escalationRoleId;
  if (body.maxTicketsPerUser !== undefined) updateData.maxTicketsPerUser = Number(body.maxTicketsPerUser) || 3;
  if (body.autoCloseHours !== undefined) updateData.autoCloseHours = Number(body.autoCloseHours) || 48;
  if (body.enableAiSupport !== undefined) updateData.enableAiSupport = Boolean(body.enableAiSupport);
  if (body.aiEscalationSensitivity !== undefined) updateData.aiEscalationSensitivity = body.aiEscalationSensitivity;

  // Welcome settings
  if (body.welcomeEnabled !== undefined) updateData.welcomeEnabled = Boolean(body.welcomeEnabled);
  if (body.welcomeChannelId !== undefined) updateData.welcomeChannelId = body.welcomeChannelId;
  if (body.welcomeTitle !== undefined) updateData.welcomeTitle = body.welcomeTitle;
  if (body.welcomeMessage !== undefined) updateData.welcomeMessage = body.welcomeMessage;
  if (body.welcomeBannerUrl !== undefined) updateData.welcomeBannerUrl = body.welcomeBannerUrl;
  if (body.welcomeThumbnailUrl !== undefined) updateData.welcomeThumbnailUrl = body.welcomeThumbnailUrl;
  if (body.welcomeColor !== undefined) updateData.welcomeColor = body.welcomeColor;
  if (body.autoRoleId !== undefined) updateData.autoRoleId = body.autoRoleId;

  // Ticket Panel settings
  if (body.ticketPanelTitle !== undefined) updateData.ticketPanelTitle = body.ticketPanelTitle;
  if (body.ticketPanelDescription !== undefined) updateData.ticketPanelDescription = body.ticketPanelDescription;
  if (body.ticketPanelColor !== undefined) updateData.ticketPanelColor = body.ticketPanelColor;
  if (body.ticketPanelChannelId !== undefined) updateData.ticketPanelChannelId = body.ticketPanelChannelId;

  let updated;
  if (existing) {
    updated = await prisma.guildConfig.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    updated = await prisma.guildConfig.create({
      data: {
        guildId: process.env.DISCORD_GUILD_ID || "1519559734808674444",
        guildName: "Cavrix Cloud",
        prefix: "!",
        ...updateData,
      },
    });
  }

  await logAuditEvent({
    actorDiscordId: user.discordId,
    actorUsername: user.username,
    action: "GUILD_CONFIG_UPDATE",
    targetType: "GUILD_CONFIG",
    targetId: updated.id,
    details: { changes: body },
  });

  return NextResponse.json({ success: true, guildConfig: updated });
}
