import type { ASTAnnotation } from "./ASTAnnotation.js";

export class ASTAnnotationMap {
  constructor(readonly map: HashMap<ASTAnnotation<any>, any>) {}
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
