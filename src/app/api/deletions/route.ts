import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = {};
    if (type) where.type = type;

    const deletions = await prisma.deletionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalMessagesDeleted = await prisma.deletionLog.count({ where: { type: "MESSAGE" } });
    const totalBulkPurges = await prisma.deletionLog.count({ where: { type: "BULK_MESSAGE" } });
    const totalChannelsDeleted = await prisma.deletionLog.count({ where: { type: "CHANNEL" } });

    return NextResponse.json({
      success: true,
      deletions,
      summary: {
        totalMessagesDeleted,
        totalBulkPurges,
        totalChannelsDeleted,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
