"use client";

import { Button, InputGroup, Spinner, TextField } from "@heroui/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { FormEvent, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
	value: string;
	onValueChange: (value: string) => void;
	onSubmit: () => void;
	isLoading: boolean;
	canSend: boolean;
	ariaLabel: string;
	submitLabel: string;
	placeholder: string;
	disabledPlaceholder?: string;
	className?: string;
	textFieldClassName?: string;
	rows?: number;
}

export function ChatComposer({
	value,
	onValueChange,
	onSubmit,
	isLoading,
	canSend,
	ariaLabel,
	submitLabel,
	placeholder,
	disabledPlaceholder = "Cycle limit reached",
	className,
	textFieldClassName,
	rows = 4,
}: ChatComposerProps) {
	const isDisabled = isLoading || !canSend;
	const canSubmit = value.trim().length > 0 && !isDisabled;

	const handleFormSubmit = (event: FormEvent) => {
		event.preventDefault();

		if (canSubmit) {
			onSubmit();
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			!event.nativeEvent.isComposing
		) {
			event.preventDefault();

			if (canSubmit) {
				onSubmit();
			}
		}
	};

	return (
		<form onSubmit={handleFormSubmit} className={className}>
			<TextField
				fullWidth
				aria-label={ariaLabel}
				className={cn("w-full", textFieldClassName)}
				isDisabled={isDisabled}
				name="prompt"
			>
				<InputGroup fullWidth className="flex flex-col gap-2 rounded-3xl py-2">
					<InputGroup.TextArea
						className="max-h-40 w-full resize-none px-3.5 py-0"
						placeholder={canSend ? placeholder : disabledPlaceholder}
						rows={rows}
						value={value}
						onChange={(event) => onValueChange(event.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<InputGroup.Suffix className="flex w-full items-center justify-end px-3 py-0">
						<Button
							isIconOnly
							aria-label={submitLabel}
							isDisabled={!canSubmit}
							isPending={isLoading}
							type="submit"
						>
							{({ isPending }) =>
								isPending ? (
									<Spinner color="current" />
								) : (
									<HugeiconsIcon icon={ArrowUp02Icon} stroke="2" />
								)
							}
						</Button>
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
		</form>
	);
}
