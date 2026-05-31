import { CaseSensitive, Columns2, Languages } from "lucide-react";
import type { ReadingMode } from "../types";

interface ReadingSettingsProps {
  mode: ReadingMode;
  fontScale: number;
  onModeChange: (mode: ReadingMode) => void;
  onFontScaleChange: (scale: number) => void;
}

const modes: Array<{ value: ReadingMode; label: string; icon: typeof Columns2 }> = [
  { value: "parallel", label: "对照", icon: Columns2 },
  { value: "original", label: "原文", icon: CaseSensitive },
  { value: "translation", label: "译文", icon: Languages },
];

export function ReadingSettings({
  mode,
  fontScale,
  onModeChange,
  onFontScaleChange,
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
    </section>
  );
}
