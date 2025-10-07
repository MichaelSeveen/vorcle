import { useCalendar } from "../context/calendar-context";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectItemIcon,
} from "@/components/align-ui/select";
import { AvatarRoot, AvatarImage } from "@/components/align-ui/avatar";

export default function UsersMenu() {
  const { users, selectedUserId, filterEventsBySelectedUser } = useCalendar();

  return (
    <div className="w-full max-w-[10rem]">
      <SelectRoot
        value={selectedUserId!}
        onValueChange={filterEventsBySelectedUser}
        size="small"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="all">All</SelectItem>
          {users.map((user) => (
            <SelectItem
              key={user.id}
              value={user.id}
              className="flex-1 cursor-pointer"
            >
              <SelectItemIcon as={AvatarRoot} size="20">
                <AvatarImage
                  src={user.picturePath ?? ""}
                  alt={`Profile image of ${user.name}`}
                />
              </SelectItemIcon>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
}
