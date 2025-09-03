import { NextRequest, NextResponse } from "next/server";
import { App } from "@slack/bolt";
import { authorizeSlack } from "./utils/authorize-slack";
import { handleAppMention } from "./handlers/app-mention";
import { handleMessage } from "./handlers/slack-message";
import { verifySlackSignature } from "./utils/verify-slack-signature";

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  authorize: authorizeSlack,
});

app.event("app_mention", handleAppMention);
app.message(handleMessage);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const bodyJson = JSON.parse(body);

    if (bodyJson.type === "url_verification") {
      return NextResponse.json({ challenge: bodyJson.challenge });
    }

    const signature = req.headers.get("x-slack-signature");
    const timestamp = req.headers.get("x-slack-request-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    if (!verifySlackSignature(body, signature, timestamp)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    await app.processEvent({
      body: bodyJson,
      ack: async () => {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
