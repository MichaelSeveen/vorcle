import "server-only";

import type { ActionItem } from "@/config/types";

interface MeetingSummaryEmailInput {
	meetingTitle: string;
	summary: string;
	actionItems: ActionItem[];
	decisions: string[];
	blockers: string[];
	meetingUrl?: string | null;
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function renderList(items: string[]) {
	if (items.length === 0) {
		return "<p>None</p>";
	}

	return `<ul>${items
		.map((item) => `<li>${escapeHtml(item)}</li>`)
		.join("")}</ul>`;
}

function formatActionItem(item: ActionItem) {
	const metadata = [
		item.owner ? `Owner: ${item.owner}` : null,
		item.deadline ? `Deadline: ${item.deadline}` : null,
	]
		.filter(Boolean)
		.join(" | ");

	return metadata ? `${item.text} (${metadata})` : item.text;
}

export function renderMeetingSummaryEmail({
	actionItems,
	blockers,
	decisions,
	meetingTitle,
	meetingUrl,
	summary,
}: MeetingSummaryEmailInput) {
	const title = escapeHtml(meetingTitle);
	const safeSummary = escapeHtml(summary);

	return `
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
			<h1 style="font-size: 20px; margin-bottom: 8px;">${title}</h1>
			<p style="margin-top: 0; color: #6b7280;">Your meeting has been processed.</p>

			<h2 style="font-size: 16px; margin-top: 24px;">Summary</h2>
			<p>${safeSummary}</p>

			<h2 style="font-size: 16px; margin-top: 24px;">Decisions</h2>
			${renderList(decisions)}

			<h2 style="font-size: 16px; margin-top: 24px;">Blockers</h2>
			${renderList(blockers)}

			<h2 style="font-size: 16px; margin-top: 24px;">Action Items</h2>
			${renderList(actionItems.map(formatActionItem))}

			${
				meetingUrl
					? `<p style="margin-top: 24px;"><a href="${escapeHtml(meetingUrl)}">Open this meeting in Vorcle</a></p>`
					: ""
			}
		</div>
	`;
}
