"use client";

import {
	MediaPlayer,
	MediaPlayerAudio,
	MediaPlayerPlay,
	MediaPlayerSeek,
	MediaPlayerSeekBackward,
	MediaPlayerSeekForward,
	MediaPlayerVolume,
} from "@/components/ui/media-player";

interface AudioPlayerProps {
	recordingUrl?: string | null;
}

export default function MeetingRecordingAudioPlayer({
	recordingUrl,
}: AudioPlayerProps) {
	if (!recordingUrl) {
		return null;
	}

	return (
		<div className="mt-6">
			<p className="text-foreground mb-1.5">Meeting Recording</p>
			<MediaPlayer label="Meeting recording">
				<MediaPlayerAudio src={recordingUrl} preload="metadata" />
				<div className="flex items-center gap-3 rounded bg-card ring ring-border p-3">
					<MediaPlayerSeekBackward seconds={10} />
					<MediaPlayerPlay />
					<MediaPlayerSeekForward seconds={10} />
					<MediaPlayerSeek withTime />
					<MediaPlayerVolume />
				</div>
			</MediaPlayer>
		</div>
	);
}
