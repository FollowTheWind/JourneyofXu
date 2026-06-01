import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import { ArticleReader } from "./components/ArticleReader";
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
  ReadingMode,
  SelectedPassage,
} from "./types";

const savedArticleKey = "journey-of-xu:last-article";

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
        <h2>徐霞客游记</h2>
        <p>
          一个明朝人，没考功名，没做官，把一辈子花在了路上。
          <br />
          三十年，四万里，一双草鞋走遍中国。
          <br />
          没人逼他，他只是想亲眼看看这个世界。
          <br />
          他写下的，就是《徐霞客游记》。
          <br />
          在这里，跟他走一程。
        </p>
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
  const [highlightedPairIds, setHighlightedPairIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<ReadingMode>("parallel");
  const [fontScale, setFontScale] = useState(1);
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
          setHighlightedPairIds(route.pairId ? new Set([route.pairId]) : new Set());
        } else {
          setActiveArticleId(undefined);
          setHighlightedPairIds(new Set());
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
      setHighlightedPairIds(route.pairId ? new Set([route.pairId]) : new Set());
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
    if (highlightedPairIds.size > 0) {
      const firstId = highlightedPairIds.values().next().value;
      window.requestAnimationFrame(() => {
        const el = document.querySelector(`[data-pair-id="${firstId}"]`);
        if (!el) return;
        // 仅在元素不可见时才滚动，避免干扰用户后续拖选
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        if (center < 0 || center > window.innerHeight) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }, [article, highlightedPairIds]);

  const handleArticleSelect = useCallback((articleId: string) => {
    setActiveArticleId(articleId);
    setHighlightedPairIds(new Set());
    window.location.hash = articleHash(articleId);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    if (window.innerWidth < 920) {
      setIsCatalogOpen(false);
    }
  }, []);

  const handleHomeSelect = useCallback(() => {
    setActiveArticleId(undefined);
    setHighlightedPairIds(new Set());
    setSelectedPassage(null);
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, []);

  const handlePairFocus = useCallback(
    (pairIds: Set<string>) => {
      if (!article) {
        return;
      }
      setHighlightedPairIds(pairIds);
      const firstId = pairIds.values().next().value;
      if (firstId) {
        window.history.replaceState(null, "", articleHash(article.id, firstId));
      }
    },
    [article],
  );

  const clearSelection = useCallback(() => {
    setSelectedPassage(null);
    setHighlightedPairIds(new Set());
  }, []);

  return (
    <main className="app-shell">
      {activeArticleId ? (
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
          <h1>徐霞客游记</h1>
        </button>
      </header>
      ) : null}

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
              onModeChange={setMode}
              onFontScaleChange={setFontScale}
            />
          ) : null}

          {!activeArticleId && catalog ? (
            <HomePage catalog={catalog} onSelectArticle={handleArticleSelect} />
          ) : article ? (
            <ArticleReader
              article={article}
              highlightedPairIds={highlightedPairIds}
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
          <aside className="tool-column" aria-label="分享工具">
            <button className="back-home" type="button" onClick={handleHomeSelect}>
              <ChevronLeft size={17} />
              返回首页
            </button>
            <ShareImageComposer selectedPassage={selectedPassage} onDismiss={clearSelection} />
          </aside>
        ) : null}
      </div>

      {activeArticleId ? (
        <div className={`mobile-share-sheet ${selectedPassage ? "open" : ""}`}>
          <div className="sheet-handle" role="button" tabIndex={0} onClick={clearSelection} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clearSelection(); } }} />
          <ShareImageComposer selectedPassage={selectedPassage} onDismiss={clearSelection} />
        </div>
      ) : null}
    </main>
  );
}
