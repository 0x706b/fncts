export class CacheStats {
  constructor(readonly hits: number, readonly misses: number, readonly size: number) {}
}
