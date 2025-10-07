import { MouseEventHandler, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

interface AudioPlayerProps {
  recordingUrl?: string | null;
}

export default function MeetingRecordingAudioPlayer({
  recordingUrl,
}: AudioPlayerProps) {
  const playerRef = useRef<AudioPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);

  if (!recordingUrl) {
    return null;
  }

  const handlePlayPause = () => {
    const audio = playerRef.current?.audio?.current;

    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSkipBack = () => {
    const audio = playerRef.current?.audio?.current;
    if (!audio) {
      return;
    }
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = playerRef.current?.audio?.current;
    if (!audio) {
      return;
    }
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
  };

  const handleProgressClick: MouseEventHandler<HTMLDivElement> = (event) => {
    const audio = playerRef.current?.audio?.current;
    if (!audio || !duration) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;

    audio.currentTime = newTime;
  };

  const handleVolumeChange: MouseEventHandler<HTMLDivElement> = (event) => {
    const audio = playerRef.current?.audio?.current;
    if (!audio || !duration) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, clickX / width));

    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-6">
      <p className="text-muted-foreground mb-1.5">Meeting Recording</p>
      <div className="bg-card rounded ring ring-border p-3 w-full">
        <div style={{ display: "none" }}>
          <AudioPlayer
            ref={playerRef}
            src={recordingUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onListen={(e) => {
              const audio = e.target as HTMLAudioElement;
              if (audio && audio.currentTime) {
                setCurrentTime(audio.currentTime);
              }
            }}
            onLoadedMetaData={(e) => {
              const audio = e.target as HTMLAudioElement;
              if (audio && audio.duration) {
                setDuration(audio.duration);
              }
            }}
            volume={volume}
            hasDefaultKeyBindings={true}
            autoPlayAfterSrcChange={false}
            showSkipControls={false}
            showJumpControls={false}
            showDownloadProgress={false}
            showFilledProgress={false}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipBack}
              className="rounded-full cursor-pointer"
            >
              <SkipBack className="text-deep-saffron" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handlePlayPause}
              className="rounded-full cursor-pointer bg-deep-saffron"
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipForward}
              className="rounded-full cursor-pointer"
            >
              <SkipForward className="text-deep-saffron" />
            </Button>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm text-muted-foreground min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 bg-muted rounded-full h-2 cursor-pointer"
              role="button"
              onClick={handleProgressClick}
            >
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-muted-foreground" />
            <div
              className="w-20 bg-muted rounded-full h-2 cursor-pointer"
              role="button"
              onClick={handleVolumeChange}
            >
              <div
                className="bg-deep-saffron h-2 rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
