import { NextResponse } from "next/server";
import { getCurrentUser } from "@/helpers/user";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
      where: { userId: currentUser.id, providerId: "google" },
    });

    if (!account) {
      return NextResponse.json(
        { error: "No Google account linked" },
        { status: 400 }
      );
    }

    const tokenToRevoke = account.refreshToken || account.accessToken;

    if (tokenToRevoke) {
      try {
        const revokeResponse = await fetch(
          "https://oauth2.googleapis.com/revoke",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ token: tokenToRevoke }),
          }
        );
        if (!revokeResponse.ok) {
          console.warn(
            "Failed to revoke Google token:",
            await revokeResponse.text()
          );
        }
      } catch (err) {
        console.warn("Error during token revocation:", err);
      }
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope:
          "https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email,openid",
      },
    });

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { calendarConnected: false },
    });

    return NextResponse.json({
      success: true,
      message: "Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
