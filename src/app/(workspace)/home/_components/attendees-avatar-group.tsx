import { getInitials } from "@/lib/utils";

interface AttendeesAvatarGroupProps {
  attendees: unknown;
  getAttendeeList: (attendees: unknown) => string[];
}

export default function AttendeesAvatarGroup({
  attendees,
  getAttendeeList,
}: AttendeesAvatarGroupProps) {
  const attendeeList = getAttendeeList(attendees);

  return (
    <div className="flex -space-x-[0.525rem]">
      {attendeeList.slice(0, 4).map((attendee, index) => (
        <div key={index} className="relative group" title={attendee}>
          <div className="size-6 rounded-full bg-gradient-to-br from-neutral-500 to-neutral-600 ring-2 flex items-center justify-center text-white text-sm font-medium hover:scale-110 transition-transform cursor-pointer">
            {getInitials(attendee)}
          </div>
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {attendee}
          </div>
        </div>
      ))}
      {attendeeList.length > 4 && (
        <div
          className="size-6 rounded-full bg-gray-500 ring-2 flex items-center justify-center text-white text-sm font-medium"
          title={`+${attendeeList.length - 4} more`}
        >
          +{attendeeList.length - 4}
        </div>
      )}
    </div>
  );
}
