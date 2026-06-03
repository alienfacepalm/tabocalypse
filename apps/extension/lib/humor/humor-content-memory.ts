export interface IHumorContentCache {
  unsuckLines?: string[];
  unsuckFetchedAt?: number;
  packLinesById?: Record<string, string[]>;
  packsFetchedAt?: number;
}

let memoryCache: IHumorContentCache = {};

export function getHumorContentCacheSnapshot(): IHumorContentCache {
  return memoryCache;
}

export function setHumorContentCacheSnapshot(cache: IHumorContentCache): void {
  memoryCache = cache;
}
