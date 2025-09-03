import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <h2 className="text-xl font-semibold mb-2">{meetingData.title}</h2>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {userData?.image ? (
            <Avatar className="rounded-md size-5">
              <AvatarImage src={avatar} alt={userData.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-sm font-medium">
              {meetingData.userName.charAt(0).toUpperCase()}
            </span>
          )}
          {meetingData.userName}
        </div>
        <time
          dateTime={meetingData.date}
          className="text-sm text-muted-foreground"
        >
          📅 {meetingData.date}
        </time>
        <time
          dateTime={`${meetingData.date} ${meetingData.time}`}
          className="text-sm text-muted-foreground"
        >
          🕐 {meetingData.time}
        </time>
      </div>
    </div>
  );
}
