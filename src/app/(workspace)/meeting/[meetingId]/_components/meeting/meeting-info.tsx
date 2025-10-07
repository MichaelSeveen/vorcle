import {
  DuoCalendarIcon,
  DuoClockIcon,
} from "@/components/custom-icons/duotone";

import { AvatarRoot, AvatarImage } from "@/components/align-ui/avatar";
import { MeetingInfoData, UserData } from "@/config/types";
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
            <AvatarRoot className="rounded-md">
              <AvatarImage
                src={avatar}
                alt={`The profile image of ${userData.name}`}
              />
            </AvatarRoot>
          ) : (
            <AvatarRoot color="blue">{initials}</AvatarRoot>
          )}
          {meetingData.userName}
        </div>
        <time
          dateTime={meetingData.date}
          className="text-sm text-muted-foreground flex items-center gap-1"
        >
          <DuoCalendarIcon className="size-4" />
          {meetingData.date}
        </time>
        <time
          dateTime={`${meetingData.date} ${meetingData.time}`}
          className="text-sm text-muted-foreground flex items-center gap-1"
        >
          <DuoClockIcon className="size-4" />
          {meetingData.time}
        </time>
      </div>
    </div>
  );
}
