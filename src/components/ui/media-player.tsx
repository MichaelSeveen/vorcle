"use client";

import { Button, Dropdown, Label, Slider, Tooltip } from "@heroui/react";
import {
	Backward02Icon,
	Forward02Icon,
	PauseIcon,
	PlayIcon,
	RepeatIcon,
	RepeatOne01Icon,
	Tick02Icon,
	VolumeHighIcon,
	VolumeLowIcon,
	VolumeMute02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	MediaActionTypes,
	MediaProvider,
	timeUtils,
	useMediaDispatch,
	useMediaRef,
	useMediaSelector,
} from "media-chrome/react/media-store";
import * as React from "react";
import { useComposedRefs } from "@/hooks/compose-refs";
import { cn } from "@/lib/utils";

const ROOT_NAME = "MediaPlayer";
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_STEP_SHORT = 5;
const SEEK_STEP_LONG = 10;

interface MediaPlayerContextValue {
	mediaId: string;
	labelId: string;
	descriptionId: string;
	mediaRef: React.RefObject<HTMLAudioElement | null>;
	disabled: boolean;
}

const MediaPlayerContext = React.createContext<MediaPlayerContextValue | null>(
	null,
);

function useMediaPlayerContext(consumerName: string) {
	const context = React.useContext(MediaPlayerContext);
	if (!context) {
		throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
	}
	return context;
}

type MediaPlayerRootProps = Omit<
	React.ComponentProps<"fieldset">,
	"onPlay" | "onPause" | "onEnded" | "onTimeUpdate" | "onVolumeChange"
>;

interface MediaPlayerProps extends MediaPlayerRootProps {
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onTimeUpdate?: (time: number) => void;
	onVolumeChange?: (volume: number) => void;
	onMuted?: (muted: boolean) => void;
	onMediaError?: (error: MediaError | null) => void;
	label?: string;
	disabled?: boolean;
}

function MediaPlayer(props: MediaPlayerProps) {
	return (
		<MediaProvider>
			<MediaPlayerImpl {...props} />
		</MediaProvider>
	);
}

function MediaPlayerImpl(props: MediaPlayerProps) {
	const {
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onVolumeChange,
		onMuted,
		onMediaError,
		label,
		disabled = false,
		children,
		className,
		ref,
		...rootProps
	} = props;

	const mediaId = React.useId();
	const labelId = React.useId();
	const descriptionId = React.useId();

	const dispatch = useMediaDispatch();
	const mediaRef = React.useRef<HTMLAudioElement | null>(null);
	const mediaPaused = useMediaSelector((state) => state.mediaPaused ?? true);

	// --- Keyboard shortcuts (audio-focused) ---
	const onKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLFieldSetElement>) => {
			if (disabled) return;

			const mediaElement = mediaRef.current;
			if (!mediaElement) return;

			const isPlayerFocused =
				document.activeElement?.closest('[data-slot="media-player"]') !== null;
			if (!isPlayerFocused) return;

			switch (event.key.toLowerCase()) {
				case " ":
				case "k":
					event.preventDefault();
					dispatch({
						type: mediaElement.paused
							? MediaActionTypes.MEDIA_PLAY_REQUEST
							: MediaActionTypes.MEDIA_PAUSE_REQUEST,
					});
					break;

				case "m":
					event.preventDefault();
					dispatch({
						type: mediaElement.muted
							? MediaActionTypes.MEDIA_UNMUTE_REQUEST
							: MediaActionTypes.MEDIA_MUTE_REQUEST,
					});
					break;

				case "arrowright":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_SEEK_REQUEST,
						detail: Math.min(
							mediaElement.duration,
							mediaElement.currentTime + SEEK_STEP_SHORT,
						),
					});
					break;

				case "arrowleft":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_SEEK_REQUEST,
						detail: Math.max(0, mediaElement.currentTime - SEEK_STEP_SHORT),
					});
					break;

				case "arrowup":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_VOLUME_REQUEST,
						detail: Math.min(1, mediaElement.volume + 0.1),
					});
					break;

				case "arrowdown":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_VOLUME_REQUEST,
						detail: Math.max(0, mediaElement.volume - 0.1),
					});
					break;

				case "<": {
					event.preventDefault();
					const curIdx = SPEEDS.indexOf(mediaElement.playbackRate);
					const newRate = SPEEDS[Math.max(0, curIdx - 1)] ?? 1;
					dispatch({
						type: MediaActionTypes.MEDIA_PLAYBACK_RATE_REQUEST,
						detail: newRate,
					});
					break;
				}

				case ">": {
					event.preventDefault();
					const curIdx = SPEEDS.indexOf(mediaElement.playbackRate);
					const newRate = SPEEDS[Math.min(SPEEDS.length - 1, curIdx + 1)] ?? 1;
					dispatch({
						type: MediaActionTypes.MEDIA_PLAYBACK_RATE_REQUEST,
						detail: newRate,
					});
					break;
				}

				case "j":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_SEEK_REQUEST,
						detail: Math.max(0, mediaElement.currentTime - SEEK_STEP_LONG),
					});
					break;

				case "l":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_SEEK_REQUEST,
						detail: Math.min(
							mediaElement.duration,
							mediaElement.currentTime + SEEK_STEP_LONG,
						),
					});
					break;

				case "r":
					event.preventDefault();
					mediaElement.loop = !mediaElement.loop;
					break;

				case "home":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_SEEK_REQUEST,
						detail: 0,
					});
					break;

				case "end":
					event.preventDefault();
					dispatch({
						type: MediaActionTypes.MEDIA_SEEK_REQUEST,
						detail: mediaElement.duration,
					});
					break;
			}
		},
		[dispatch, disabled],
	);

	// --- Event listeners with STABLE refs (fixes leak from original) ---
	React.useEffect(() => {
		const el = mediaRef.current;
		if (!el) return;

		const handleTimeUpdate = () => onTimeUpdate?.(el.currentTime);
		const handleVolumeChange = () => {
			onVolumeChange?.(el.volume);
			onMuted?.(el.muted);
		};
		const handleError = () => onMediaError?.(el.error);

		if (onPlay) el.addEventListener("play", onPlay);
		if (onPause) el.addEventListener("pause", onPause);
		if (onEnded) el.addEventListener("ended", onEnded);
		if (onTimeUpdate) el.addEventListener("timeupdate", handleTimeUpdate);
		if (onVolumeChange || onMuted)
			el.addEventListener("volumechange", handleVolumeChange);
		if (onMediaError) el.addEventListener("error", handleError);

		return () => {
			if (onPlay) el.removeEventListener("play", onPlay);
			if (onPause) el.removeEventListener("pause", onPause);
			if (onEnded) el.removeEventListener("ended", onEnded);
			if (onTimeUpdate) el.removeEventListener("timeupdate", handleTimeUpdate);
			if (onVolumeChange || onMuted)
				el.removeEventListener("volumechange", handleVolumeChange);
			if (onMediaError) el.removeEventListener("error", handleError);
		};
	}, [
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onVolumeChange,
		onMuted,
		onMediaError,
	]);

	const contextValue = React.useMemo<MediaPlayerContextValue>(
		() => ({
			mediaId,
			labelId,
			descriptionId,
			mediaRef,
			disabled,
		}),
		[mediaId, labelId, descriptionId, disabled],
	);

	return (
		<MediaPlayerContext.Provider value={contextValue}>
			<fieldset
				aria-describedby={descriptionId}
				disabled={disabled}
				data-disabled={disabled ? "" : undefined}
				data-slot="media-player"
				data-state={mediaPaused ? "paused" : "playing"}
				tabIndex={disabled ? undefined : 0}
				{...rootProps}
				ref={ref}
				onKeyDown={onKeyDown}
				className={cn(
					"relative isolate m-0 flex min-w-0 flex-col border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50",
					className,
				)}
			>
				<legend id={labelId} className="sr-only">
					{label ?? "Audio player"}
				</legend>
				<span id={descriptionId} className="sr-only">
					Audio player. Use space bar to play/pause, arrow keys to seek and
					adjust volume.
				</span>
				{children}
			</fieldset>
		</MediaPlayerContext.Provider>
	);
}

// ---------------------------------------------------------------------------
// MediaPlayerAudio
// ---------------------------------------------------------------------------

function MediaPlayerAudio(props: React.ComponentProps<"audio">) {
	const { ref, ...audioProps } = props;

	const context = useMediaPlayerContext("MediaPlayerAudio");
	const mediaRefCallback = useMediaRef();
	const composedRef = useComposedRefs(ref, context.mediaRef, mediaRefCallback);

	return (
		<audio
			aria-describedby={context.descriptionId}
			aria-labelledby={context.labelId}
			data-slot="media-player-audio"
			{...audioProps}
			id={context.mediaId}
			ref={composedRef}
		/>
	);
}

function MediaPlayerPlay(
	props: Omit<React.ComponentProps<typeof Button>, "children"> & {
		children?: React.ReactNode;
	},
) {
	const { children, className, ...rest } = props;

	const context = useMediaPlayerContext("MediaPlayerPlay");
	const dispatch = useMediaDispatch();
	const mediaPaused = useMediaSelector((state) => state.mediaPaused ?? true);

	const onPlayToggle = React.useCallback(() => {
		dispatch({
			type: mediaPaused
				? MediaActionTypes.MEDIA_PLAY_REQUEST
				: MediaActionTypes.MEDIA_PAUSE_REQUEST,
		});
	}, [dispatch, mediaPaused]);

	return (
		<Tooltip delay={0}>
			<Button
				isIconOnly
				variant="ghost"
				aria-controls={context.mediaId}
				aria-label={mediaPaused ? "Play" : "Pause"}
				data-slot="media-player-play-button"
				data-state={mediaPaused ? "off" : "on"}
				isDisabled={context.disabled}
				{...rest}
				className={cn(
					"size-8 [&_svg:not([class*='fill-'])]:fill-current shrink-0",
					className,
				)}
				onPress={onPlayToggle}
			>
				{children ??
					(mediaPaused ? (
						<HugeiconsIcon icon={PauseIcon} />
					) : (
						<HugeiconsIcon icon={PlayIcon} />
					))}
			</Button>
			<Tooltip.Content>
				<p>{mediaPaused ? "Play" : "Pause"} (Space)</p>
			</Tooltip.Content>
		</Tooltip>
	);
}

interface SeekButtonProps
	extends Omit<React.ComponentProps<typeof Button>, "children"> {
	seconds?: number;
	children?: React.ReactNode;
}

function MediaPlayerSeekBackward(props: SeekButtonProps) {
	const { seconds = SEEK_STEP_SHORT, children, className, ...rest } = props;

	const context = useMediaPlayerContext("MediaPlayerSeekBackward");
	const dispatch = useMediaDispatch();
	const mediaCurrentTime = useMediaSelector(
		(state) => state.mediaCurrentTime ?? 0,
	);

	const onSeek = React.useCallback(() => {
		dispatch({
			type: MediaActionTypes.MEDIA_SEEK_REQUEST,
			detail: Math.max(0, mediaCurrentTime - seconds),
		});
	}, [dispatch, mediaCurrentTime, seconds]);

	return (
		<Tooltip delay={600}>
			<Button
				isIconOnly
				variant="ghost"
				aria-controls={context.mediaId}
				aria-label={`Back ${seconds} seconds`}
				data-slot="media-player-seek-backward"
				isDisabled={context.disabled}
				{...rest}
				className={cn("shrink-0", className)}
				onPress={onSeek}
			>
				{children ?? <HugeiconsIcon icon={Backward02Icon} />}
			</Button>
			<Tooltip.Content>
				<p>Back {seconds}s</p>
			</Tooltip.Content>
		</Tooltip>
	);
}

function MediaPlayerSeekForward(props: SeekButtonProps) {
	const { seconds = SEEK_STEP_LONG, children, className, ...rest } = props;

	const context = useMediaPlayerContext("MediaPlayerSeekForward");
	const dispatch = useMediaDispatch();
	const mediaCurrentTime = useMediaSelector(
		(state) => state.mediaCurrentTime ?? 0,
	);
	const [, seekableEnd] = useMediaSelector(
		(state) => state.mediaSeekable ?? [0, 0],
	);

	const onSeek = React.useCallback(() => {
		dispatch({
			type: MediaActionTypes.MEDIA_SEEK_REQUEST,
			detail: Math.min(
				seekableEnd ?? Number.POSITIVE_INFINITY,
				mediaCurrentTime + seconds,
			),
		});
	}, [dispatch, mediaCurrentTime, seekableEnd, seconds]);

	return (
		<Tooltip delay={600}>
			<Button
				isIconOnly
				variant="ghost"
				aria-controls={context.mediaId}
				aria-label={`Forward ${seconds} seconds`}
				data-slot="media-player-seek-forward"
				isDisabled={context.disabled}
				{...rest}
				className={cn("shrink-0", className)}
				onPress={onSeek}
			>
				{children ?? <HugeiconsIcon icon={Forward02Icon} />}
			</Button>
			<Tooltip.Content>
				<p>Forward {seconds}s</p>
			</Tooltip.Content>
		</Tooltip>
	);
}

// ---------------------------------------------------------------------------
// MediaPlayerSeek
// ---------------------------------------------------------------------------

interface MediaPlayerSeekProps {
	withTime?: boolean;
	className?: string;
}

function MediaPlayerSeek(props: MediaPlayerSeekProps) {
	const { withTime = false, className } = props;

	const context = useMediaPlayerContext("MediaPlayerSeek");
	const dispatch = useMediaDispatch();

	const mediaCurrentTime = useMediaSelector(
		(state) => state.mediaCurrentTime ?? 0,
	);
	const [seekableStart = 0, seekableEnd = 0] = useMediaSelector(
		(state) => state.mediaSeekable ?? [0, 0],
	);
	const mediaBuffered = useMediaSelector((state) => state.mediaBuffered ?? []);
	const mediaEnded = useMediaSelector((state) => state.mediaEnded ?? false);

	const [pendingSeekTime, setPendingSeekTime] = React.useState<number | null>(
		null,
	);

	const displayValue = pendingSeekTime ?? mediaCurrentTime;

	// Sync pending seek with actual time
	React.useEffect(() => {
		if (pendingSeekTime !== null) {
			const diff = Math.abs(mediaCurrentTime - pendingSeekTime);
			if (diff < 0.5) {
				setPendingSeekTime(null);
			}
		}
	}, [mediaCurrentTime, pendingSeekTime]);

	const bufferedProgress = React.useMemo(() => {
		if (mediaBuffered.length === 0 || seekableEnd <= 0) return 0;
		if (mediaEnded) return 1;

		const containingRange = mediaBuffered.find(
			([start, end]) => start <= mediaCurrentTime && mediaCurrentTime <= end,
		);
		if (containingRange) {
			return Math.min(1, containingRange[1] / seekableEnd);
		}
		return Math.min(1, seekableStart / seekableEnd);
	}, [mediaBuffered, mediaCurrentTime, seekableEnd, mediaEnded, seekableStart]);

	const onSeek = React.useCallback(
		(value: number | number[]) => {
			const time = typeof value === "number" ? value : (value[0] ?? 0);
			setPendingSeekTime(time);
			dispatch({
				type: MediaActionTypes.MEDIA_SEEK_REQUEST,
				detail: time,
			});
		},
		[dispatch],
	);

	const onSeekEnd = React.useCallback(
		(value: number | number[]) => {
			const time = typeof value === "number" ? value : (value[0] ?? 0);
			setPendingSeekTime(time);
			dispatch({
				type: MediaActionTypes.MEDIA_SEEK_REQUEST,
				detail: time,
			});
		},
		[dispatch],
	);

	const currentTime = timeUtils.formatTime(displayValue, seekableEnd);
	const remainingTime = timeUtils.formatTime(
		seekableEnd - displayValue,
		seekableEnd,
	);

	const seekSlider = (
		<Slider
			aria-controls={context.mediaId}
			aria-label="Seek"
			isDisabled={context.disabled}
			minValue={seekableStart}
			maxValue={seekableEnd || 1}
			step={0.01}
			value={displayValue}
			onChange={onSeek}
			onChangeEnd={onSeekEnd}
			className={cn("w-full relative", className)}
		>
			<Slider.Track className="h-2 rounded-full bg-surface-secondary">
				{/* Buffered progress */}
				<div
					data-slot="media-player-seek-buffered"
					className="absolute h-full bg-muted will-change-[width]"
					style={{ width: `${bufferedProgress * 100}%` }}
				/>
				<Slider.Fill />
				<Slider.Thumb className="size-4 rounded-full bg-surface-secondary" />
			</Slider.Track>
		</Slider>
	);

	if (withTime) {
		return (
			<div className="flex w-full items-center gap-2">
				<span className="text-sm tabular-nums" aria-live="polite">
					{currentTime}
				</span>
				{seekSlider}
				<span className="text-sm tabular-nums">{remainingTime}</span>
			</div>
		);
	}

	return seekSlider;
}

interface MediaPlayerVolumeProps {
	expandable?: boolean;
	className?: string;
}

function MediaPlayerVolume(props: MediaPlayerVolumeProps) {
	const { expandable = false, className } = props;

	const context = useMediaPlayerContext("MediaPlayerVolume");
	const dispatch = useMediaDispatch();
	const mediaVolume = useMediaSelector((state) => state.mediaVolume ?? 1);
	const mediaMuted = useMediaSelector((state) => state.mediaMuted ?? false);
	const mediaVolumeLevel = useMediaSelector(
		(state) => state.mediaVolumeLevel ?? "high",
	);

	const onMute = React.useCallback(() => {
		dispatch({
			type: mediaMuted
				? MediaActionTypes.MEDIA_UNMUTE_REQUEST
				: MediaActionTypes.MEDIA_MUTE_REQUEST,
		});
	}, [dispatch, mediaMuted]);

	const onVolumeChange = React.useCallback(
		(value: number | number[]) => {
			const volume = typeof value === "number" ? value : (value[0] ?? 0);
			dispatch({
				type: MediaActionTypes.MEDIA_VOLUME_REQUEST,
				detail: volume,
			});
		},
		[dispatch],
	);

	const effectiveVolume = mediaMuted ? 0 : mediaVolume;

	return (
		<div
			data-slot="media-player-volume-container"
			className={cn(
				"group flex items-center",
				expandable
					? "gap-0 group-focus-within:gap-2 group-hover:gap-1.5"
					: "gap-1.5",
				className,
			)}
		>
			<Tooltip delay={0}>
				<Button
					isIconOnly
					variant="ghost"
					aria-controls={context.mediaId}
					aria-label={mediaMuted ? "Unmute" : "Mute"}
					data-slot="media-player-volume-trigger"
					data-state={mediaMuted ? "on" : "off"}
					isDisabled={context.disabled}
					className="size-8"
					onPress={onMute}
				>
					{mediaVolumeLevel === "off" || mediaMuted ? (
						<HugeiconsIcon icon={VolumeMute02Icon} />
					) : mediaVolumeLevel === "high" ? (
						<HugeiconsIcon icon={VolumeHighIcon} />
					) : (
						<HugeiconsIcon icon={VolumeLowIcon} />
					)}
				</Button>
				<Tooltip.Content>
					<p>{mediaMuted ? "Unmute" : "Mute"} (M)</p>
				</Tooltip.Content>
			</Tooltip>
			<Slider
				aria-controls={context.mediaId}
				aria-label="Volume"
				isDisabled={context.disabled}
				minValue={0}
				maxValue={1}
				step={0.1}
				value={effectiveVolume}
				onChange={onVolumeChange}
				className={cn(
					"relative flex touch-none select-none items-center",
					expandable
						? "w-0 opacity-0 transition-[width,opacity] duration-200 ease-in-out group-focus-within:w-16 group-focus-within:opacity-100 group-hover:w-16 group-hover:opacity-100"
						: "w-16",
				)}
			>
				<Slider.Track className="h-2 rounded-full bg-surface-secondary">
					<Slider.Fill />
					<Slider.Thumb className="size-4 rounded-full bg-surface-secondary" />
				</Slider.Track>
			</Slider>
		</div>
	);
}

interface MediaPlayerTimeProps extends React.ComponentProps<"div"> {
	variant?: "progress" | "remaining" | "duration";
}

function MediaPlayerTime(props: MediaPlayerTimeProps) {
	const { variant = "progress", className, ...timeProps } = props;

	const mediaCurrentTime = useMediaSelector(
		(state) => state.mediaCurrentTime ?? 0,
	);
	const [, seekableEnd = 0] = useMediaSelector(
		(state) => state.mediaSeekable ?? [0, 0],
	);

	const times = React.useMemo(() => {
		if (variant === "remaining") {
			return {
				remaining: timeUtils.formatTime(
					seekableEnd - mediaCurrentTime,
					seekableEnd,
				),
			};
		}
		if (variant === "duration") {
			return {
				duration: timeUtils.formatTime(seekableEnd, seekableEnd),
			};
		}
		return {
			current: timeUtils.formatTime(mediaCurrentTime, seekableEnd),
			duration: timeUtils.formatTime(seekableEnd, seekableEnd),
		};
	}, [variant, mediaCurrentTime, seekableEnd]);

	if (variant === "remaining" || variant === "duration") {
		return (
			<div
				data-slot="media-player-time"
				data-variant={variant}
				{...timeProps}
				className={cn("text-foreground/80 text-sm tabular-nums", className)}
			>
				{times[variant]}
			</div>
		);
	}

	return (
		<div
			data-slot="media-player-time"
			data-variant={variant}
			{...timeProps}
			className={cn(
				"flex items-center gap-1 text-foreground/80 text-sm",
				className,
			)}
		>
			<span className="tabular-nums">{times.current}</span>
			<span aria-hidden="true">/</span>
			<span className="tabular-nums">{times.duration}</span>
		</div>
	);
}

interface MediaPlayerPlaybackSpeedProps {
	speeds?: number[];
	className?: string;
}

function MediaPlayerPlaybackSpeed(props: MediaPlayerPlaybackSpeedProps) {
	const { speeds = SPEEDS, className } = props;

	const context = useMediaPlayerContext("MediaPlayerPlaybackSpeed");
	const dispatch = useMediaDispatch();
	const mediaPlaybackRate = useMediaSelector(
		(state) => state.mediaPlaybackRate ?? 1,
	);

	const onPlaybackRateChange = React.useCallback(
		(rate: number) => {
			dispatch({
				type: MediaActionTypes.MEDIA_PLAYBACK_RATE_REQUEST,
				detail: rate,
			});
		},
		[dispatch],
	);

	return (
		<Dropdown>
			<Button
				variant="ghost"
				aria-controls={context.mediaId}
				aria-label="Playback speed"
				isDisabled={context.disabled}
				className={cn("h-8 w-16", className)}
			>
				{mediaPlaybackRate}x
			</Button>
			<Dropdown.Popover>
				<Dropdown.Menu onAction={(key) => onPlaybackRateChange(Number(key))}>
					{speeds.map((speed) => (
						<Dropdown.Item
							key={speed}
							id={String(speed)}
							textValue={`${speed}x`}
						>
							{mediaPlaybackRate === speed && (
								<HugeiconsIcon
									icon={Tick02Icon}
									size={16}
									className="shrink-0"
								/>
							)}
							<Label>{speed}x</Label>
						</Dropdown.Item>
					))}
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}

function MediaPlayerLoop(
	props: Omit<React.ComponentProps<typeof Button>, "children"> & {
		children?: React.ReactNode;
	},
) {
	const { children, className, ...rest } = props;

	const context = useMediaPlayerContext("MediaPlayerLoop");

	const [isLooping, setIsLooping] = React.useState(() => {
		return context.mediaRef.current?.loop ?? false;
	});

	React.useEffect(() => {
		const mediaElement = context.mediaRef.current;
		if (!mediaElement) return;

		setIsLooping(mediaElement.loop);

		const observer = new MutationObserver(() =>
			setIsLooping(mediaElement.loop),
		);
		observer.observe(mediaElement, {
			attributes: true,
			attributeFilter: ["loop"],
		});

		return () => observer.disconnect();
	}, [context.mediaRef]);

	const onLoopToggle = React.useCallback(() => {
		const mediaElement = context.mediaRef.current;
		if (mediaElement) {
			const newState = !mediaElement.loop;
			mediaElement.loop = newState;
			setIsLooping(newState);
		}
	}, [context.mediaRef]);

	return (
		<Tooltip delay={600}>
			<Button
				isIconOnly
				variant="ghost"
				aria-controls={context.mediaId}
				aria-label={isLooping ? "Disable loop" : "Enable loop"}
				aria-pressed={isLooping}
				data-slot="media-player-loop"
				data-state={isLooping ? "on" : "off"}
				isDisabled={context.disabled}
				{...rest}
				className={cn("size-8", className)}
				onPress={onLoopToggle}
			>
				{children ??
					(isLooping ? (
						<HugeiconsIcon icon={RepeatOne01Icon} />
					) : (
						<HugeiconsIcon icon={RepeatIcon} />
					))}
			</Button>
			<Tooltip.Content>
				<p>{isLooping ? "Disable loop" : "Enable loop"} (R)</p>
			</Tooltip.Content>
		</Tooltip>
	);
}

export {
	MediaPlayer,
	MediaPlayerAudio,
	MediaPlayerLoop,
	MediaPlayerPlay,
	MediaPlayerPlaybackSpeed,
	type MediaPlayerProps,
	MediaPlayerSeek,
	MediaPlayerSeekBackward,
	MediaPlayerSeekForward,
	MediaPlayerTime,
	MediaPlayerVolume,
	useMediaSelector as useMediaPlayer,
};
