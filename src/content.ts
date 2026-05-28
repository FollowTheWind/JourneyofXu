import type { Article, Catalog } from "./types";

const baseUrl = import.meta.env.BASE_URL;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path.replace(/^\/+/, "")}`);
  if (!response.ok) {
    throw new Error(`无法加载内容：${path}`);
  }
  return response.json() as Promise<T>;
}

export function loadCatalog() {
  return fetchJson<Catalog>("/content/catalog.json");
}

export function loadArticle(articleId: string) {
  return fetchJson<Article>(`/content/articles/${articleId}.json`);
}

export function assetUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${baseUrl}${path.replace(/^\/+/, "")}`;
}
