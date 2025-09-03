import { NextRequest, NextResponse } from "next/server";
import { WebClient } from "@slack/web-api";
import prisma from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL as string;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      console.error("slack oauth error:", error);
      return NextResponse.redirect(`${BASE_URL}/?slack=error`);
    }

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code" },
        { status: 400 }
      );
    }

    const redirectUri = `${BASE_URL}/api/slack/oauth`;

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    console.log("Token Data here>>>", tokenData);

    if (!tokenData.ok) {
      console.error("Failed to exchange oauth code:", tokenData.error);
      return NextResponse.redirect(`${BASE_URL}/?slack=error`);
    }

    await prisma.slackInstallation.upsert({
      where: {
        teamId: tokenData.team.id,
      },
      update: {
        teamName: tokenData.team.name,
        botToken: tokenData.access_token,
        installedBy: tokenData.authed_user.id,
        installerName: tokenData.authed_user.name || "Unknown",
        active: true,
        updatedAt: new Date(),
      },
      create: {
        teamId: tokenData.team.id,
        teamName: tokenData.team.name,
        botToken: tokenData.access_token,
        installedBy: tokenData.authed_user.id,
        installerName: tokenData.authed_user.name || "Unknown",
        active: true,
      },
    });

    try {
      const slack = new WebClient(tokenData.access_token);
      const userInfo = await slack.users.info({
        user: tokenData.authed_user.id,
      });

      if (userInfo.user?.profile?.email) {
        await prisma.user.updateMany({
          where: {
            email: userInfo.user.profile.email,
          },
          data: {
            slackUserId: tokenData.authed_user.id,
            slackTeamId: tokenData.team.id,
            slackConnected: true,
          },
        });
      }
    } catch (error) {
      console.error("Failed to link user during oauth:", error);
    }

    const returnTo = state?.startsWith("return=")
      ? state.split("return=")[1]
      : null;

    if (returnTo === "integrations") {
      return NextResponse.redirect(`${BASE_URL}/integrations?setup=slack`);
    } else {
      return NextResponse.redirect(`${BASE_URL}/?slack=installed`);
    }
  } catch (error) {
    console.error("Slack oauth error", error);

    return NextResponse.redirect(`${BASE_URL}/?slack=error`);
  }
}
