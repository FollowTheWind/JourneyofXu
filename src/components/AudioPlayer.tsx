import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume1, Waves } from "lucide-react";
import { assetUrl } from "../content";
import type { Paragraph, VoiceKey } from "../types";

interface AudioPlayerProps {
  paragraph?: Paragraph;
  voice: VoiceKey;
  ambientEnabled: boolean;
}

const voiceLabels: Record<VoiceKey, string> = {
  male_classic: "男声·典雅",
  female_classic: "女声·典雅",
  male_calm: "男声·沉静",
  female_warm: "女声·温润",
};

export function AudioPlayer({ paragraph, voice, ambientEnabled }: AudioPlayerProps) {
  const voiceRef = useRef<HTMLAudioElement>(null);
  const ambientRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0.92);
  const [ambientVolume, setAmbientVolume] = useState(0.35);

  const voiceSource = paragraph?.voiceAudio?.[voice];
  const available = Boolean(voiceSource);

  const audioTitle = useMemo(() => {
    if (!paragraph) {
      return "请选择段落";
    }
    return `${paragraph.scene} · ${voiceLabels[voice]}`;
  }, [paragraph, voice]);

  useEffect(() => {
    if (voiceRef.current) {
      voiceRef.current.volume = voiceVolume;
    }
  }, [voiceVolume]);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  useEffect(() => {
    setIsPlaying(false);
    voiceRef.current?.pause();
  }, [paragraph?.id, voice]);

  useEffect(() => {
    const ambient = ambientRef.current;
    if (!ambient) {
      return;
    }
    ambient.loop = true;
    if (ambientEnabled && isPlaying) {
      void ambient.play().catch(() => undefined);
    } else {
      ambient.pause();
    }
  }, [ambientEnabled, isPlaying, paragraph?.ambientAudio]);

  function togglePlay() {
    if (!voiceRef.current || !available) {
      return;
    }
    if (isPlaying) {
      voiceRef.current.pause();
      ambientRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    void voiceRef.current.play().then(() => {
      setIsPlaying(true);
      if (ambientEnabled) {
        void ambientRef.current?.play().catch(() => undefined);
      }
    });
  }

  function restart() {
    if (voiceRef.current) {
      voiceRef.current.currentTime = 0;
    }
  }

  function finish() {
    setIsPlaying(false);
    ambientRef.current?.pause();
  }

  return (
    <section className="tool-card audio-card">
      <div className="tool-card-head">
        <div>
          <p className="eyebrow">朗读</p>
          <h2>{audioTitle}</h2>
        </div>
        <Waves size={21} />
      </div>

      {paragraph ? (
        <>
          <div className="audio-controls">
            <button type="button" title="回到开头" aria-label="回到开头" onClick={restart}>
              <SkipBack size={18} />
            </button>
            <button
              className="primary-round"
              type="button"
              title={isPlaying ? "暂停" : "播放"}
              aria-label={isPlaying ? "暂停" : "播放"}
              disabled={!available}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button type="button" title="跳至结尾" aria-label="跳至结尾" onClick={() => {
              if (voiceRef.current) voiceRef.current.currentTime = voiceRef.current.duration || 0;
            }}>
              <SkipForward size={18} />
            </button>
          </div>

          <label className="volume-field">
            <Volume1 size={16} />
            <span>朗读</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={voiceVolume}
              onChange={(event) => setVoiceVolume(Number(event.target.value))}
            />
          </label>
          <label className="volume-field">
            <Waves size={16} />
            <span>背景</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(event) => setAmbientVolume(Number(event.target.value))}
            />
          </label>

          {!available ? <p className="muted-text">该段暂未提供当前音色。</p> : null}

          {voiceSource ? (
            <audio ref={voiceRef} src={assetUrl(voiceSource)} onEnded={finish} preload="metadata" />
          ) : null}
          {paragraph.ambientAudio ? (
            <audio ref={ambientRef} src={assetUrl(paragraph.ambientAudio)} preload="metadata" />
          ) : null}
        </>
      ) : (
        <p className="muted-text">点选任一原文或译文句子后，将加载该段朗读。</p>
      )}
    </section>
  );
}
