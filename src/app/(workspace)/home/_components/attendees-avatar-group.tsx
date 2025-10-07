import { getInitials } from "@/lib/utils";
import { LazyTooltip } from "@/components/ui/lazy-tooltip";
import {
  AvatarGroupRoot,
  AvatarGroupOverflow,
} from "@/components/align-ui/avatar-group";
import { AvatarRoot } from "@/components/align-ui/avatar";

interface AttendeesAvatarGroupProps {
  attendees: unknown;
}

export default function AttendeesAvatarGroup({
  attendees,
}: AttendeesAvatarGroupProps) {
  function getAttendeeList(attendees: unknown): string[] {
    if (!attendees) {
      return [];
    }

    try {
      const parsed = JSON.parse(String(attendees));
      if (Array.isArray(parsed)) {
        return parsed.map((name) => String(name).trim());
      }
      return [String(parsed).trim()];
    } catch {
      const attendeeString = String(attendees);
      return attendeeString
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    }
  }

  const attendeeList = getAttendeeList(attendees);

  return (
    <AvatarGroupRoot size="32">
      {attendeeList.slice(0, 4).map((attendee, index) => {
        const initials = getInitials(attendee);
        return (
          <LazyTooltip content={attendee} key={index} asChild>
            <AvatarRoot color="blue">{initials}</AvatarRoot>
            {attendeeList.length > 4 && (
              <AvatarGroupOverflow>
                +{attendeeList.length - 4}
              </AvatarGroupOverflow>
            )}
          </LazyTooltip>
        );
      })}
    </AvatarGroupRoot>
  );
}
