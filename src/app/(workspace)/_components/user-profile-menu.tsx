"use client";

import { Loader2, LogOutIcon, PinIcon, UserPenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { segments } from "@/config/segments";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfileMenu() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const initials = getInitials(session?.user.name);
  const avatar =
    session?.user?.image ??
    `https://avatar.vercel.sh/${session?.user.name}.svg`;

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace(segments.signIn);
        },
        onError(ctx) {
          toast.error(ctx.error.message ?? "Something went wrong.");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Open user profile menu"
        >
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Avatar className="rounded-md">
              <AvatarImage src={avatar} alt={session?.user?.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex items-start gap-3">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground truncate text-sm font-medium">
                {session?.user?.name}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {session?.user?.email}
              </span>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PinIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Option 4</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPenIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Option 5</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
