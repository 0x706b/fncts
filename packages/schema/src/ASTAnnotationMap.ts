import type { ASTAnnotation } from "./ASTAnnotation.js";
import type { EqualsContext } from "@fncts/base/data/Equatable";

export class ASTAnnotationMap implements Equatable {
  constructor(readonly map: HashMap<ASTAnnotation<any>, any>) {}

  [Symbol.equals](that: unknown, context: EqualsContext): boolean {
    if (!(that instanceof ASTAnnotationMap) || this.map.size !== that.map.size) {
      return false;
    }

    return this.map.corresponds(
      that.map,
      ([k1, v1], [k2, v2]) => context.comparator(k1, k2) && context.comparator(v1, v2),
    );
  }

  combine(that: ASTAnnotationMap): ASTAnnotationMap {
    return new ASTAnnotationMap(
      Conc.from(this.map)
        .concat(Conc.from(that.map))
        .foldLeft(HashMap.empty(), (acc, [k, v]) =>
          acc.set(
            k,
            acc.get(k).match(
              () => v,
              (_) => k.combine(_, v),
            ),
          ),
        ),
    );
  }
  get<V>(key: ASTAnnotation<V>): Maybe<V> {
    return this.map.get(key);
  }
  private overwrite<V>(key: ASTAnnotation<V>, value: V): ASTAnnotationMap {
    return new ASTAnnotationMap(this.map.set(key, value));
  }
  private update<V>(key: ASTAnnotation<V>, f: (v: Maybe<V>) => V): ASTAnnotationMap {
    return this.overwrite(key, f(this.get(key)));
  }
  annotate<V>(key: ASTAnnotation<V>, value: V): ASTAnnotationMap {
    return this.update(key, (v) =>
      v.match(
        () => value,
        (v) => key.combine(v, value),
      ),
    );
  }
  static empty: ASTAnnotationMap = new ASTAnnotationMap(HashMap.empty());
}
