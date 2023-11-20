const current = 0;

const update = 1;

suite.concurrent("Ref", () => {
  test.io(
    "get",
    Do((Δ) => {
      const ref   = Δ(Ref.make(current));
      const value = Δ(ref.get);
      return value.assert(strictEqualTo(current));
    }),
  );

  test.io(
    "getAndSet",
    Do((Δ) => {
      const ref    = Δ(Ref.make(current));
      const value1 = Δ(ref.getAndSet(update));
      const value2 = Δ(ref.get);
      return value1.assert(strictEqualTo(current)) && value2.assert(strictEqualTo(update));
    }),
  );

  test.io(
    "getAndUpdate",
    Do((Δ) => {
      const ref    = Δ(Ref.make(current));
      const value1 = Δ(ref.getAndUpdate(() => update));
      const value2 = Δ(ref.get);
      return value1.assert(strictEqualTo(current)) && value2.assert(strictEqualTo(update));
    }),
  );

  suite.concurrent("getAndUpdateJust", () => {
    test.io(
      "Just",
      Do((Δ) => {
        const ref    = Δ(Ref.make(current));
        const value1 = Δ(ref.getAndUpdateJust(() => Just(update)));
        const value2 = Δ(ref.get);
        return value1.assert(strictEqualTo(current)) && value2.assert(strictEqualTo(update));
      }),
    );

    test.io(
      "Nothing",
      Do((Δ) => {
        const ref    = Δ(Ref.make(current));
        const value1 = Δ(ref.getAndUpdateJust(() => Nothing()));
        const value2 = Δ(ref.get);
        return value1.assert(strictEqualTo(current)) && value2.assert(strictEqualTo(current));
      }),
    );
  });

  test.io(
    "set",
    Do((Δ) => {
      const ref = Δ(Ref.make(current));
      Δ(ref.set(update));
      const value = Δ(ref.get);
      return value.assert(strictEqualTo(update));
    }),
  );

  test.io(
    "update",
    Do((Δ) => {
      const ref = Δ(Ref.make(current));
      Δ(ref.update(() => update));
      const value = Δ(ref.get);
      return value.assert(strictEqualTo(update));
    }),
  );

  test.io(
    "modify",
    Do((Δ) => {
      const ref    = Δ(Ref.make(current));
      const value1 = Δ(ref.modify(() => [42, update]));
      const value2 = Δ(ref.get);
      return value1.assert(strictEqualTo(42)) && value2.assert(strictEqualTo(update));
    }),
  );

  suite.concurrent("modifyJust", () => {
    test.io(
      "Just",
      Do((Δ) => {
        const ref    = Δ(Ref.make(current));
        const value1 = Δ(ref.modifyJust("default", () => Just(["value", update])));
        const value2 = Δ(ref.get);
        return value1.assert(strictEqualTo("value")) && value2.assert(strictEqualTo(update));
      }),
    );

    test.io(
      "Nothing",
      Do((Δ) => {
        const ref    = Δ(Ref.make(current));
        const value1 = Δ(ref.modifyJust("default", () => Nothing()));
        const value2 = Δ(ref.get);
        return value1.assert(strictEqualTo("default")) && value2.assert(strictEqualTo(current));
      }),
    );
  });

  test.io(
    "updateAndGet",
    Do((Δ) => {
      const ref   = Δ(Ref.make(current));
      const value = Δ(ref.updateAndGet(() => update));
      return value.assert(strictEqualTo(update));
    }),
  );

  suite.concurrent("updateJustAndGet", () => {
    test.io(
      "Just",
      Do((Δ) => {
        const ref   = Δ(Ref.make(current));
        const value = Δ(ref.updateJustAndGet(() => Just(update)));
        return value.assert(strictEqualTo(update));
      }),
    );
    test.io(
      "Nothing",
      Do((Δ) => {
        const ref   = Δ(Ref.make(current));
        const value = Δ(ref.updateJustAndGet(() => Nothing()));
        return value.assert(strictEqualTo(current));
      }),
    );
  });

  test.io(
    "dimapEither",
    Do((Δ) => {
      const ref = Δ(
        Ref.make(current).map((ref) =>
          ref.dimapEither(
            (s: string) => {
              const n = parseInt(s);
              if (isNaN(n)) {
                return Either.left("Not a number");
              } else {
                return Either.right(n);
              }
            },
            (n) => (n > 10 ? Either.left("greater than 10") : Either.right(n.toString())),
          ),
        ),
      );

      Δ(ref.set(update.toString()));

      const value1 = Δ(ref.get);

      const error1 = Δ(ref.set("hello").either);

      Δ(ref.set("11"));
      const error2 = Δ(ref.get.either);

      return (
        value1.assert(strictEqualTo(update.toString())) &&
        error1.assert(isLeft(strictEqualTo("Not a number"))) &&
        error2.assert(isLeft(strictEqualTo("greater than 10")))
      );
    }),
  );
});
