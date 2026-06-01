import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { Article, Paragraph, ReadingMode, SelectedPassage, TextPair } from "../types";
import { formatInline } from "../textFormat";

interface ArticleReaderProps {
  article: Article;
  highlightedPairIds: Set<string>;
  mode: ReadingMode;
  fontScale: number;
  onPairFocus: (pairIds: Set<string>) => void;
  onSelectionChange: (selection: SelectedPassage | null) => void;
}

function SentenceSpan({
  pair,
  type,
  highlightedPairIds,
}: {
  pair: TextPair;
  type: "original" | "translation";
  highlightedPairIds: Set<string>;
  onPairFocus: (pairIds: Set<string>) => void;
}) {
  const text = type === "original" ? pair.original : pair.translation;

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
    }
  }

  return (
    <span
      className={`sentence ${highlightedPairIds.has(pair.pairId) ? "active" : ""}`}
      data-pair-id={pair.pairId}
      data-type={type}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {formatInline(text)}
    </span>
  );
}

function stripMarkdown(text: string) {
  return text.replace(/\*\*/g, "");
}

function collectPairIdsInRange(range: Range, root: HTMLElement) {
  const pairIds: string[] = [];
  const types = new Set<"original" | "translation">();
  const seen = new Set<string>();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      if (el.dataset?.pairId) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    if (range.intersectsNode(el)) {
      const id = el.dataset.pairId!;
      if (!seen.has(id)) {
        seen.add(id);
        pairIds.push(id);
        types.add(el.dataset.type as "original" | "translation");
      }
    }
  }

  const source: "original" | "translation" =
    types.has("original") && !types.has("translation")
      ? "original"
      : types.has("translation") && !types.has("original")
        ? "translation"
        : types.values().next().value ?? "original";

  return { pairIds, source };
}

export function ArticleReader({
  article,
  highlightedPairIds,
  mode,
  fontScale,
  onPairFocus,
  onSelectionChange,
}: ArticleReaderProps) {
  const showOriginal = mode !== "translation";
  const showTranslation = mode !== "original";
  const readerStyle = { "--reader-scale": fontScale } as CSSProperties;

  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const SCROLL_THRESHOLD = 10;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;

    const root = event.currentTarget;
    const selection = window.getSelection();

    if (!selection) return;

    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const { pairIds, source } = collectPairIdsInRange(range, root);
      if (pairIds.length === 0) return;

      const pairs = pairIds.map((id) => findPair(article, id)).filter(Boolean) as TextPair[];
      const text = pairs.map((p) => stripMarkdown(source === "original" ? p.original : p.translation)).join("");
      const counterpart = pairs.map((p) => stripMarkdown(source === "original" ? p.translation : p.original)).join("");

      const firstPair = pairs[0];
      const { paragraph, partHeading } = findParagraph(article, pairIds[0]);

      onPairFocus(new Set(pairIds));
      onSelectionChange({
        text,
        counterpart,
        pairIds,
        articleTitle: article.title,
        partHeading,
        scene: paragraph?.scene ?? "",
        shareImage: firstPair.shareImage || paragraph?.shareImage || "",
        source,
      });
      return;
    }

    // 判断是否为滚动：移动距离超过阈值且没有产生选区，视为滚动，不触发高亮
    if (start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > SCROLL_THRESHOLD || Math.abs(dy) > SCROLL_THRESHOLD) {
        return;
      }
    }

    // 单击：需要知道点击了哪个句子
    const target = event.target as HTMLElement;
    const sentenceEl = target.closest<HTMLElement>("[data-pair-id]");
    if (!sentenceEl) return;

    const pairId = sentenceEl.dataset.pairId!;
    const type = (sentenceEl.dataset.type ?? "original") as "original" | "translation";
    const pair = findPair(article, pairId);
    if (!pair) return;
    const { paragraph, partHeading } = findParagraph(article, pairId);

    onPairFocus(new Set([pairId]));
    onSelectionChange({
      text: stripMarkdown(type === "original" ? pair.original : pair.translation),
      counterpart: stripMarkdown(type === "original" ? pair.translation : pair.original),
      pairIds: [pairId],
      articleTitle: article.title,
      partHeading,
      scene: paragraph?.scene ?? "",
      shareImage: pair.shareImage || paragraph?.shareImage || "",
      source: type,
    });
  }

  return (
    <article className="article-reader" style={readerStyle} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div className="article-title-block">
        <p className="source-note">{article.sourceNote}</p>
        <h2>{article.title}</h2>
        <p className="article-intro">{article.intro}</p>
      </div>

      {article.parts.map((part) => (
        <section className="article-part" key={part.id}>
          <h3>【{part.heading}】</h3>
          {part.paragraphs.map((paragraph) => (
            <section className="paragraph-block" key={paragraph.id}>
              <div className="scene-label">{paragraph.scene}</div>
              <div className={`parallel-grid mode-${mode}`}>
                {showOriginal ? (
                  <div className="text-panel original-panel">
                    <h4>【原文】</h4>
                    <div className="sentence-flow">
                      {paragraph.pairs.map((pair) => (
                        <SentenceSpan
                          key={`${pair.pairId}-original`}
                          pair={pair}
                          type="original"
                          highlightedPairIds={highlightedPairIds}
                          onPairFocus={onPairFocus}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {showTranslation ? (
                  <div className="text-panel translation-panel">
                    <h4>【翻译】</h4>
                    <div className="sentence-flow">
                      {paragraph.pairs.map((pair) => (
                        <SentenceSpan
                          key={`${pair.pairId}-translation`}
                          pair={pair}
                          type="translation"
                          highlightedPairIds={highlightedPairIds}
                          onPairFocus={onPairFocus}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </section>
      ))}
    </article>
  );
}

function findPair(article: Article, pairId: string): TextPair | undefined {
  for (const part of article.parts) {
    for (const para of part.paragraphs) {
      for (const pair of para.pairs) {
        if (pair.pairId === pairId) return pair;
      }
    }
  }
  return undefined;
}

function findParagraph(article: Article, pairId: string): { paragraph: Paragraph | undefined; partHeading: string } {
  for (const part of article.parts) {
    for (const para of part.paragraphs) {
      if (para.pairs.some((p) => p.pairId === pairId)) {
        return { paragraph: para, partHeading: part.heading };
      }
    }
  }
  return { paragraph: undefined, partHeading: "" };
}
