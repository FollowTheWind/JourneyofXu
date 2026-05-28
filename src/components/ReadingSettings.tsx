import { CaseSensitive, Columns2, Languages, Volume2 } from "lucide-react";
import type { ReadingMode, VoiceKey } from "../types";

interface ReadingSettingsProps {
  mode: ReadingMode;
  fontScale: number;
  voice: VoiceKey;
  ambientEnabled: boolean;
  onModeChange: (mode: ReadingMode) => void;
  onFontScaleChange: (scale: number) => void;
  onVoiceChange: (voice: VoiceKey) => void;
  onAmbientEnabledChange: (enabled: boolean) => void;
}

const modes: Array<{ value: ReadingMode; label: string; icon: typeof Columns2 }> = [
  { value: "parallel", label: "对照", icon: Columns2 },
  { value: "original", label: "原文", icon: CaseSensitive },
  { value: "translation", label: "译文", icon: Languages },
];

const voices: Array<{ value: VoiceKey; label: string }> = [
  { value: "male_classic", label: "男声·典雅" },
  { value: "female_classic", label: "女声·典雅" },
  { value: "male_calm", label: "男声·沉静" },
  { value: "female_warm", label: "女声·温润" },
];

export function ReadingSettings({
  mode,
  fontScale,
  voice,
  ambientEnabled,
  onModeChange,
  onFontScaleChange,
  onVoiceChange,
  onAmbientEnabledChange,
}: ReadingSettingsProps) {
  return (
    <section className="settings-bar" aria-label="阅读设置">
      <div className="segmented-control" aria-label="阅读模式">
        {modes.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={mode === item.value ? "active" : ""}
              key={item.value}
              type="button"
              title={item.label}
              onClick={() => onModeChange(item.value)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <label className="setting-field">
        <span>字号</span>
        <input
          aria-label="字号"
          type="range"
          min="0.9"
          max="1.22"
          step="0.04"
          value={fontScale}
          onChange={(event) => onFontScaleChange(Number(event.target.value))}
        />
      </label>

      <label className="setting-field">
        <Volume2 size={17} />
        <select
          aria-label="音色"
          value={voice}
          onChange={(event) => onVoiceChange(event.target.value as VoiceKey)}
        >
          {voices.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="toggle-field">
        <input
          type="checkbox"
          checked={ambientEnabled}
          onChange={(event) => onAmbientEnabledChange(event.target.checked)}
        />
        <span>背景音</span>
      </label>
    </section>
  );
}
