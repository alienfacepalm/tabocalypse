import { BUILTIN_PACKS, UNSUCK_CLASSICS_PACK_ID, type IBuiltinPack } from "./builtin-packs";
import { UNSUCK_CLASSICS_SCRAPED_LINES } from "./unsuck-classics-lines.generated";
import { getHumorContentCacheSnapshot } from "./humor-content-memory";

function withRemoteLines(bundled: IBuiltinPack, remoteLines: string[] | undefined): IBuiltinPack {
  if (!remoteLines?.length) return bundled;
  return { ...bundled, lines: remoteLines };
}

/** Built-in packs with optional network-refreshed line pools overlaid on bundled copy. */
export function getResolvedBuiltinPacks(): IBuiltinPack[] {
  const cache = getHumorContentCacheSnapshot();
  return BUILTIN_PACKS.map((pack) => {
    if (pack.id === UNSUCK_CLASSICS_PACK_ID) {
      const lines =
        cache.unsuckLines && cache.unsuckLines.length > 0
          ? cache.unsuckLines
          : [...UNSUCK_CLASSICS_SCRAPED_LINES];
      return { ...pack, lines };
    }
    return withRemoteLines(pack, cache.packLinesById?.[pack.id]);
  });
}
