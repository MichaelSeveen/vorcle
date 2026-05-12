import {
	type MeetingSearchParams,
	searchMeetings,
} from "@/helpers/meetings/search";

interface PastMeetings {
	userId: string;
	input: MeetingSearchParams;
}

export async function getPastMeetings({ userId, input }: PastMeetings) {
	try {
		return await searchMeetings({ userId, input });
	} catch (error) {
		console.error("Error fetching past meetings", error);
		return {
			data: [],
			pageCount: 0,
		};
	}
}
