import { type Brevo, BrevoClient, BrevoError } from "@getbrevo/brevo";

interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
	text?: string;
	fromName?: string;
}

let brevoClient: BrevoClient | null = null;

function getOptionalEnv(name: string) {
	return process.env[name] || undefined;
}

function requireEnv(name: string) {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is not set`);
	}

	return value;
}

function parseInteger(value: string | undefined, fallback: number) {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);

	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value: string | undefined, fallback: number) {
	if (!value) {
		return fallback;
	}

	const parsed = Number(value);

	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function getBrevoClient() {
	if (!brevoClient) {
		brevoClient = new BrevoClient({
			apiKey: requireEnv("BREVO_API_KEY"),
			maxRetries: parseNonNegativeInteger(
				getOptionalEnv("BREVO_MAX_RETRIES"),
				2,
			),
			timeoutInSeconds: parseInteger(
				getOptionalEnv("BREVO_TIMEOUT_SECONDS"),
				30,
			),
		});
	}

	return brevoClient;
}

export function getSenderEmail() {
	const explicitSender =
		getOptionalEnv("BREVO_FROM_EMAIL") ||
		getOptionalEnv("MAIL_FROM_EMAIL") ||
		getOptionalEnv("EMAIL_FROM");

	if (explicitSender) {
		return explicitSender;
	}

	try {
		const appUrl = getOptionalEnv("NEXT_PUBLIC_APP_URL");

		if (appUrl) {
			const hostname = new URL(appUrl).hostname.replace(/^www\./, "");
			const isLocalHost =
				hostname === "localhost" ||
				hostname.endsWith(".local") ||
				/^\d+\.\d+\.\d+\.\d+$/.test(hostname);

			if (!isLocalHost) {
				return `hello@${hostname}`;
			}
		}
	} catch (error) {
		console.error(
			"Failed to derive sender email from NEXT_PUBLIC_APP_URL:",
			error,
		);
	}

	return "hello@example.com";
}

function getBrevoErrorMessage(error: BrevoError) {
	if (
		error.body &&
		typeof error.body === "object" &&
		"message" in error.body &&
		typeof error.body.message === "string"
	) {
		return error.body.message;
	}

	return error.message;
}

export async function sendEmail({
	fromName = "Vorcle Meeting Bot",
	html,
	subject,
	text,
	to,
}: SendEmailInput): Promise<Brevo.SendTransacEmailResponse> {
	const payload: Brevo.SendTransacEmailRequest = {
		htmlContent: html,
		sender: {
			email: getSenderEmail(),
			name: fromName,
		},
		subject,
		to: [{ email: to }],
		...(text ? { textContent: text } : {}),
	};

	try {
		const result =
			await getBrevoClient().transactionalEmails.sendTransacEmail(payload);
		const messageId = result.messageId ?? result.messageIds?.[0] ?? null;

		console.info("[Email] Transactional email queued via Brevo", {
			messageId,
			to,
		});

		return result;
	} catch (error) {
		if (error instanceof BrevoError) {
			if (error.statusCode === 401) {
				throw new Error(
					`Brevo rejected BREVO_API_KEY: ${getBrevoErrorMessage(error)}`,
					{ cause: error },
				);
			}

			throw new Error(
				`Brevo failed to send transactional email (${error.statusCode ?? "unknown"}): ${getBrevoErrorMessage(error)}`,
				{ cause: error },
			);
		}

		throw error;
	}
}
