import { useEffect, useRef, useState } from "react";
import { Download, ImageDown, Share2 } from "lucide-react";
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
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const W = 1200;
  const H = 1600;

  canvas.width = W;
  canvas.height = H;

  // 1. Draw image — full canvas cover
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = assetUrl(selectedPassage.shareImage);
  });

  if (image.complete && image.naturalWidth > 0) {
    const { naturalWidth: iw, naturalHeight: ih } = image;
    const ir = iw / ih;
    const cr = W / H;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    if (ir > cr) {
      sw = ih * cr;
      sx = (iw - sw) / 2;
    } else {
      sh = iw / cr;
      sy = (ih - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, W, H);
  }

  // 2. Text panel — gradient from image into dark backdrop
  const panelY = H * 0.54;
  const grad = ctx.createLinearGradient(0, panelY, 0, H);
  grad.addColorStop(0,   "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.15,"rgba(0, 0, 0, 0.4)");
  grad.addColorStop(0.4, "rgba(0, 0, 0, 0.58)");
  grad.addColorStop(1,   "rgba(0, 0, 0, 0.7)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, panelY, W, H - panelY);

  // 3. Layout constants
  const M = 130;                      // side margin
  const TW = W - M * 2;               // text width (940px)
  const blockH = 520;                 // text block height
  const top = H - 90 - blockH;        // block top (990)

  // ---- “《徐霞客游记》” ----
  ctx.fillStyle = "rgba(212, 184, 136, 0.7)";
  ctx.font = "22px sans-serif";
  ctx.fillText("《徐霞客游记》", M, top);

  // ---- Article title ----
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 46px serif";
  ctx.fillText(selectedPassage.articleTitle, M, top + 52);

  // ---- Divider ----
  const divY = top + 80;
  ctx.strokeStyle = "rgba(212, 184, 136, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, divY);
  ctx.lineTo(W - M, divY);
  ctx.stroke();

  // ---- Original text ----
  const origTop = divY + 40;
  ctx.font = "34px serif";
  const origLines = wrapText(ctx, selectedPassage.text, TW).slice(0, 5);
  ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
  origLines.forEach((line, i) => {
    ctx.fillText(line, M, origTop + i * 48);
  });

  // ---- Translation text ----
  const transTop = origTop + origLines.length * 48 + 30;
  ctx.font = "26px sans-serif";
  const transLines = wrapText(ctx, selectedPassage.counterpart, TW).slice(0, 5);
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  transLines.forEach((line, i) => {
    ctx.fillText(line, M, transTop + i * 38);
  });

  return canvas.toDataURL("image/png");
}

export function ShareImageComposer({ selectedPassage }: ShareImageComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    setImageUrl(null);
  }, [selectedPassage?.pairIds, selectedPassage?.text]);

  async function renderImage() {
    if (!selectedPassage || !canvasRef.current) {
      return;
    }
    setIsRendering(true);
    const url = await drawShareImage(canvasRef.current, selectedPassage);
    setImageUrl(url);
    setIsRendering(false);
  }

  async function handleSave() {
    if (!imageUrl || !selectedPassage) return;
    const filename = `${selectedPassage.pairIds[0]}.png`;

    if (navigator.share && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({ files: [file] });
    } else {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = filename;
      a.click();
    }
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
              <button type="button" onClick={handleSave}>
                {/iPhone|iPad|iPod/.test(navigator.userAgent) ? <Share2 size={17} /> : <Download size={17} />}
                <span>保存图片</span>
              </button>
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
