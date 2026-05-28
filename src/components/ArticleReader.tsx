import type { CSSProperties, MouseEvent } from "react";
import type { Article, Paragraph, ReadingMode, SelectedPassage, TextPair } from "../types";
import { formatInline } from "../textFormat";

interface ArticleReaderProps {
  article: Article;
  highlightedPairId?: string;
  mode: ReadingMode;
  fontScale: number;
  onPairFocus: (pairId: string) => void;
  onSelectionChange: (selection: SelectedPassage | null) => void;
}

function pickSelectionText(fallback: string) {
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  return text || fallback;
}

function SentenceButton({
  pair,
  type,
  highlightedPairId,
  paragraph,
  article,
  partHeading,
  onPairFocus,
  onSelectionChange,
}: {
  pair: TextPair;
  type: "original" | "translation";
  highlightedPairId?: string;
  paragraph: Paragraph;
  article: Article;
  partHeading: string;
  onPairFocus: (pairId: string) => void;
  onSelectionChange: (selection: SelectedPassage | null) => void;
}) {
  const text = type === "original" ? pair.original : pair.translation;
  const counterpart = type === "original" ? pair.translation : pair.original;

  function handleMouseUp(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onPairFocus(pair.pairId);
    onSelectionChange({
      text: pickSelectionText(text.replace(/\*\*/g, "")),
      counterpart: counterpart.replace(/\*\*/g, ""),
      pairId: pair.pairId,
      articleTitle: article.title,
      partHeading,
      scene: paragraph.scene,
      shareImage: paragraph.shareImage,
      source: type,
    });
  }

  return (
    <button
      className={`sentence ${highlightedPairId === pair.pairId ? "active" : ""}`}
      data-pair-id={pair.pairId}
      type="button"
      onClick={() => onPairFocus(pair.pairId)}
      onMouseUp={handleMouseUp}
    >
      {formatInline(text)}
    </button>
  );
}

export function ArticleReader({
  article,
  highlightedPairId,
  mode,
  fontScale,
  onPairFocus,
  onSelectionChange,
}: ArticleReaderProps) {
  const showOriginal = mode !== "translation";
  const showTranslation = mode !== "original";
  const readerStyle = { "--reader-scale": fontScale } as CSSProperties;

  return (
    <article className="article-reader" style={readerStyle}>
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
                        <SentenceButton
                          key={`${pair.pairId}-original`}
                          pair={pair}
                          type="original"
                          highlightedPairId={highlightedPairId}
                          paragraph={paragraph}
                          article={article}
                          partHeading={part.heading}
                          onPairFocus={onPairFocus}
                          onSelectionChange={onSelectionChange}
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
                        <SentenceButton
                          key={`${pair.pairId}-translation`}
                          pair={pair}
                          type="translation"
                          highlightedPairId={highlightedPairId}
                          paragraph={paragraph}
                          article={article}
                          partHeading={part.heading}
                          onPairFocus={onPairFocus}
                          onSelectionChange={onSelectionChange}
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
