import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const targetId = searchParams.get("targetId");
    const command = searchParams.get("command");

    const where: any = {};
    if (staffId) where.staffDiscordId = staffId;
    if (targetId) where.targetDiscordId = targetId;
    if (command) where.commandName = { contains: command };

    const audits = await prisma.staffCommandAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Compute telemetry summary
    const totalCommands = await prisma.staffCommandAudit.count();
    const uniqueStaff = await prisma.staffCommandAudit.groupBy({
      by: ["staffDiscordId", "staffUsername"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const mostUsedCommands = await prisma.staffCommandAudit.groupBy({
      by: ["commandName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      audits,
      telemetry: {
        totalCommands,
        topStaff: uniqueStaff.map((s) => ({
          id: s.staffDiscordId,
          username: s.staffUsername,
          count: s._count.id,
        })),
        topCommands: mostUsedCommands.map((c) => ({
          name: c.commandName,
          count: c._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error("Staff audit fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
