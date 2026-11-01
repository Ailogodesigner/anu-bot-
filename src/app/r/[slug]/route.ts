import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  try {
    const link = await prisma.randomLink.findUnique({
      where: { slug },
    });

    if (!link || !link.isActive) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Increment click count asynchronously
    await prisma.randomLink.update({
      where: { id: link.id },
      data: { clicksCount: { increment: 1 } },
    });

    return NextResponse.redirect(link.targetUrl, 307);
  } catch (err) {
    console.error("Link redirect error:", err);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
