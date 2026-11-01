import { NextResponse } from "next/server";
import { getDiscordOAuthUrl, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const oauthUrl = getDiscordOAuthUrl();
  return NextResponse.redirect(oauthUrl);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const expectedUser = (process.env.ADMIN_USERNAME || "admin").trim();
    const expectedPass = (process.env.ADMIN_PASSWORD || "cavrix@2026").trim();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Master password is required." },
        { status: 400 }
      );
    }

    const inputUser = (username || "admin").trim();
    const inputPass = String(password).trim();

    if (inputUser !== expectedUser || inputPass !== expectedPass) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid master username or password. Check ADMIN_PASSWORD in your .env file.",
        },
        { status: 401 }
      );
    }

    // Upsert or fetch Master Admin User
    let adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          discordId: "OWNER_ROOT_ADMIN",
          username: "Server Owner (Admin)",
          role: "ADMIN",
          status: "ONLINE",
          lastActiveAt: new Date(),
        },
      });
    } else {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          status: "ONLINE",
          lastActiveAt: new Date(),
        },
      });
    }

    const sessionUser = {
      id: adminUser.id,
      discordId: adminUser.discordId,
      username: adminUser.username,
      avatar: adminUser.avatar,
      role: "ADMIN" as const,
    };

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: "Master authentication successful.",
    });

    const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") || false;
    response.cookies.set("vps_bot_session", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Authentication service error" },
      { status: 500 }
    );
  }
}
