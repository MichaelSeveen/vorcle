import crypto from "node:crypto";

export function verifySlackSignature(
	body: string,
	signature: string,
	timestamp: string,
) {
	const signingSecret = process.env.SLACK_SIGNING_SECRET;

	if (!signingSecret) {
		throw new Error("SLACK_SIGNING_SECRET environment variable is not set");
	}

	const time = Math.floor(Date.now() / 1000);

	if (Math.abs(time - parseInt(timestamp, 10)) > 300) {
		return false;
	}

	const sigBaseString = `v0:${timestamp}:${body}`;

	const mySignature =
		"v0=" +
		crypto
			.createHmac("sha256", signingSecret)
			.update(sigBaseString, "utf8")
			.digest("hex");

	return crypto.timingSafeEqual(
		Buffer.from(mySignature, "utf8"),
		Buffer.from(signature, "utf8"),
	);
}
