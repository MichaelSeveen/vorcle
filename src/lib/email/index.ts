import "server-only";

import { sendEmail as sendSmtpEmail } from "./mailer";

interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export async function sendEmail({ html, subject, text, to }: SendEmailInput) {
	return sendSmtpEmail({
		html,
		subject,
		text,
		to,
	});
}
