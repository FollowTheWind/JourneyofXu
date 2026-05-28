export interface RouteState {
  articleId?: string;
  pairId?: string;
}

export function parseHashRoute(hash = window.location.hash): RouteState {
  const clean = hash.replace(/^#\/?/, "");
  const [, articleId, pairId] = clean.match(/^article\/([^/]+)\/?([^/]*)?/) ?? [];
  return {
    articleId,
    pairId: pairId || undefined,
  };
}

export function articleHash(articleId: string, pairId?: string) {
  return `#/article/${articleId}${pairId ? `/${pairId}` : ""}`;
}
