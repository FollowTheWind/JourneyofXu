import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Catalog } from "../types";

interface CatalogPanelProps {
  catalog: Catalog;
  activeArticleId?: string;
  isOpen: boolean;
  onSelectArticle: (articleId: string) => void;
}

export function CatalogPanel({
  catalog,
  activeArticleId,
  isOpen,
  onSelectArticle,
}: CatalogPanelProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const volumes = useMemo(() => {
    if (!normalizedQuery) {
      return catalog.volumes;
    }
    return catalog.volumes
      .map((volume) => ({
        ...volume,
        articles: volume.articles.filter((article) =>
          `${article.title}${article.author}${article.dynasty}`
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      }))
      .filter((volume) => volume.articles.length > 0);
  }, [catalog.volumes, normalizedQuery]);

  return (
    <aside className={`catalog-panel ${isOpen ? "open" : ""}`} aria-label="篇目目录">
      <div className="catalog-head">
        <div>
          <p className="eyebrow">目录</p>
          <h2>{catalog.title}</h2>
        </div>
        <p>{catalog.description}</p>
      </div>

      <label className="search-box">
        <Search size={17} />
        <input
          type="search"
          value={query}
          placeholder="搜索篇名、作者"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <nav className="volume-list">
        {volumes.map((volume) => (
          <section className="volume-group" key={volume.id}>
            <h3>{volume.title}</h3>
            <p>{volume.description}</p>
            <div className="article-list">
              {volume.articles.map((article) => (
                <button
                  className={article.id === activeArticleId ? "article-link active" : "article-link"}
                  key={article.id}
                  type="button"
                  onClick={() => onSelectArticle(article.id)}
                >
                  <span>{article.title}</span>
                  <small>
                    {article.dynasty} · {article.author}
                    {article.status === "sample" ? " · 样章" : ""}
                  </small>
                </button>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
