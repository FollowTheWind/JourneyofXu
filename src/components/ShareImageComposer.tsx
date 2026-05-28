import { useEffect, useRef, useState } from "react";
import { Download, ImageDown } from "lucide-react";
import { assetUrl } from "../content";
import type { SelectedPassage } from "../types";

interface ShareImageComposerProps {
  selectedPassage: SelectedPassage | null;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const characters = Array.from(text.replace(/\*\*/g, ""));
  const lines: string[] = [];
  let line = "";
  for (const character of characters) {
    const nextLine = line + character;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = character;
    } else {
      line = nextLine;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

async function drawShareImage(
  canvas: HTMLCanvasElement,
  selectedPassage: SelectedPassage,
): Promise<string> {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas not supported");
  }

  canvas.width = 1200;
  canvas.height = 1600;

  const image = new Image();
  image.crossOrigin = "anonymous";
  const imageLoaded = new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
  image.src = assetUrl(selectedPassage.shareImage);
  await imageLoaded;

  context.fillStyle = "#f7f3e8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (image.complete && image.naturalWidth > 0) {
    context.drawImage(image, 0, 0, canvas.width, 720);
  }

  const gradient = context.createLinearGradient(0, 540, 0, 1600);
  gradient.addColorStop(0, "rgba(247, 243, 232, 0.18)");
  gradient.addColorStop(0.25, "rgba(247, 243, 232, 0.95)");
  gradient.addColorStop(1, "#f7f3e8");
  context.fillStyle = gradient;
  context.fillRect(0, 520, canvas.width, 1080);

  context.fillStyle = "#9b3428";
  context.font = "30px sans-serif";
  context.fillText(selectedPassage.scene, 96, 710);

  context.fillStyle = "#17201c";
  context.font = "700 54px serif";
  context.fillText(selectedPassage.articleTitle, 96, 790);

  context.fillStyle = "#465149";
  context.font = "28px sans-serif";
  context.fillText(`《徐霞客游记》 · ${selectedPassage.partHeading}`, 96, 846);

  const textLabel = selectedPassage.source === "original" ? "原文" : "译文";
  const counterpartLabel = selectedPassage.source === "original" ? "译文" : "原文";

  context.fillStyle = "#17201c";
  context.font = "700 32px sans-serif";
  context.fillText(`【${textLabel}】`, 96, 945);

  context.font = "42px serif";
  const primaryLines = wrapText(context, selectedPassage.text, 1008).slice(0, 7);
  primaryLines.forEach((line, index) => {
    context.fillText(line, 96, 1015 + index * 58);
  });

  const counterpartTop = 1048 + primaryLines.length * 58;
  context.fillStyle = "#9b3428";
  context.font = "700 30px sans-serif";
  context.fillText(`【${counterpartLabel}】`, 96, counterpartTop);

  context.fillStyle = "#2f3b35";
  context.font = "32px sans-serif";
  const counterpartLines = wrapText(context, selectedPassage.counterpart, 1008).slice(0, 6);
  counterpartLines.forEach((line, index) => {
    context.fillText(line, 96, counterpartTop + 58 + index * 48);
  });

  context.strokeStyle = "rgba(23, 32, 28, 0.16)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(96, 1470);
  context.lineTo(1104, 1470);
  context.stroke();

  context.fillStyle = "#465149";
  context.font = "26px sans-serif";
  context.fillText("Journey of Xu · 句级对照阅读", 96, 1532);
  context.fillText(selectedPassage.pairId, 890, 1532);

  return canvas.toDataURL("image/png");
}

export function ShareImageComposer({ selectedPassage }: ShareImageComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    setImageUrl(null);
  }, [selectedPassage?.pairId, selectedPassage?.text]);

  async function renderImage() {
    if (!selectedPassage || !canvasRef.current) {
      return;
    }
    setIsRendering(true);
    const url = await drawShareImage(canvasRef.current, selectedPassage);
    setImageUrl(url);
    setIsRendering(false);
  }

  return (
    <section className="tool-card share-card">
      <div className="tool-card-head">
        <div>
          <p className="eyebrow">分享图</p>
          <h2>{selectedPassage ? selectedPassage.scene : "选中文字生成"}</h2>
        </div>
        <ImageDown size={21} />
      </div>

      {selectedPassage ? (
        <>
          <p className="selected-text">{selectedPassage.text}</p>
          <div className="share-actions">
            <button type="button" onClick={renderImage} disabled={isRendering}>
              <ImageDown size={17} />
              <span>{isRendering ? "生成中" : "生成图片"}</span>
            </button>
            {imageUrl ? (
              <a href={imageUrl} download={`${selectedPassage.pairId}.png`}>
                <Download size={17} />
                <span>下载</span>
              </a>
            ) : null}
          </div>
          {imageUrl ? <img className="share-preview" src={imageUrl} alt="分享图片预览" /> : null}
        </>
      ) : (
        <p className="muted-text">在原文或译文中点选一句，或拖选文字后，即可生成带背景画面的分享图片。</p>
      )}
      <canvas ref={canvasRef} className="hidden-canvas" aria-hidden="true" />
    </section>
  );
}
