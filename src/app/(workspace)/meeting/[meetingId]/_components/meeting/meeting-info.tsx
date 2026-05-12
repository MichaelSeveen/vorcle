import { Avatar } from "@heroui/react";
import { Calendar03Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MeetingInfoData, UserData } from "@/config/types";
import { getInitials } from "@/lib/utils";

interface MeetingInfoProps {
	meetingData: MeetingInfoData;
	userData: UserData;
}

export default function MeetingInfo({
	meetingData,
	userData,
}: MeetingInfoProps) {
	const initials = getInitials(userData.name);
	const avatar =
		userData.image ?? `https://avatar.vercel.sh/${userData.name}.svg`;

	return (
		<div>
			<h1 className="text-xl font-semibold mb-2">{meetingData.title}</h1>

			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1">
					{userData.image ? (
						<Avatar size="sm">
							<Avatar.Image
								src={avatar}
								alt={`The profile image of ${userData.name}`}
							/>
							<Avatar.Fallback>{initials}</Avatar.Fallback>
						</Avatar>
					) : (
						<Avatar color="accent" size="sm">
							<Avatar.Fallback>{initials}</Avatar.Fallback>
						</Avatar>
					)}
					{meetingData.userName}
				</div>
				<time
					dateTime={meetingData.date}
					className="text-sm flex items-center gap-1 font-medium"
				>
					<HugeiconsIcon icon={Calendar03Icon} size={20} />
					{meetingData.date}
				</time>
				<time
					dateTime={`${meetingData.date} ${meetingData.time}`}
					className="text-sm flex items-center gap-1 font-medium"
				>
					<HugeiconsIcon icon={Clock01Icon} size={20} />
					{meetingData.time}
				</time>
			</div>
		</div>
	);
}
