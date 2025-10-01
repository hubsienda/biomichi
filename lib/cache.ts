type IndexCache = {
  ids: Set<string>;
  updatedAt: number;
};

const globalForIndex = global as unknown as { __INDEX_CACHE?: IndexCache };

export const indexCache: IndexCache = globalForIndex.__INDEX_CACHE || (globalForIndex.__INDEX_CACHE = {
  ids: new Set<string>(),
  updatedAt: 0
});

export function setIndexIds(ids: string[]) {
  indexCache.ids = new Set(ids);
  indexCache.updatedAt = Date.now();
}

export function hasIndex() {
  return indexCache.ids.size > 0;
}

export function listIndexIds(): string[] {
  return Array.from(indexCache.ids);
}
