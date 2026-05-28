import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Headphones,
  ImageDown,
  Languages,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import { ArticleReader } from "./components/ArticleReader";
import { AudioPlayer } from "./components/AudioPlayer";
import { CatalogPanel } from "./components/CatalogPanel";
import { ReadingSettings } from "./components/ReadingSettings";
import { ShareImageComposer } from "./components/ShareImageComposer";
import { articleHash, parseHashRoute } from "./hashRoute";
import { loadArticle, loadCatalog } from "./content";
import type {
  Article,
  Catalog,
  Paragraph,
  ReadingMode,
  SelectedPassage,
  VoiceKey,
} from "./types";

const savedArticleKey = "journey-of-xu:last-article";

function firstCatalogArticle(catalog: Catalog) {
  return catalog.volumes.flatMap((volume) => volume.articles)[0];
}

function findParagraph(article: Article | null, pairId?: string) {
  if (!article) {
    return undefined;
  }
  for (const part of article.parts) {
    for (const paragraph of part.paragraphs) {
      if (!pairId || paragraph.pairs.some((pair) => pair.pairId === pairId)) {
        return paragraph;
      }
    }
  }
  return article.parts[0]?.paragraphs[0];
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string>();
  const [highlightedPairId, setHighlightedPairId] = useState<string>();
  const [mode, setMode] = useState<ReadingMode>("parallel");
  const [fontScale, setFontScale] = useState(1);
  const [voice, setVoice] = useState<VoiceKey>("male_classic");
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [selectedPassage, setSelectedPassage] = useState<SelectedPassage | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then((nextCatalog) => {
        setCatalog(nextCatalog);
        const route = parseHashRoute();
        const firstArticle = firstCatalogArticle(nextCatalog);
        const savedArticle = localStorage.getItem(savedArticleKey) ?? undefined;
        const initialArticleId = route.articleId ?? savedArticle ?? firstArticle?.id;
        if (initialArticleId) {
          setActiveArticleId(initialArticleId);
          setHighlightedPairId(route.pairId);
          if (!route.articleId) {
            window.history.replaceState(null, "", articleHash(initialArticleId));
          }
        }
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    function onHashChange() {
      const route = parseHashRoute();
      if (route.articleId) {
        setActiveArticleId(route.articleId);
      }
      setHighlightedPairId(route.pairId);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!activeArticleId) {
      return;
    }
    setArticle(null);
    setSelectedPassage(null);
    localStorage.setItem(savedArticleKey, activeArticleId);
    loadArticle(activeArticleId)
      .then(setArticle)
      .catch((loadError) => setError(loadError.message));
  }, [activeArticleId]);

  useEffect(() => {
    if (highlightedPairId) {
      window.requestAnimationFrame(() => {
        document
          .querySelector(`[data-pair-id="${highlightedPairId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [article, highlightedPairId]);

  const activeParagraph = useMemo(
    () => findParagraph(article, highlightedPairId),
    [article, highlightedPairId],
  );

  const handleArticleSelect = useCallback((articleId: string) => {
    setActiveArticleId(articleId);
    setHighlightedPairId(undefined);
    window.location.hash = articleHash(articleId);
    if (window.innerWidth < 920) {
      setIsCatalogOpen(false);
    }
  }, []);

  const handlePairFocus = useCallback(
    (pairId: string) => {
      if (!article) {
        return;
      }
      setHighlightedPairId(pairId);
      window.history.replaceState(null, "", articleHash(article.id, pairId));
    },
    [article],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="icon-button"
          type="button"
          aria-label={isCatalogOpen ? "收起目录" : "打开目录"}
          title={isCatalogOpen ? "收起目录" : "打开目录"}
          onClick={() => setIsCatalogOpen((value) => !value)}
        >
          {isCatalogOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <p className="eyebrow">山水游记阅读器</p>
          <h1>徐霞客游记</h1>
        </div>
        <div className="topbar-meta" aria-label="功能概览">
          <span title="原文译文对照">
            <Languages size={17} /> 对照
          </span>
          <span title="段落朗读">
            <Headphones size={17} /> 朗读
          </span>
          <span title="分享图片">
            <ImageDown size={17} /> 分享
          </span>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className={`workspace ${isCatalogOpen ? "catalog-visible" : ""}`}>
        {catalog ? (
          <CatalogPanel
            catalog={catalog}
            activeArticleId={activeArticleId}
            isOpen={isCatalogOpen}
            onSelectArticle={handleArticleSelect}
          />
        ) : null}

        <section className="reader-column" aria-label="阅读区">
          <ReadingSettings
            mode={mode}
            fontScale={fontScale}
            voice={voice}
            ambientEnabled={ambientEnabled}
            onModeChange={setMode}
            onFontScaleChange={setFontScale}
            onVoiceChange={setVoice}
            onAmbientEnabledChange={setAmbientEnabled}
          />

          {article ? (
            <ArticleReader
              article={article}
              highlightedPairId={highlightedPairId}
              mode={mode}
              fontScale={fontScale}
              onPairFocus={handlePairFocus}
              onSelectionChange={setSelectedPassage}
            />
          ) : (
            <div className="loading-state">
              <BookOpen size={28} />
              <span>正在展开山水卷轴...</span>
            </div>
          )}
        </section>

        <aside className="tool-column" aria-label="音频与分享工具">
          <AudioPlayer
            paragraph={activeParagraph as Paragraph | undefined}
            voice={voice}
            ambientEnabled={ambientEnabled}
          />
          <ShareImageComposer selectedPassage={selectedPassage} />
        </aside>
      </div>
    </main>
  );
}
