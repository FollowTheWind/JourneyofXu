import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
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
  CatalogArticle,
  Catalog,
  CatalogVolume,
  Paragraph,
  ReadingMode,
  SelectedPassage,
  VoiceKey,
} from "./types";

const savedArticleKey = "journey-of-xu:last-article";

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

function flattenCatalog(catalog: Catalog) {
  return catalog.volumes.flatMap((volume) =>
    volume.articles.map((article) => ({
      article,
      volume,
    })),
  );
}

function articleStatusLabel(status: CatalogArticle["status"]) {
  if (status === "complete") {
    return "完整版";
  }
  if (status === "draft") {
    return "整理中";
  }
  return "样章";
}

function HomePage({
  catalog,
  onSelectArticle,
}: {
  catalog: Catalog;
  onSelectArticle: (articleId: string) => void;
}) {
  const entries = flattenCatalog(catalog);

  return (
    <section className="home-view" aria-label="首页">
      <div className="home-hero">
        <p className="eyebrow">明代山水行旅</p>
        <h2>徐霞客游记</h2>
        <p>
          《徐霞客游记》以亲历山川为经，以日记笔法为纬，记录徐霞客数十年间的道路、山势、
          水文、寺观与风土。它既是古典游记的高峰，也是中国地理观察传统中极具现场感的一部
          作品。
        </p>
      </div>

      <div className="home-overview" aria-label="阅读入口概览">
        <div>
          <span>{entries.length}</span>
          <small>篇游记</small>
        </div>
        <div>
          <span>句级</span>
          <small>原文译文对照</small>
        </div>
        <div>
          <span>声景</span>
          <small>段落朗读</small>
        </div>
      </div>

      <section className="entry-section" aria-label="选择游记文章">
        <div className="section-heading">
          <p className="eyebrow">选择篇目</p>
          <h3>从一篇山水日记进入</h3>
        </div>
        <div className="entry-grid">
          {entries.map(({ article, volume }) => (
            <ArticleEntry
              article={article}
              key={article.id}
              volume={volume}
              onSelectArticle={onSelectArticle}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function ArticleEntry({
  article,
  volume,
  onSelectArticle,
}: {
  article: CatalogArticle;
  volume: CatalogVolume;
  onSelectArticle: (articleId: string) => void;
}) {
  return (
    <button className="entry-card" type="button" onClick={() => onSelectArticle(article.id)}>
      <span className="entry-kicker">
        {article.dynasty} · {article.author} · {articleStatusLabel(article.status)}
      </span>
      <strong>{article.title}</strong>
      <span>{volume.description}</span>
      <span className="entry-action">
        开始阅读
        <ArrowRight size={17} />
      </span>
    </button>
  );
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
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then((nextCatalog) => {
        setCatalog(nextCatalog);
        const route = parseHashRoute();
        if (route.articleId) {
          setActiveArticleId(route.articleId);
          setHighlightedPairId(route.pairId);
        } else {
          setActiveArticleId(undefined);
          setHighlightedPairId(undefined);
        }
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    function onHashChange() {
      const route = parseHashRoute();
      if (route.articleId) {
        setActiveArticleId(route.articleId);
      } else {
        setActiveArticleId(undefined);
      }
      setHighlightedPairId(route.pairId);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!activeArticleId) {
      setArticle(null);
      setSelectedPassage(null);
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
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    if (window.innerWidth < 920) {
      setIsCatalogOpen(false);
    }
  }, []);

  const handleHomeSelect = useCallback(() => {
    setActiveArticleId(undefined);
    setHighlightedPairId(undefined);
    setSelectedPassage(null);
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
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
        <button className="brand-button" type="button" onClick={handleHomeSelect}>
          <p className="eyebrow">山水游记阅读器</p>
          <h1>徐霞客游记</h1>
        </button>
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

      <div
        className={`workspace ${activeArticleId ? "reader-mode" : "home-mode"} ${
          isCatalogOpen ? "catalog-visible" : ""
        }`}
      >
        {catalog ? (
          <CatalogPanel
            catalog={catalog}
            activeArticleId={activeArticleId}
            isOpen={isCatalogOpen}
            onSelectArticle={handleArticleSelect}
          />
        ) : null}

        <section className="reader-column" aria-label="阅读区">
          {activeArticleId ? (
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
          ) : null}

          {!activeArticleId && catalog ? (
            <HomePage catalog={catalog} onSelectArticle={handleArticleSelect} />
          ) : article ? (
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

        {activeArticleId ? (
          <aside className="tool-column" aria-label="音频与分享工具">
            <button className="back-home" type="button" onClick={handleHomeSelect}>
              <ChevronLeft size={17} />
              返回首页
            </button>
            <AudioPlayer
              paragraph={activeParagraph as Paragraph | undefined}
              voice={voice}
              ambientEnabled={ambientEnabled}
            />
            <ShareImageComposer selectedPassage={selectedPassage} />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
