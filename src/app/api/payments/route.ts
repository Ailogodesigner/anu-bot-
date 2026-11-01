import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRequiredRole } from "@/lib/auth";

export async function GET() {
  try {
    const paymentMethods = await prisma.paymentQr.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, paymentMethods });
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
    const { title, provider, accountAddress, qrImageUrl, note, isActive } = body;

    if (!title || !provider || !accountAddress) {
      return NextResponse.json(
        { error: "Title, provider, and account address are required." },
        { status: 400 }
      );
    }

    // Auto-generate QR code URL if not provided and it's UPI or Crypto
    let finalQrUrl = qrImageUrl;
    if (!finalQrUrl && provider === "UPI") {
      finalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
        accountAddress
      )}&pn=CavrixCloud`;
    } else if (!finalQrUrl && (provider === "CRYPTO" || provider === "BANK")) {
      finalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        accountAddress
      )}`;
    }

    const highest = await prisma.paymentQr.findFirst({ orderBy: { order: "desc" } });
    const order = (highest?.order || 0) + 1;

    const payment = await prisma.paymentQr.create({
      data: {
        title,
        provider,
        accountAddress,
        qrImageUrl: finalQrUrl || null,
        note: note || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order,
      },
    });

    return NextResponse.json({ success: true, payment });
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
    const { id, title, provider, accountAddress, qrImageUrl, note, isActive, order } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updated = await prisma.paymentQr.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(provider !== undefined && { provider }),
        ...(accountAddress !== undefined && { accountAddress }),
        ...(qrImageUrl !== undefined && { qrImageUrl }),
        ...(note !== undefined && { note }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ success: true, payment: updated });
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

    await prisma.paymentQr.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
