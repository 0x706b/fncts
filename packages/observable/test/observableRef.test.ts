import { ObservableRef } from "@fncts/observable/ObservableRef";
import { suite, test } from "@fncts/test/vitest";
import { expect, vi } from "vitest";

suite("ObservableRef", () => {
  test("observable", () => {
    const ref = ObservableRef.make(0);

    const f = vi.fn();

    const subscription = ref.observable.subscribe(f);

    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenLastCalledWith(0);

    ref.unsafeSet(1);

    expect(f).toHaveBeenCalledTimes(2);
    expect(f).toHaveBeenLastCalledWith(1);
    expect(ref.unsafeGet()).toEqual(1);

    ref.unsafeClear();

    expect(f).toHaveBeenCalledTimes(3);
    expect(f).toHaveBeenLastCalledWith(0);
    expect(ref.unsafeGet()).toEqual(0);

    subscription.unsubscribe();
  });
});
