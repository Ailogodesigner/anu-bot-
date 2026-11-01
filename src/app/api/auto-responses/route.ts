import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";

export async function GET() {
  try {
    const responses = await prisma.autoResponse.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, autoResponses: responses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { trigger, matchType, responseContent, embedTitle, embedDescription, embedColor, isActive } = body;

    if (!trigger || !responseContent) {
      return NextResponse.json(
        { error: "Trigger phrase and response content are required." },
        { status: 400 }
      );
    }

    const auto = await prisma.autoResponse.create({
      data: {
        trigger: trigger.trim(),
        matchType: matchType || "CONTAINS",
        responseContent: responseContent.trim(),
        embedTitle: embedTitle ? embedTitle.trim() : null,
        embedDescription: embedDescription ? embedDescription.trim() : null,
        embedColor: embedColor || "#D4AF37",
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, autoResponse: auto });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !hasRequiredRole(user.role, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, trigger, matchType, responseContent, embedTitle, embedDescription, embedColor, isActive } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updated = await prisma.autoResponse.update({
      where: { id },
      data: {
        ...(trigger !== undefined && { trigger: trigger.trim() }),
        ...(matchType !== undefined && { matchType }),
        ...(responseContent !== undefined && { responseContent: responseContent.trim() }),
        ...(embedTitle !== undefined && { embedTitle: embedTitle ? embedTitle.trim() : null }),
        ...(embedDescription !== undefined && {
          embedDescription: embedDescription ? embedDescription.trim() : null,
        }),
        ...(embedColor !== undefined && { embedColor }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, autoResponse: updated });
  } catch (err: any) {
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

    await prisma.autoResponse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

