"use client";

import {
	Avatar,
	Button,
	Dropdown,
	Label,
	Separator,
	Spinner,
} from "@heroui/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { segments } from "@/config/segments";
import { signOut, useSession } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";

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
		<Dropdown>
			<Button isIconOnly variant="outline" aria-label="Open user profile menu">
				{isPending ? (
					<Spinner />
				) : avatar ? (
					<Avatar size="sm">
						<Avatar.Image
							src={avatar}
							alt={`The profile image of ${session?.user.name}`}
						/>
						<Avatar.Fallback>{initials}</Avatar.Fallback>
					</Avatar>
				) : (
					<Avatar color="accent" size="sm">
						<Avatar.Fallback>{initials}</Avatar.Fallback>
					</Avatar>
				)}
			</Button>
			<Dropdown.Popover className="max-w-64" placement="bottom end">
				<Dropdown.Menu>
					<Dropdown.Section>
						<Dropdown.Item
							id="user-info"
							textValue="User info"
							className="flex items-start gap-3"
						>
							{isPending ? (
								<Spinner />
							) : (
								<div className="flex min-w-0 flex-col">
									<span className="text-foreground truncate text-sm font-medium">
										{session?.user?.name}
									</span>
									<span className="text-foreground truncate text-xs">
										{session?.user?.email}
									</span>
								</div>
							)}
						</Dropdown.Item>
					</Dropdown.Section>

					<Separator />
					<Dropdown.Item
						id="logout"
						textValue="Logout"
						variant="danger"
						onAction={handleLogout}
					>
						<HugeiconsIcon
							icon={Logout01Icon}
							className="text-danger"
							size={16}
						/>
						<Label>Logout</Label>{" "}
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}
