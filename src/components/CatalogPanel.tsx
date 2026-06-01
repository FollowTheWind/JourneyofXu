import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Catalog, CatalogArticle, CatalogVolume } from "../types";

interface CatalogPanelProps {
  catalog: Catalog;
  activeArticleId?: string;
  isOpen: boolean;
  onSelectArticle: (articleId: string) => void;
}

interface FlatEntry {
  article: CatalogArticle;
  volume: CatalogVolume;
}

function flattenCatalog(catalog: Catalog): FlatEntry[] {
  return catalog.volumes.flatMap((volume) =>
    volume.articles.map((article) => ({ article, volume })),
  );
}

export function CatalogPanel({
  catalog,
  activeArticleId,
  isOpen,
  onSelectArticle,
}: CatalogPanelProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const entries = useMemo(() => {
    const all = flattenCatalog(catalog);
    if (!normalizedQuery) {
      return all;
    }
    return all.filter(({ article, volume }) =>
      `${article.title}${article.author}${article.dynasty}${volume.description}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [catalog, normalizedQuery]);

  return (
    <aside className={`catalog-panel ${isOpen ? "open" : ""}`} aria-label="篇目目录">
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
        {entries.map(({ article, volume }, index) => (
          <button
            className={article.id === activeArticleId ? "article-link active" : "article-link"}
            key={article.id}
            type="button"
            onClick={() => onSelectArticle(article.id)}
          >
            <span>{index + 1}. {article.title}</span>
            <small>{volume.description}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
