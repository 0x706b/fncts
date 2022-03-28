import type { TestAnnotation } from "./TestAnnotation.js";

import { HashMap } from "@fncts/base/collection/immutable/HashMap";
import { identity } from "@fncts/base/data/function";

export class TestAnnotationMap {
  constructor(private readonly map: HashMap<TestAnnotation<any>, any>) {}

  combine(that: TestAnnotationMap): TestAnnotationMap {
    return new TestAnnotationMap(
      Conc.from(this.map)
        .concat(Conc.from(that.map))
        .foldLeft(HashMap.makeDefault(), (acc, [k, v]) =>
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

  get<V>(key: TestAnnotation<V>): V {
    return this.map.get(key).match(() => key.initial, identity);
  }

  private overwrite<V>(key: TestAnnotation<V>, value: V): TestAnnotationMap {
    return new TestAnnotationMap(this.map.set(key, value));
  }

  private update<V>(key: TestAnnotation<V>, f: (v: V) => V): TestAnnotationMap {
    return this.overwrite(key, f(this.get(key)));
  }

  annotate<V>(key: TestAnnotation<V>, value: V): TestAnnotationMap {
    return this.update(key, (_) => key.combine(_, value));
  }

  static empty: TestAnnotationMap = new TestAnnotationMap(HashMap.makeDefault());
}
