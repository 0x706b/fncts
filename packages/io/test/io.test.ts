import { Nothing } from "@fncts/base/data/Maybe";
import { isFailure, isSuccess } from "@fncts/io/IO/api";
import { deepEqualTo, every, halts } from "@fncts/test/control/Assertion";
import { TestClock } from "@fncts/test/control/TestClock";
import { test } from "@fncts/test/vitest";

import { withLatch } from "./Latch.js";

suite("IO", () => {
  suite("absorbWith", () => {
    test.io(
      "on fail",
      IO.fail("fail")
        .absorbWith(Function.identity)
        .result.assertIO(fails(strictEqualTo("fail"))),
    );

    test.io(
      "on halt",
      IO.halt("halt")
        .absorbWith(Function.identity)
        .result.assertIO(fails(strictEqualTo("halt"))),
    );

    test.io(
      "on success",
      IO.succeed(1)
        .absorbWith(() => "fails")
        .assertIO(strictEqualTo(1)),
    );
  });

  suite("acquireRelease", () => {
    test.io(
      "releases acquired resource on scope exit",
      Do((Δ) => {
        const ref      = Δ(Ref.make(0));
        const value    = Δ(IO.acquireRelease(IO.succeed(42), (n) => ref.set(n)).scoped);
        const released = Δ(ref.get);
        return value.assert(strictEqualTo(42)) && released.assert(strictEqualTo(42));
      }),
    );

    test.io(
      "disconnect releases acquired resource",
      Do((Δ) => {
        const ref      = Δ(Ref.make(false));
        const value    = Δ(IO.acquireRelease(IO.succeed(42), () => ref.set(true)).scoped.disconnect);
        const released = Δ(ref.get);
        return value.assert(strictEqualTo(42)) && released.assert(isTrue);
      }),
    );
  });

  suite("acquireReleaseExit", () => {
    test.io(
      "release receives scope exit",
      Do((Δ) => {
        const ref  = Δ(Ref.make<Exit<unknown, unknown>>(Exit.succeed(undefined)));
        const exit = Δ(
          (IO.acquireReleaseExit(IO.succeed(42), (_, exit) => ref.set(exit)) > IO.fail("use")).scoped.result,
        );
        const released = Δ(ref.get);
        return exit.assert(fails(strictEqualTo("use"))) && released.assert(fails(strictEqualTo("use")));
      }),
    );
  });

  suite("all", () => {
    test.io(
      "iterable",
      IO.all([IO.succeedNow(1), IO.succeedNow(2), IO.succeedNow(3)]).assertIO(strictEqualTo(Conc(1, 2, 3))),
    );

    test.io(
      "struct",
      IO.all({ a: IO.succeedNow(1), b: IO.succeedNow(2), c: IO.succeedNow(3) }).assertIO(
        deepEqualTo({ a: 1, b: 2, c: 3 }),
      ),
    );
  });

  suite("allConcurrent", () => {
    test.io(
      "iterable",
      IO.allConcurrent([IO.succeedNow(1), IO.succeedNow(2), IO.succeedNow(3)]).assertIO(strictEqualTo(Conc(1, 2, 3))),
    );

    test.io(
      "struct",
      IO.allConcurrent({ a: IO.succeedNow(1), b: IO.succeedNow(2), c: IO.succeedNow(3) }).assertIO(
        deepEqualTo({ a: 1, b: 2, c: 3 }),
      ),
    );

    test.io(
      "returns results in order",
      IO.allConcurrent([IO.yieldNow.as(1), IO.succeed(2), IO.succeed(3)]).assertIO(strictEqualTo(Conc(1, 2, 3))),
    );

    test.io("is referentially transparent", () => {
      const effect = IO.allConcurrent(List(IO.succeed(1), IO.succeed(2)));
      return effect.zip(effect).assertIO(deepEqualTo([Conc(1, 2), Conc(1, 2)]));
    });

    test.io(
      "preserves failures",
      IO.allConcurrent([IO.succeed(1), IO.fail("error")]).result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "bounded results are in order",
      IO.allConcurrent([IO.yieldNow.as(1), IO.succeed(2), IO.succeed(3)])
        .withConcurrency(2)
        .assertIO(strictEqualTo(Conc(1, 2, 3))),
    );
  });

  suite("async", () => {
    it.io("simple async must return", () => {
      const io = IO.async<never, never, number>((k) => k(IO.succeed(42)));
      return io.assertIO(strictEqualTo(42));
    });

    it.io(
      "async should not resume fiber twice after interruption",
      Do((Δ) => {
        const step            = Δ(Future.make<never, void>());
        const unexpectedPlace = Δ(Ref.make(List.empty<number>()));
        const runtime         = Δ(IO.runtime<Live>());
        const fork            = Δ(
          IO.async<never, never, void>((k) => {
            runtime.unsafeRunFiber(step.await > IO.succeed(k(unexpectedPlace.update((_) => 1 + _))));
          })
            .ensuring(
              IO.async<never, never, void>(() => {
                runtime.unsafeRunFiber(step.succeed(undefined));
                // never complete
              }),
            )
            .ensuring(unexpectedPlace.update((_) => 2 + _)).forkDaemon,
        );
        const result     = Δ(Live.withLive(fork.interrupt)((io) => io.timeout((1).seconds)));
        const unexpected = Δ(unexpectedPlace.get);
        return unexpected.assert(isEmpty) && result.assert(isNothing);
      }),
    );

    it.io("async is interruptible", () =>
      IO.async<never, never, never>(() => {
        //
      })
        .fork.flatMap((f) => f.interrupt)
        .as(42)
        .assertIO(strictEqualTo(42)),
    );

    test.io(
      "captures thrown defects",
      IO.async<never, never, never>(() => {
        throw "defect";
      }).result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "resumption takes precedence over registration defect",
      IO.async<never, never, number>((cb) => {
        cb(IO.succeed(42));
        throw "defect";
      }).assertIO(strictEqualTo(42)),
    );
  });

  suite("asyncInterrupt", () => {
    it.io(
      "asyncInterrupt runs cancel token on interrupt",
      Do((Δ) => {
        const release = Δ(Future.make<never, number>());
        const latch   = Δ(Future.make<never, void>());
        const runtime = Δ(IO.runtime<never>());
        const async   = IO.asyncInterrupt<never, never, never>(() => {
          runtime.unsafeRunFiber(latch.succeed(undefined));
          return Either.left(release.succeed(42).asUnit);
        });
        const fiber = Δ(async.fork);
        Δ(latch.await);
        Δ(fiber.interrupt);
        const result = Δ(release.await);
        return result.assert(strictEqualTo(42));
      }),
    );

    test.io(
      "async cancellation runs exactly once",
      Do((Δ) => {
        const registered = Δ(Future.make<never, void>());
        const ref        = Δ(Ref.make(0));
        const runtime    = Δ(IO.runtime<never>());
        const fiber      = Δ(
          IO.asyncInterrupt<never, never, never>(() => {
            runtime.unsafeRunFiber(registered.succeed(undefined));
            return Either.left(ref.update((n) => n + 1));
          }).fork,
        );
        Δ(registered.await);
        Δ(fiber.interrupt);
        Δ(fiber.interrupt);
        const count = Δ(ref.get);
        return count.assert(strictEqualTo(1));
      }),
    );
  });

  suite("asyncIO", () => {
    it.io("simple asyncIO must return", () => {
      const io = IO.asyncIO<never, never, number>((k) => IO.succeed(k(IO.succeed(42))));
      return io.assertIO(strictEqualTo(42));
    });

    it.io(
      "interrupt of asyncIO register",
      Do((Δ) => {
        const release = Δ(Future.make<never, void>());
        const acquire = Δ(Future.make<never, void>());
        const fiber   = Δ(
          IO.asyncIO<never, never, void>(() =>
            IO.bracket(
              acquire.succeed(undefined),
              () => IO.never,
              () => release.succeed(undefined),
            ),
          ).disconnect.fork,
        );
        Δ(acquire.await);
        Δ(fiber.interruptFork);
        const a = Δ(release.await);
        return a.assert(strictEqualTo(undefined));
      }),
    );

    it.io("asyncIO can fail before registering", () => {
      const io = IO.asyncIO<never, string, never>(() => IO.fail("Ouch")).swap;
      return io.assertIO(strictEqualTo("Ouch"));
    });

    it.io("asyncIO can defect before registering", () => {
      const io = IO.asyncIO<never, string, void>(() =>
        IO.succeed(() => {
          throw new Error("Ouch");
        }),
      ).result.map((exit) =>
        exit.match(
          (cause) => cause.defects.head.flatMap((u) => (u instanceof Error ? Just(u.message) : Nothing())),
          () => Nothing(),
        ),
      );
      return io.assertIO(isJust(strictEqualTo("Ouch")));
    });

    it.io("asyncIO is interruptible", () =>
      IO.asyncIO<never, never, never>(() => IO.never)
        .fork.flatMap((f) => f.interrupt)
        .as(42)
        .assertIO(strictEqualTo(42)),
    );

    test.io(
      "creation is interruptible",
      Do((Δ) => {
        const started = Δ(Future.make<never, void>());
        const fiber   = Δ(IO.asyncIO<never, never, never>(() => started.succeed(undefined) > IO.never).fork);
        Δ(started.await);
        const exit = Δ(fiber.interrupt);
        return exit.assert(isInterrupted);
      }),
    );

    test.io(
      "finalizer observes asynchronously registered failure",
      Do((Δ) => {
        const ref       = Δ(Ref.make(false));
        const exit      = Δ(IO.async<never, string, never>((cb) => cb(IO.fail("error"))).ensuring(ref.set(true)).result);
        const finalized = Δ(ref.get);
        return exit.assert(fails(strictEqualTo("error"))) && finalized.assert(isTrue);
      }),
    );
  });

  suite("asyncMaybe", () => {
    it.io(
      "asyncMaybe should not resume fiber twice after synchronous result",
      Do((Δ) => {
        const step            = Δ(Future.make<never, void>());
        const unexpectedPlace = Δ(Ref.make(List.empty<number>()));
        const runtime         = Δ(IO.runtime<Live>());
        const fork            = Δ(
          IO.asyncMaybe<never, never, void>((k) => {
            runtime.unsafeRunFiber(step.await > IO.succeed(k(unexpectedPlace.update((_) => 1 + _))));
            return Just(IO.unit);
          })
            .flatMap(() =>
              IO.async<never, never, void>(() => {
                runtime.unsafeRunFiber(step.succeed(undefined));
                // never complete
              }),
            )
            .ensuring(unexpectedPlace.update((_) => 2 + _)).uninterruptible.forkDaemon,
        );
        const result     = Δ(Live.withLive(fork.interrupt)((io) => io.timeout((1).seconds)));
        const unexpected = Δ(unexpectedPlace.get);
        return unexpected.assert(isEmpty) && result.assert(isNothing);
      }),
    );
  });

  suite("bimap", () => {
    test.io(
      "maps error channel",
      IO.fail(1)
        .bimap(
          (n) => n + 1,
          () => 0,
        )
        .result.assertIO(fails(strictEqualTo(2))),
    );

    test.io(
      "maps value channel",
      IO.succeed(1)
        .bimap(
          () => 0,
          (n) => n + 1,
        )
        .assertIO(strictEqualTo(2)),
    );
  });

  suite("bitap", () => {
    test.io(
      "peeks at failure",
      Do((Δ) => {
        const ref  = Δ(Ref.make(0));
        const exit = Δ(
          IO.fail(1).bitap(
            (e) => ref.set(e),
            () => IO.halt("unexpected"),
          ).result,
        );
        const seen = Δ(ref.get);
        return exit.assert(fails(strictEqualTo(1))) && seen.assert(strictEqualTo(1));
      }),
    );

    test.io(
      "peeks at success",
      Do((Δ) => {
        const ref   = Δ(Ref.make(0));
        const value = Δ(
          IO.succeed(1).bitap(
            () => IO.halt("unexpected"),
            (a) => ref.set(a),
          ),
        );
        const seen = Δ(ref.get);
        return value.assert(strictEqualTo(1)) && seen.assert(strictEqualTo(1));
      }),
    );
  });

  for (const exitAware of [false, true]) {
    suite(exitAware ? "bracketExit" : "bracket", () => {
      if (exitAware) {
        test.io("bracketExit error handling", () => {
          const releaseHalted: unknown = new Error("release halted");

          return Do((Δ) => {
            const exit = Δ(
              IO.bracketExit(
                IO.succeed(42),
                () => IO.fail("use failed"),
                (_value, _exit) => IO.halt(releaseHalted),
              ).result,
            );
            const cause = Δ(
              exit.matchCauseIO(
                (cause) => IO.succeed(cause),
                () => IO.fail("effect should have failed"),
              ),
            );
            return (
              cause.failures.assert(deepEqualTo(List("use failed"))) &&
              cause.defects.assert(deepEqualTo(List(releaseHalted)))
            );
          });
        });

        it.io("bracketExit is uninterruptible", () => {
          const io = Do((Δ) => {
            const future = Δ(Future.make<never, void>());
            const fiber  = Δ(
              IO.bracketExit(
                future.succeed() > IO.never > IO.succeed(1),
                () => IO.unit,
                () => IO.unit,
              ).forkDaemon,
            );
            return Δ(future.await > fiber.interrupt.timeoutTo((1).seconds, 42, () => 0));
          });
          return Live.live(io).assertIO(strictEqualTo(42));
        });

        it.io(
          "bracketExit use is interruptible",
          Do((Δ) => {
            const fiber = Δ(
              IO.bracketExit(
                IO.unit,
                () => IO.never,
                () => IO.unit,
              ).fork,
            );
            const res = Δ(fiber.interrupt.timeoutTo((1).seconds, 42, () => 0));
            return res.assert(strictEqualTo(0));
          }),
        );

        it.io(
          "bracketExit release called on interrupt",
          Do((Δ) => {
            const done  = Δ(Future.make<never, void>());
            const fiber = Δ(
              withLatch(
                (release) =>
                  IO.bracketExit(
                    IO.unit,
                    () => release > IO.never,
                    () => done.succeed(undefined),
                  ).fork,
              ),
            );
            Δ(fiber.interrupt);
            const r = Δ(done.await.timeoutTo((60).seconds, 42, () => 0));
            return r.assert(strictEqualTo(0));
          }),
        );

        test.io(
          "bracketExit exit is usage result",
          Do((Δ) => {
            const ref   = Δ(Ref.make<Exit<string, number>>(Exit.succeed(0)));
            const value = Δ(
              IO.bracketExit(
                IO.succeed(1),
                (n) => IO.succeed(n + 1),
                (_, exit) => ref.set(exit),
              ),
            );
            const exit = Δ(ref.get);
            return value.assert(strictEqualTo(2)) && exit.assert(strictEqualTo(Exit.succeed(2)));
          }),
        );
      } else {
        test.io(
          "bracket happy path",
          Do((Δ) => {
            const release = Δ(Ref.make(false));
            const result  = Δ(
              IO.bracket(
                IO.succeed(42),
                (n) => IO.succeed(n + 1),
                () => release.set(true),
              ),
            );
            const released = Δ(release.get);
            return result.assert(strictEqualTo(43)) && released.assert(isTrue);
          }),
        );

        it.io("bracket is uninterruptible", () => {
          const io = Do((Δ) => {
            const future = Δ(Future.make<never, void>());
            const fiber  = Δ(
              IO.bracket(
                future.succeed() < IO.never,
                () => IO.unit,
                () => IO.unit,
              ).forkDaemon,
            );
            return Δ(future.await > fiber.interrupt.timeoutTo((1).seconds, 42, () => 0));
          });
          return Live.live(io).assertIO(strictEqualTo(42));
        });

        it.io(
          "bracket use is interruptible",
          Do((Δ) => {
            const fiber = Δ(
              IO.bracket(
                IO.unit,
                () => IO.never,
                () => IO.unit,
              ).fork,
            );
            const res = Δ(fiber.interrupt);
            return res.assert(isInterrupted);
          }),
        );

        it.io("bracket release called on interrupt", () => {
          const io = Do((Δ) => {
            const f1    = Δ(Future.make<never, void>());
            const f2    = Δ(Future.make<never, void>());
            const fiber = Δ(
              IO.bracket(
                IO.unit,
                () => f1.succeed(undefined) > IO.never,
                () => f2.succeed(undefined) > IO.unit,
              ).fork,
            );
            Δ(f1.await);
            Δ(fiber.interrupt);
            Δ(f2.await);
          });
          return io.timeoutTo((1).seconds, 42, () => 0).assertIO(strictEqualTo(0));
        });

        for (const stage of ["acquire", "use", "release"] as const) {
          test.io(
            `error in just ${stage}`,
            Do((Δ) => {
              const ref     = Δ(Ref.make(Conc.empty<string>()));
              const acquire =
                ref.update((ns) => ns.append("acquire")) > (stage === "acquire" ? IO.fail("error") : IO.succeed(42));
              const exit = Δ(
                IO.bracket(
                  acquire,
                  () => ref.update((ns) => ns.append("use")) > (stage === "use" ? IO.fail("error") : IO.unit),
                  () => ref.update((ns) => ns.append("release")) > (stage === "release" ? IO.fail("error") : IO.unit),
                ).result,
              );
              const events = Δ(ref.get);
              return (
                exit.assert(fails(strictEqualTo("error"))) &&
                events.assert(strictEqualTo(stage === "acquire" ? Conc("acquire") : Conc("acquire", "use", "release")))
              );
            }),
          );
          test.io(`rethrown caught error in ${stage}`, () => {
            const failure = IO.fail("error").catchAll(IO.failNow);
            return IO.bracket(
              stage === "acquire" ? failure : IO.unit,
              () => (stage === "use" ? failure : IO.unit),
              () => (stage === "release" ? failure : IO.unit),
            ).result.assertIO(fails(strictEqualTo("error")));
          });
        }

        test.io(
          "finalizer can recover from error",
          Do((Δ) => {
            const ref   = Δ(Ref.make(false));
            const value = Δ(
              IO.bracket(
                IO.unit,
                () => IO.succeed(42),
                () => IO.fail("release").catchAll(() => ref.set(true)),
              ),
            );
            const recovered = Δ(ref.get);
            return value.assert(strictEqualTo(42)) && recovered.assert(isTrue);
          }),
        );

        test.io(
          "interrupt waits for finalizer",
          Do((Δ) => {
            const acquired   = Δ(Future.make<never, void>());
            const finalizing = Δ(Future.make<never, void>());
            const release    = Δ(Future.make<never, void>());
            const done       = Δ(Ref.make(false));
            const fiber      = Δ(
              IO.bracket(
                acquired.succeed(undefined),
                () => IO.never,
                () => finalizing.succeed(undefined) > release.await,
              ).fork,
            );
            Δ(acquired.await);
            const interrupter = Δ((fiber.interrupt > done.set(true)).fork);
            Δ(finalizing.await);
            const before = Δ(done.get);
            Δ(release.succeed(undefined));
            Δ(interrupter.join);
            const after = Δ(done.get);
            return before.assert(isFalse) && after.assert(isTrue);
          }),
        );
      }
      test.io(
        "use inherits uninterruptible status",
        Do((Δ) => {
          const effect = exitAware
            ? IO.bracketExit(
                IO.unit,
                () => IO.checkInterruptible((status) => IO.succeed(status.isInterruptible)),
                () => IO.unit,
              )
            : IO.bracket(
                IO.unit,
                () => IO.checkInterruptible((status) => IO.succeed(status.isInterruptible)),
                () => IO.unit,
              );
          const interruptible = Δ(effect.uninterruptible);
          return interruptible.assert(isFalse);
        }),
      );
      suite("disconnect", () => {
        if (exitAware) {
          test.io("bracketExit error handling", () => {
            const releaseHalted: unknown = new Error("release halted");

            return Do((Δ) => {
              const exit = Δ(
                IO.bracketExit(
                  IO.succeed(42),
                  () => IO.fail("use failed"),
                  (_value, _exit) => IO.halt(releaseHalted),
                ).disconnect.result,
              );
              const cause = Δ(
                exit.matchCauseIO(
                  (cause) => IO.succeed(cause),
                  () => IO.fail("effect should have failed"),
                ),
              );
              return (
                cause.failures.assert(deepEqualTo(List("use failed"))) &&
                cause.defects.assert(deepEqualTo(List(releaseHalted)))
              );
            });
          });

          test.io("bracketExit beast mode error handling", () => {
            const releaseHalted: unknown = new Error("release halted");

            return Do((Δ) => {
              const released = Δ(Ref.make(false));
              const exit     = Δ(
                IO.bracketExit(
                  IO.succeed(42),
                  () => released.set(true),
                  (_value, _exit): IO<never, never, never> => {
                    throw releaseHalted;
                  },
                ).disconnect.result,
              );
              const cause = Δ(
                exit.matchCauseIO(
                  (cause) => IO.succeed(cause),
                  () => IO.fail("effect should have failed"),
                ),
              );
              const isReleased = Δ(released.get);
              return cause.defects.assert(deepEqualTo(List(releaseHalted))) && isReleased.assert(isTrue);
            });
          });

          test.io(
            "bracketExit acquire returns immediately on interrupt",
            Do((Δ) => {
              const started  = Δ(Future.make<never, void>());
              const acquire  = Δ(Future.make<never, void>());
              const released = Δ(Future.make<never, void>());
              const fiber    = Δ(
                IO.bracketExit(
                  started.succeed(undefined) > acquire.await,
                  () => IO.unit,
                  () => released.succeed(undefined),
                ).disconnect.fork,
              );
              Δ(started.await);
              const exit = Δ(fiber.interrupt);
              Δ(acquire.succeed(undefined));
              Δ(released.await);
              return exit.assert(isInterrupted);
            }),
          );
        } else {
          test.io(
            "bracketExit happy path",
            Do((Δ) => {
              const release = Δ(Ref.make(false));
              const result  = Δ(
                IO.bracket(
                  IO.succeed(42),
                  (a) => IO.succeed(a + 1),
                  () => release.set(true),
                ).disconnect,
              );
              const released = Δ(release.get);
              return result.assert(strictEqualTo(43)) && released.assert(isTrue);
            }),
          );

          it.io(
            "bracket acquire returns immediately on interrupt",
            Do((Δ) => {
              const f1 = Δ(Future.make<never, void>());
              const f2 = Δ(Future.make<never, number>());
              const f3 = Δ(Future.make<never, void>());
              const s  = Δ(
                IO.bracket(
                  f1.succeed(undefined) > f2.await,
                  () => IO.unit,
                  () => f3.await,
                ).disconnect.fork,
              );
              Δ(f1.await);
              const res = Δ(s.interrupt);
              Δ(f3.succeed(undefined));
              return res.assert(isInterrupted);
            }),
          );
        }
        test.io(
          "use is interruptible",
          Do((Δ) => {
            const started = Δ(Future.make<never, void>());
            const effect  = exitAware
              ? IO.bracketExit(
                  IO.unit,
                  () => started.succeed(undefined) > IO.never,
                  () => IO.unit,
                )
              : IO.bracket(
                  IO.unit,
                  () => started.succeed(undefined) > IO.never,
                  () => IO.unit,
                );
            const fiber = Δ(effect.disconnect.fork);
            Δ(started.await);
            const exit = Δ(fiber.interrupt);
            return exit.assert(isInterrupted);
          }),
        );

        test.io(
          "release runs in separate fiber on interrupt",
          Do((Δ) => {
            const started  = Δ(Future.make<never, void>());
            const released = Δ(Future.make<never, FiberId>());
            const effect   = exitAware
              ? IO.bracketExit(
                  IO.unit,
                  () => started.succeed(undefined) > IO.never,
                  () => IO.fiberId.flatMap((id) => released.succeed(id)),
                )
              : IO.bracket(
                  IO.unit,
                  () => started.succeed(undefined) > IO.never,
                  () => IO.fiberId.flatMap((id) => released.succeed(id)),
                );
            const fiber = Δ(effect.disconnect.fork);
            Δ(started.await);
            Δ(fiber.interrupt);
            const releaseId = Δ(released.await);
            return releaseId.assert(strictEqualTo(fiber.id).invert);
          }),
        );
      });
    });
  }

  suite("cached", () => {
    test.io(
      "returns new instances after duration",
      Do((Δ) => {
        const cached = Δ(IO.succeed({}).cached((10).milliseconds));
        const first  = Δ(cached);
        const same   = Δ(cached);
        Δ(TestClock.adjust(11));
        const next = Δ(cached);
        return first.assert(strictEqualTo(same)) && first.assert(strictEqualTo(next).invert);
      }),
    );

    test.io(
      "handles infinite time to live",
      Do((Δ) => {
        const cached = Δ(IO.succeed({}).cached(Infinity.milliseconds));
        const first  = Δ(cached);
        Δ(TestClock.adjust(1000000));
        const next = Δ(cached);
        return first.assert(strictEqualTo(next));
      }),
    );
  });

  suite("cachedInvalidate", () => {
    test.io(
      "returns new instances after duration",
      Do((Δ) => {
        const [get] = Δ(IO.succeed({}).cachedInvalidate((10).milliseconds));
        const first = Δ(get);
        const same  = Δ(get);
        Δ(TestClock.adjust(11));
        const next = Δ(get);
        return first.assert(strictEqualTo(same)) && first.assert(strictEqualTo(next).invert);
      }),
    );

    test.io(
      "invalidated recomputation is interruptible (issue 9015)",
      Do((Δ) => {
        const started           = Δ(Future.make<never, void>());
        const ref               = Δ(Ref.make(true));
        const [get, invalidate] = Δ(
          ref.get
            .ifIO(started.succeed(undefined) > IO.never > ref.get, ref.set(false) > ref.get)
            .cachedInvalidate(Infinity.milliseconds),
        );
        const first = Δ(get);
        Δ(invalidate);
        const fiber = Δ(get.fork);
        Δ(started.await);
        const exit = Δ(fiber.interrupt);
        return first.assert(isFalse) && exit.assert(isInterrupted);
      }),
    );

    test.io(
      "invalidation forces recomputation",
      Do((Δ) => {
        const ref               = Δ(Ref.make(0));
        const [get, invalidate] = Δ(ref.updateAndGet((n) => n + 1).cachedInvalidate(Infinity.milliseconds));
        const first             = Δ(get);
        Δ(invalidate);
        const next = Δ(get);
        return first.assert(strictEqualTo(1)) && next.assert(strictEqualTo(2));
      }),
    );

    test.io(
      "get is interruptible",
      Do((Δ) => {
        const started = Δ(Future.make<never, void>());
        const [get]   = Δ((started.succeed(undefined) > IO.never).cachedInvalidate(Infinity.milliseconds));
        const fiber   = Δ(get.fork);
        Δ(started.await);
        const exit = Δ(fiber.interrupt);
        return exit.assert(isInterrupted);
      }),
    );

    test.io(
      "does not cache interruption",
      Do((Δ) => {
        const started = Δ(Future.make<never, void>());
        const ref     = Δ(Ref.make(0));
        const [get]   = Δ(
          ref
            .updateAndGet((n) => n + 1)
            .flatMap((n) => (n === 1 ? started.succeed(undefined) > IO.never : IO.succeed(n)))
            .cachedInvalidate(Infinity.milliseconds),
        );
        const fiber = Δ(get.fork);
        Δ(started.await);
        Δ(fiber.interrupt);
        const value = Δ(get);
        return value.assert(strictEqualTo(2));
      }),
    );
  });

  suite("catchAllCause", () => {
    test.io(
      "catchAllCause catches defect",
      IO.halt("defect")
        .catchAllCause((c) => IO.succeed(c.defects))
        .assertIO(strictEqualTo(List("defect"))),
    );
  });

  suite("catchJustCause", () => {
    test.io(
      "catches matching cause",
      IO.fail("error")
        .catchJustCause((c) => c.failures.head.map(IO.succeedNow))
        .assertIO(strictEqualTo("error")),
    );

    test.io(
      "fails if cause does not match",
      IO.fail("error")
        .catchJustCause((): Maybe<UIO<never>> => Nothing())
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "catches matching defect",
      IO.halt("defect")
        .catchJustCause((c) => c.defects.head.map(IO.succeedNow))
        .assertIO(strictEqualTo("defect")),
    );
  });

  suite("catchJustDefect", () => {
    test.io("recovers from some defects", () => {
      const s  = "division by zero";
      const io = IO.halt(s);
      return io
        .catchJustDefect((e) => (typeof e === "string" ? Just(IO.succeed(e)) : Nothing()))
        .assertIO(strictEqualTo(s));
    });

    test.io("leaves the rest", () => {
      const t  = "division by zero";
      const io = IO.halt(t);
      return io
        .catchJustDefect((e) => (typeof e !== "string" ? Just(IO.succeed(e)) : Nothing()))
        .result.assertIO(halts(strictEqualTo(t)));
    });

    test.io("leaves errors", () => {
      const t  = "division by zero";
      const io = IO.fail(t);
      return io.catchJustDefect((_) => Just(IO.succeed(_))).result.assertIO(fails(strictEqualTo(t)));
    });

    test.io("leaves values", () => {
      const t  = "division by zero";
      const io = IO.succeed(t);
      return io.catchJustDefect((_) => Just(IO.fail(_))).assertIO(strictEqualTo(t));
    });
  });

  suite("collect", () => {
    test.io(
      "returns failure ignoring value",
      Do((Δ) => {
        const goodCase = Δ(
          IO.succeed(0).collect(
            "value was not 0",
            Maybe.partial((miss) => (n) => (n === 0 ? n : miss())),
          ).sandbox.either,
        );
        const badCase = Δ(
          IO.succeed(1)
            .collect(
              "value was not 0",
              Maybe.partial((miss) => (n) => (n === 0 ? n : miss())),
            )
            .sandbox.either.map((either) => either.mapLeft((cause) => cause.failureOrCause)),
        );
        return (
          goodCase.assert(isRight(strictEqualTo(0))) && badCase.assert(isLeft(isLeft(strictEqualTo("value was not 0"))))
        );
      }),
    );
  });

  suite("collectIO", () => {
    test.io(
      "returns failure ignoring value",
      IO.succeed(1)
        .collectIO("missing", (): Maybe<UIO<never>> => Nothing())
        .result.assertIO(fails(strictEqualTo("missing"))),
    );

    test.io(
      "evaluates matching effect",
      IO.succeed(1)
        .collectIO("missing", (n) => Just(IO.succeed(n + 1)))
        .assertIO(strictEqualTo(2)),
    );
  });

  suite("concurrentErrors", () => {
    test.io(
      "one failure",
      IO.fail("error")
        .concurrentErrors()
        .result.assertIO(fails(strictEqualTo(List("error")))),
    );

    test.io(
      "all failures",
      IO.failCause(Cause.parallel(Cause.fail("left"), Cause.fail("right")))
        .concurrentErrors()
        .result.assertIO(fails(strictEqualTo(List("left", "right")))),
    );
  });

  suite("disconnect", () => {
    test.io(
      "returns immediately on interrupt and eventually finalizes",
      Do((Δ) => {
        const started    = Δ(Future.make<never, void>());
        const finalizing = Δ(Future.make<never, void>());
        const release    = Δ(Future.make<never, void>());
        const finished   = Δ(Future.make<never, void>());
        const fiber      = Δ(
          (started.succeed(undefined) > IO.never).ensuring(
            finalizing.succeed(undefined) > release.await > finished.succeed(undefined),
          ).disconnect.fork,
        );
        Δ(started.await);
        const exit = Δ(fiber.interrupt);
        Δ(finalizing.await);
        Δ(release.succeed(undefined));
        Δ(finished.await);
        return exit.assert(isInterrupted);
      }),
    );
  });

  suite("ensuring", () => {
    it.io("fail ensuring", () => {
      let finalized = false;

      const io = IO.fail("error").ensuring(
        IO.succeed(() => {
          finalized = true;
        }),
      );

      return Do((Δ) => {
        const a1 = Δ(io.result.assertIO(fails(strictEqualTo("error"))));
        const a2 = finalized.assert(isTrue);
        return a1 && a2;
      });
    });

    it.io("finalizer errors not caught", () => {
      const e2 = new Error("e2");
      const e3 = new Error("e3");

      const io = IO.fail("error").ensuring(IO.halt(e2)).ensuring(IO.halt(e3));

      const expectedCause = Cause.sequential(Cause.fail("error"), Cause.sequential(Cause.halt(e2), Cause.halt(e3)));

      return io.sandbox.swap.map((c) => c.untraced).assertIO(strictEqualTo(expectedCause));
    });

    it.io("finalizer errors reported", () => {
      let reported: Exit<never, number> = null!;

      const io = IO.succeed(42)
        .ensuring(IO.halt("error"))
        .fork.flatMap((f) =>
          f.await.flatMap((e) =>
            IO.succeed(() => {
              reported = e;
            }),
          ),
        );

      return Do((Δ) => {
        Δ(io);
        return reported.isSuccess().assert(isFalse);
      });
    });

    test.io("catch failing finalizers with fail", () => {
      const error = "error";
      const io    = IO.fail(error)
        .ensuring(
          IO.succeed(() => {
            throw 1;
          }),
        )
        .ensuring(
          IO.succeed(() => {
            throw 2;
          }),
        )
        .ensuring(
          IO.succeed(() => {
            throw 3;
          }),
        );

      const expectedCause = Cause.fail(error) + Cause.halt(1) + Cause.halt(2) + Cause.halt(3);

      return io.result.assertIO(deepEqualTo(Exit.failCause(expectedCause)));
    });

    test.io("catch failing finalizers with halt", () => {
      const error = "error";
      const io    = IO.halt(error)
        .ensuring(
          IO.succeed(() => {
            throw 1;
          }),
        )
        .ensuring(
          IO.succeed(() => {
            throw 2;
          }),
        )
        .ensuring(
          IO.succeed(() => {
            throw 3;
          }),
        );

      const expectedCause = Cause.halt(error) + Cause.halt(1) + Cause.halt(2) + Cause.halt(3);

      return io.result.assertIO(deepEqualTo(Exit.failCause(expectedCause)));
    });
  });

  suite("ensuringChildren", () => {
    it.io("supervise fibers", () => {
      const makeChild = (n: number): UIO<Fiber<never, void>> => (Clock.sleep((20).milliseconds * n) > IO.never).fork;

      const io = Do((Δ) => {
        const counter = Δ(Ref.make(0));
        Δ(
          (makeChild(1) > makeChild(2)).ensuringChildren((fs) =>
            fs.foldLeft(IO.unit, (acc, f) => acc > f.interrupt > counter.update((n) => n + 1)),
          ),
        );
        return Δ(counter.get);
      });

      return io.assertIO(strictEqualTo(2));
    });
  });

  suite("environment", () => {
    const tag = new Tag<{ readonly value: number }>("IOTestService");

    test.io(
      "provide is modular",
      Do((Δ) => {
        const read  = IO.serviceWith((s) => s.value, tag);
        const value = Δ(
          read
            .zip(read.provideService({ value: 2 }, tag))
            .zip(read)
            .provideService({ value: 4 }, tag),
        );
        return value.assert(deepEqualTo([[4, 2], 4]));
      }),
    );

    test.io(
      "async can use environment",
      IO.async<{ readonly value: number }, never, number>((cb) => cb(IO.serviceWith((s) => s.value, tag)))
        .provideService({ value: 10 }, tag)
        .assertIO(strictEqualTo(10)),
    );

    test.io(
      "serviceWithIO accesses service effectfully",
      IO.serviceWithIO((s) => IO.succeed(s.value + 3), tag)
        .provideService({ value: 0 }, tag)
        .assertIO(strictEqualTo(3)),
    );
  });

  suite("eventually", () => {
    test.io(
      "succeeds eventually",
      Do((Δ) => {
        const ref   = Δ(Ref.make(0));
        const value = Δ(
          ref.updateAndGet((n) => n + 1).flatMap((n) => (n < 10 ? IO.fail(n) : IO.succeed(n))).eventually,
        );
        const count = Δ(ref.get);
        return value.assert(strictEqualTo(10)) && count.assert(strictEqualTo(10));
      }),
    );
  });

  suite("filter", () => {
    test.io(
      "filters a collection using an effectful predicate",
      IO.filter([1, 2, 3, 4], (n) => IO.succeed(n % 2 === 0)).assertIO(strictEqualTo(Conc(2, 4))),
    );

    test.io(
      "filters a set using an effectful predicate",
      IO.filter(new Set([1, 2, 3, 4]), (n) => IO.succeed(n % 2 === 0)).assertIO(strictEqualTo(Conc(2, 4))),
    );

    test.io("empty input", IO.filter([], () => IO.halt("unexpected")).assertIO(isEmpty));
  });

  suite("filterNot", () => {
    test.io(
      "filters a collection using an effectful predicate",
      IO.filterNot([1, 2, 3, 4], (n) => IO.succeed(n % 2 === 0)).assertIO(strictEqualTo(Conc(1, 3))),
    );

    test.io(
      "filters a set using an effectful predicate",
      IO.filterNot(new Set([1, 2, 3, 4]), (n) => IO.succeed(n % 2 === 0)).assertIO(strictEqualTo(Conc(1, 3))),
    );
  });

  suite("filterOrElse", () => {
    test.io(
      "returns checked failure from held value",
      IO.succeed(1)
        .filterOrElse(
          (n) => n === 0,
          (n) => IO.fail(n + 1),
        )
        .result.assertIO(fails(strictEqualTo(2))),
    );

    test.io(
      "returns checked failure ignoring value",
      IO.succeed(1)
        .filterOrElse(
          (n) => n === 0,
          () => IO.fail("error"),
        )
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "does not evaluate fallback on success",
      IO.succeed(1)
        .filterOrElse(
          (n) => n === 1,
          () => IO.halt("unexpected"),
        )
        .assertIO(strictEqualTo(1)),
    );
  });

  suite("filterOrFail", () => {
    test.io(
      "returns failure ignoring value",
      IO.succeed(1)
        .filterOrFail(
          (n) => n === 0,
          () => "error",
        )
        .result.assertIO(fails(strictEqualTo("error"))),
    );
  });

  suite("firstSuccess", () => {
    test.io("returns first value", IO.firstSuccess([IO.succeed(1), IO.halt("unexpected")]).assertIO(strictEqualTo(1)));

    test.io(
      "returns last failure",
      IO.firstSuccess([IO.fail("first"), IO.fail("last")]).result.assertIO(fails(strictEqualTo("last"))),
    );

    test.io(
      "returns success after failures",
      IO.firstSuccess([IO.fail("first"), IO.fail("second"), IO.succeed(3)]).assertIO(strictEqualTo(3)),
    );
  });

  suite("foldLeft", () => {
    test.io(
      "sums with a successful step function",
      IO.foldLeft([1, 2, 3], 0, (b, a) => IO.succeed(b + a)).assertIO(strictEqualTo(6)),
    );

    test.io(
      "fails with a failing step function",
      IO.foldLeft([1, 2, 3], 0, () => IO.fail("error")).result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "runs sequentially from left to right",
      Do((Δ) => {
        const ref = Δ(Ref.make(Conc.empty<number>()));
        Δ(IO.foldLeft([1, 2, 3], 0, (b, a) => ref.update((ns) => ns.append(a)).as(b + a)));
        const visited = Δ(ref.get);
        return visited.assert(strictEqualTo(Conc(1, 2, 3)));
      }),
    );
  });

  suite("foldRight", () => {
    test.io(
      "sums with a successful step function",
      IO.foldRight<number, number, never, never>([1, 2, 3], IO.succeed(0), (a, b) => b.map((n) => a + n)).assertIO(
        strictEqualTo(6),
      ),
    );

    test.io(
      "fails with a failing step function",
      IO.foldRight([1, 2, 3], IO.succeed(0), () => IO.fail("error")).result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "runs sequentially from right to left",
      Do((Δ) => {
        const ref = Δ(Ref.make(Conc.empty<number>()));
        Δ(
          IO.foldRight<number, number, never, never>([1, 2, 3], IO.succeed(0), (a, b) =>
            b.flatMap((n) => ref.update((ns) => ns.append(a)).as(a + n)),
          ),
        );
        const visited = Δ(ref.get);
        return visited.assert(strictEqualTo(Conc(3, 2, 1)));
      }),
    );
  });

  suite("foreach", () => {
    test.io("returns results", IO.foreach([1, 2, 3], (n) => IO.succeed(n + 1)).assertIO(strictEqualTo(Conc(2, 3, 4))));

    test.io(
      "returns results with async nodes",
      IO.foreach([1, 2, 3], (n) => IO.async<never, never, number>((cb) => cb(IO.succeed(n + 1)))).assertIO(
        strictEqualTo(Conc(2, 3, 4)),
      ),
    );

    test.io(
      "evaluates effects and returns results in order",
      Do((Δ) => {
        const ref    = Δ(Ref.make(Conc.empty<number>()));
        const values = Δ(IO.foreach([1, 2, 3], (n) => ref.update((ns) => ns.append(n)).as(n + 1)));
        const seen   = Δ(ref.get);
        return values.assert(strictEqualTo(Conc(2, 3, 4))) && seen.assert(strictEqualTo(Conc(1, 2, 3)));
      }),
    );

    test.io(
      "fails if one effect fails",
      IO.foreach([1, 2, 3], (n) => (n === 2 ? IO.fail("error") : IO.succeed(n))).result.assertIO(
        fails(strictEqualTo("error")),
      ),
    );
  });

  suite("foreachConcurrent", () => {
    it.io(
      "returns results in the same order",
      Do((Δ) => {
        const list = List("1", "2", "3");
        const res  = Δ(IO.foreachConcurrent(list, (x) => IO.succeed(parseInt(x))));
        return res.assert(strictEqualTo(Conc(1, 2, 3)));
      }),
    );

    it.io(
      "runs effects in parallel",
      Do((Δ) => {
        const f     = Δ(Future.make<never, void>());
        const fiber = Δ(IO.allConcurrent([IO.never, f.succeed(undefined)]).fork);
        Δ(f.await);
        Δ(fiber.interrupt);
        return true;
      }).assertIO(isTrue),
    );

    it.io("propagates error", () => {
      const ints = List(1, 2, 3, 4, 5, 6);
      const odds = IO.foreachConcurrent(ints, (n) => (n % 2 !== 0 ? IO.succeed(n) : IO.fail("not odd")));
      return odds.swap.assertIO(strictEqualTo("not odd"));
    });

    it.io(
      "interrupts effects on the first failure",
      Do((Δ) => {
        const ref     = Δ(Ref.make(false));
        const future  = Δ(Future.make<never, void>());
        const actions = List<IO<never, string, void>>(
          IO.never,
          IO.succeed(1),
          IO.fail("C"),
          future.await > ref.set(true),
        );
        const e = Δ(IO.allConcurrent(actions).swap);
        const v = Δ(ref.get);
        return e.assert(strictEqualTo("C")) && v.assert(isFalse);
      }),
    );

    it.io(
      "does not kill fiber when forked on the parent scope",
      Do((Δ) => {
        const ref    = Δ(Ref.make(0));
        const fibers = Δ(IO.foreachConcurrent(Iterable.range(1, 100), () => ref.update((n) => n + 1).fork));
        Δ(IO.foreach(fibers, (f) => f.await));
        const value = Δ(ref.get);
        return value.assert(strictEqualTo(100));
      }),
    );

    for (const size of [0, 1, 2, 100]) {
      test.io(`runs ${size} tasks`, () => {
        const values = Array.from({ length: size }, (_, n) => n);
        return IO.foreachConcurrent(values, (n) => IO.succeed(n)).assertIO(strictEqualTo(Conc.from(values)));
      });
    }

    test.io(
      "runs a task that fails",
      IO.foreachConcurrent([1], () => IO.fail("error")).result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "runs two failed tasks",
      IO.foreachConcurrent([1, 2], () => IO.fail("error"))
        .sandbox.swap.map((c) => c.failures)
        .assertIO(strictEqualTo(List("error", "error"))),
    );

    test.io(
      "runs a task that dies",
      IO.foreachConcurrent([1, 2], (n) => (n === 1 ? IO.halt("defect") : IO.unit)).result.assertIO(
        halts(strictEqualTo("defect")),
      ),
    );

    test.io(
      "runs a task that is interrupted",
      IO.foreachConcurrent([1], () => IO.interrupt).result.assertIO(isInterrupted),
    );

    test.io(
      "captures unsuspended exceptions",
      IO.foreachConcurrent([1, 2], (): UIO<never> => {
        throw "defect";
      }).result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "returns Conc results in input order",
      IO.foreachConcurrent(Conc(1, 2, 3), (n) => IO.yieldNow.as(n)).assertIO(strictEqualTo(Conc(1, 2, 3))),
    );

    test.io(
      "runs Conc effects in parallel",
      Do((Δ) => {
        const ready  = Δ(Future.make<never, void>());
        const values = Δ(
          IO.foreachConcurrent(Conc(1, 2), (n) => (n === 1 ? ready.await.as(1) : ready.succeed(undefined).as(2))),
        );
        return values.assert(strictEqualTo(Conc(1, 2)));
      }),
    );

    suite("withConcurrency", () => {
      for (const limit of [1, 2, 4]) {
        test.io(
          `runs at most ${limit} effects simultaneously`,
          Do((Δ) => {
            const active = Δ(Ref.make(0));
            const peak   = Δ(Ref.make(0));
            const ready  = Δ(Future.make<never, void>());
            const gate   = Δ(Future.make<never, void>());
            const fiber  = Δ(
              IO.foreachConcurrent(Iterable.range(1, 12), (value) =>
                active
                  .updateAndGet((n) => n + 1)
                  .flatMap(
                    (n) =>
                      peak.update((max) => Math.max(max, n)) >
                      ready.succeed(undefined).when(n === limit) >
                      gate.await.as(value),
                  )
                  .ensuring(active.update((n) => n - 1)),
              ).withConcurrency(limit).fork,
            );
            Δ(ready.await);
            Δ(gate.succeed(undefined));
            const values    = Δ(fiber.join);
            const maximum   = Δ(peak.get);
            const remaining = Δ(active.get);
            return (
              values.length.assert(strictEqualTo(12)) &&
              maximum.assert(strictEqualTo(limit)) &&
              remaining.assert(strictEqualTo(0))
            );
          }),
        );
      }

      test.io(
        "returns results in appropriate order",
        IO.foreachConcurrent([1, 2, 3, 4], (n) => IO.yieldNow.as(n))
          .withConcurrency(2)
          .assertIO(strictEqualTo(Conc(1, 2, 3, 4))),
      );

      test.io(
        "works on large lists",
        IO.foreachConcurrent(Iterable.range(1, 10000), IO.succeedNow)
          .withConcurrency(4)
          .map((ns) => ns.length)
          .assertIO(strictEqualTo(10000)),
      );

      test.io(
        "runs effects in parallel",
        Do((Δ) => {
          const ready  = Δ(Future.make<never, void>());
          const values = Δ(
            IO.foreachConcurrent([1, 2], (n) =>
              n === 1 ? ready.await.as(1) : ready.succeed(undefined).as(2),
            ).withConcurrency(2),
          );
          return values.assert(strictEqualTo(Conc(1, 2)));
        }),
      );

      test.io(
        "propagates error",
        IO.foreachConcurrent([1, 2, 3], () => IO.fail("error"))
          .withConcurrency(2)
          .result.assertIO(fails(strictEqualTo("error"))),
      );

      test.io(
        "interrupts effects on first failure",
        Do((Δ) => {
          const started = Δ(Future.make<never, void>());
          const stopped = Δ(Ref.make(false));
          const exit    = Δ(
            IO.foreachConcurrent([1, 2], (n) =>
              n === 1
                ? (started.succeed(undefined) > IO.never).ensuring(stopped.set(true))
                : started.await > IO.fail("error"),
            ).withConcurrency(2).result,
          );
          const interrupted = Δ(stopped.get);
          return exit.assert(fails(strictEqualTo("error"))) && interrupted.assert(isTrue);
        }),
      );
    });
  });

  suite("foreachConcurrentDiscard", () => {
    test.io(
      "accumulates failures",
      IO.foreachConcurrentDiscard([1, 2], () => IO.fail("error"))
        .sandbox.swap.map((c) => c.failures)
        .assertIO(strictEqualTo(List("error", "error"))),
    );

    for (const values of [[1, 2, 3], Conc(1, 2, 3)]) {
      test.io(
        `runs all effects for ${Array.isArray(values) ? "Array" : "Conc"}`,
        Do((Δ) => {
          const ref = Δ(Ref.make(0));
          Δ(IO.foreachConcurrentDiscard(values, () => ref.update((n) => n + 1)));
          const count = Δ(ref.get);
          return count.assert(strictEqualTo(3));
        }),
      );
    }

    test.io("completes on empty input", IO.foreachConcurrentDiscard([], () => IO.halt("unexpected")).assertIO(isUnit));

    suite("withConcurrency", () => {
      test.io(
        "discard runs all effects",
        Do((Δ) => {
          const ref = Δ(Ref.make(0));
          Δ(IO.foreachConcurrentDiscard([1, 2, 3, 4], () => ref.update((n) => n + 1)).withConcurrency(2));
          const count = Δ(ref.get);
          return count.assert(strictEqualTo(4));
        }),
      );

      test.io(
        "discard preserves failures",
        IO.foreachConcurrentDiscard([1, 2, 3], () => IO.fail("error"))
          .withConcurrency(2)
          .result.assertIO(fails(strictEqualTo("error"))),
      );
    });
  });

  suite("foreachDiscard", () => {
    test.io(
      "runs effects in order and can be run twice",
      Do((Δ) => {
        const ref    = Δ(Ref.make(Conc.empty<number>()));
        const effect = IO.foreachDiscard([1, 2, 3], (n) => ref.update((ns) => ns.append(n)));
        Δ(effect);
        Δ(effect);
        const visited = Δ(ref.get);
        return visited.assert(strictEqualTo(Conc(1, 2, 3, 1, 2, 3)));
      }),
    );

    test.io("empty input", IO.foreachDiscard([], () => IO.halt("unexpected")).assertIO(isUnit));
  });

  suite("forever", () => {
    it.io("sync forever is interruptible", () =>
      IO.succeed(1)
        .forever.fork.flatMap((f) => f.interrupt)
        .as(true)
        .assertIO(strictEqualTo(true)),
    );
  });

  suite("fork", () => {
    it.io(
      "shallow fork/join identity",
      Do((Δ) => {
        const f = Δ(IO.succeed(42).fork);
        const r = Δ(f.join);
        return r.assert(strictEqualTo(42));
      }),
    );

    it.io("deep fork/join identity", () => {
      const n = 20n;
      return concurrentFib(n).assertIO(strictEqualTo(fib(n)));
    });

    test.io("fork propagates interruption", IO.interrupt.fork.flatMap((f) => f.join).result.assertIO(isInterrupted));

    test.io(
      "fork preserves interruption and defect",
      IO.interrupt
        .ensuring(IO.halt("defect"))
        .fork.flatMap((f) => f.join)
        .result.assertIO(isInterrupted && halts(strictEqualTo("defect"))),
    );

    test.io(
      "interruption status is heritable",
      Do((Δ) => {
        const fiber  = Δ(IO.checkInterruptible((status) => IO.succeed(status.isInterruptible)).fork.uninterruptible);
        const status = Δ(fiber.join);
        return status.assert(isFalse);
      }),
    );

    test.io(
      "child can be created on interrupted parent in uninterruptible region",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const gate  = Δ(Future.make<never, void>());
        const ran   = Δ(Ref.make(false));
        const fiber = Δ(
          (ready.succeed(undefined) > gate.await > ran.set(true).fork.flatMap((child) => child.join)).uninterruptible
            .fork,
        );
        Δ(ready.await);
        Δ(fiber.interruptFork);
        Δ(gate.succeed(undefined));
        Δ(fiber.await);
        const value = Δ(ran.get);
        return value.assert(isTrue);
      }),
    );

    test.io(
      "interruption is not inherited on fork",
      Do((Δ) => {
        const fiber = Δ(IO.interrupt.catchAllCause(() => IO.succeed(42).fork.flatMap((child) => child.join)).fork);
        const value = Δ(fiber.join);
        return value.assert(strictEqualTo(42));
      }),
    );

    test.io(
      "child interrupted cause cannot be seen from parent",
      Do((Δ) => {
        const parent = Δ(IO.fiberId);
        const before = Δ(FiberRef.interruptedCause.get);
        const fiber  = Δ(FiberRef.interruptedCause.set(Cause.interrupt(parent)).fork);
        Δ(fiber.join);
        const after = Δ(FiberRef.interruptedCause.get);
        return after.assert(strictEqualTo(before));
      }),
    );
  });

  suite("forkAll", () => {
    test.io(
      "returns results in order",
      IO.forkAll([IO.yieldNow.as(1), IO.succeed(2), IO.succeed(3)])
        .flatMap((f) => f.join)
        .assertIO(strictEqualTo(Conc(1, 2, 3))),
    );

    test.io(
      "empty input",
      IO.forkAll<never, never, number>([])
        .flatMap((f) => f.join)
        .assertIO(isEmpty),
    );

    test.io(
      "propagates failures",
      IO.forkAll([IO.succeed(1), IO.fail("error")])
        .flatMap((f) => f.join)
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "propagates defects",
      IO.forkAll([IO.succeed(1), IO.halt("defect")])
        .flatMap((f) => f.join)
        .result.assertIO(halts(strictEqualTo("defect"))),
    );
  });

  suite("forkDaemon", () => {
    it.io("daemon fiber is unsupervised", () => {
      const child = (ref: Ref<boolean>) => withLatch((release) => (release > IO.never).ensuring(ref.set(true)));
      return Do((Δ) => {
        const ref    = Δ(Ref.make(false));
        const fiber  = Δ(child(ref).forkDaemon.fork);
        const inner  = Δ(fiber.join);
        const b      = Δ(ref.get);
        const result = b.assert(isFalse);
        Δ(inner.interrupt);
        return result;
      });
    });
  });

  suite("fromEither", () => {
    test.io("lifts Right", IO.fromEither(Either.right(1)).assertIO(strictEqualTo(1)));

    test.io("lifts Left", IO.fromEither(Either.left("error")).result.assertIO(fails(strictEqualTo("error"))));

    test.io("left constructor", IO.left(1).assertIO(isLeft(strictEqualTo(1))));

    test.io(
      "fromEither produces a trace on failure",
      IO.fromEither(Either.left("error"))
        .sandbox.swap.map((cause) => cause.isTraced)
        .assertIO(isTrue),
    );
  });

  suite("fromExit", () => {
    test.io("lifts success", IO.fromExit(Exit.succeed(1)).assertIO(strictEqualTo(1)));

    test.io(
      "lifts failure cause",
      IO.fromExit(Exit.failCause(Cause.halt("defect"))).result.assertIO(halts(strictEqualTo("defect"))),
    );
  });

  suite("fromMaybe", () => {
    test.io("lifts Just", IO.fromMaybe(Just(1)).assertIO(strictEqualTo(1)));

    test.io("lifts Nothing", IO.fromMaybe(Nothing()).result.assertIO(fails(isNothing)));

    test.io("just constructor", IO.succeed(1).asJust.assertIO(isJust(strictEqualTo(1))));

    test.io("nothing constructor", IO.nothing.assertIO(isNothing));
  });

  suite("fromPromise", () => {
    test.io("promise happy path", IO.fromPromise(Promise.resolve(42)).assertIO(strictEqualTo(42)));

    test.io("promise supplier happy path", IO.fromPromise(() => Promise.resolve(42)).assertIO(strictEqualTo(42)));

    test.io(
      "promise rejection",
      IO.fromPromise(Promise.reject("error")).result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "supplier exception does not kill fiber",
      IO.fromPromise(() => {
        throw "error";
      }).result.assertIO(halts(strictEqualTo("error"))),
    );
  });

  suite("get", () => {
    test.io("extracts Just", IO.succeed(Just(1)).get.assertIO(strictEqualTo(1)));

    test.io("fails on Nothing", IO.succeed(Nothing()).get.result.assertIO(fails(isNothing)));

    test.io(
      "wraps existing error in Just",
      IO.fail("error").get.result.assertIO(fails(isJust(strictEqualTo("error")))),
    );
  });

  suite("getOrElse", () => {
    test.io("extracts Just", IO.succeed(Just(1)).getOrElse(2).assertIO(strictEqualTo(1)));

    test.io("falls back on Nothing", IO.succeed(Nothing()).getOrElse(2).assertIO(strictEqualTo(2)));

    test.io(
      "does not change failed state",
      IO.fail("error")
        .getOrElse(2)
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "does not evaluate unused default",
      IO.succeed(Just(1))
        .getOrElse(() => {
          throw "unexpected";
        })
        .assertIO(strictEqualTo(1)),
    );
  });

  suite("getOrElseIO", () => {
    test.io(
      "extracts Just without running fallback",
      IO.succeed(Just(1)).getOrElseIO(IO.halt("unexpected")).assertIO(strictEqualTo(1)),
    );

    test.io("falls back on Nothing", IO.succeed(Nothing()).getOrElseIO(IO.succeed(2)).assertIO(strictEqualTo(2)));

    test.io(
      "does not change failed state",
      IO.fail("error")
        .getOrElseIO(IO.succeed(2))
        .result.assertIO(fails(strictEqualTo("error"))),
    );
  });

  suite("getOrFailWith", () => {
    test.io("extracts optional value", IO.getOrFailWith(Just(1), "missing").assertIO(strictEqualTo(1)));

    test.io(
      "fails on Nothing",
      IO.getOrFailWith(Nothing(), "missing").result.assertIO(fails(strictEqualTo("missing"))),
    );
  });

  suite("heap", () => {
    test.io(
      "unit.forever is safe",
      Do((Δ) => {
        const fiber = Δ(IO.unit.forever.fork);
        Δ(Live.live(IO.sleep((5).seconds)));
        Δ(fiber.interrupt);
        return true.assert(completes);
      }),
      { timeout: 6_000 },
    );
  });

  suite("ifIO", () => {
    test.io("runs onTrue only", IO.succeed(true).ifIO(IO.halt("unexpected"), IO.succeed(1)).assertIO(strictEqualTo(1)));

    test.io(
      "runs onFalse only",
      IO.succeed(false).ifIO(IO.succeed(2), IO.halt("unexpected")).assertIO(strictEqualTo(2)),
    );

    test.io(
      "preserves condition failure",
      IO.fail("error")
        .ifIO(IO.halt("unexpected"), IO.halt("unexpected"))
        .result.assertIO(fails(strictEqualTo("error"))),
    );
  });

  suite("ignore", () => {
    test.io("returns success as unit", IO.succeed(1).ignore.assertIO(isUnit));

    test.io("returns failure as unit", IO.fail("error").ignore.assertIO(isUnit));

    test.io("does not catch defects", IO.halt("defect").ignore.result.assertIO(halts(strictEqualTo("defect"))));
  });

  suite("isFailure", () => {
    test.io("true for failure", isFailure(IO.fail("error")).assertIO(isTrue));

    test.io("false for success", isFailure(IO.succeed(1)).assertIO(isFalse));
  });

  suite("isSuccess", () => {
    test.io("false for failure", isSuccess(IO.fail("error")).assertIO(isFalse));

    test.io("true for success", isSuccess(IO.succeed(1)).assertIO(isTrue));
  });

  suite("iterate", () => {
    test.io(
      "iterates with specified effectful function",
      IO.iterate(
        0,
        (n) => n < 10,
        (n) => IO.succeed(n + 1),
      ).assertIO(strictEqualTo(10)),
    );

    test.io(
      "does not run body when initial condition is false",
      IO.iterate(
        0,
        () => false,
        () => IO.halt("unexpected"),
      ).assertIO(strictEqualTo(0)),
    );
  });

  suite("loop", () => {
    test.io(
      "collects results in order",
      IO.loop(
        0,
        (n) => n < 5,
        (n) => n + 1,
        (n) => IO.succeed(n * 2),
      ).assertIO(strictEqualTo(Conc(0, 2, 4, 6, 8))),
    );

    test.io(
      "loops with specified effectful function",
      Do((Δ) => {
        const ref = Δ(Ref.make(0));
        Δ(
          IO.loop(
            0,
            (n) => n < 5,
            (n) => n + 1,
            (n) => ref.update((sum) => sum + n),
          ),
        );
        const sum = Δ(ref.get);
        return sum.assert(strictEqualTo(10));
      }),
    );
  });

  suite("loopUnit", () => {
    test.io(
      "loops with specified effectful function",
      Do((Δ) => {
        const ref = Δ(Ref.make(0));
        Δ(
          IO.loopUnit(
            0,
            (n) => n < 5,
            (n) => n + 1,
            (n) => ref.update((sum) => sum + n),
          ),
        );
        const sum = Δ(ref.get);
        return sum.assert(strictEqualTo(10));
      }),
    );
  });

  suite("mapError", () => {
    test.io("preserves defects in a composite cause", () => {
      const cause = Cause.sequential(Cause.fail(1), Cause.halt("defect"));
      return IO.failCause(cause)
        .mapError((n) => n + 1)
        .sandbox.swap.map((c) => c.untraced)
        .assertIO(strictEqualTo(Cause.sequential(Cause.fail(2), Cause.halt("defect"))));
    });
  });

  suite("mapTryCatch", () => {
    test.io(
      "maps success",
      IO.succeed(1)
        .mapTryCatch((n) => n + 1, Function.identity)
        .assertIO(strictEqualTo(2)),
    );

    test.io(
      "translates thrown exceptions into typed failures",
      IO.succeed(1)
        .mapTryCatch(() => {
          throw "error";
        }, Function.identity)
        .result.assertIO(fails(strictEqualTo("error"))),
    );
  });

  suite("maybe", () => {
    test.io("returns success in Just", IO.succeed(1).maybe.assertIO(isJust(strictEqualTo(1))));

    test.io("returns failure as Nothing", IO.fail("error").maybe.assertIO(isNothing));

    test.io("does not catch defects", IO.halt("defect").maybe.result.assertIO(halts(strictEqualTo("defect"))));

    test.io("catches defects after sandboxing", IO.halt("defect").sandbox.maybe.assertIO(isNothing));
  });

  suite("memoize", () => {
    test.io(
      "non memoized returns new instances",
      Do((Δ) => {
        const effect = IO.succeed({});
        const first  = Δ(effect);
        const second = Δ(effect);
        return first.assert(strictEqualTo(second).invert);
      }),
    );

    test.io(
      "memoized returns same instance",
      Do((Δ) => {
        const effect = Δ(IO.succeed({}).memoize);
        const first  = Δ(effect);
        const second = Δ(effect);
        return first.assert(strictEqualTo(second));
      }),
    );

    test.io(
      "memoizes failures",
      Do((Δ) => {
        const ref    = Δ(Ref.make(0));
        const effect = Δ((ref.update((n) => n + 1) > IO.fail("error")).memoize);
        const first  = Δ(effect.result);
        const second = Δ(effect.result);
        const count  = Δ(ref.get);
        return (
          first.assert(fails(strictEqualTo("error"))) &&
          second.assert(fails(strictEqualTo("error"))) &&
          count.assert(strictEqualTo(1))
        );
      }),
    );

    test.io(
      "shares computation between concurrent callers",
      Do((Δ) => {
        const ref    = Δ(Ref.make(0));
        const effect = Δ(ref.updateAndGet((n) => n + 1).memoize);
        const values = Δ(IO.foreachConcurrent([1, 2, 3], () => effect));
        const count  = Δ(ref.get);
        return values.assert(strictEqualTo(Conc(1, 1, 1))) && count.assert(strictEqualTo(1));
      }),
    );
  });

  suite("merge", () => {
    test.io("on success", IO.succeed(1).merge.assertIO(strictEqualTo(1)));

    test.io("on swapped result", IO.succeed(1).swap.merge.assertIO(strictEqualTo(1)));
  });

  suite("mergeAll", () => {
    it.io("mergeAll", () => {
      const io = IO.mergeAll(List("a", "aa", "aaa", "aaaa").map(IO.succeedNow), 0, (b, a) => b + a.length);
      return io.assertIO(strictEqualTo(10));
    });

    test.io(
      "returns zero on empty input",
      IO.mergeAll<never, never, number, number>([], 0, (a, b: number) => a + b).assertIO(strictEqualTo(0)),
    );

    test.io(
      "merges using function",
      IO.mergeAll([IO.succeed(1), IO.succeed(2), IO.succeed(3)], 0, (a, b) => a + b).assertIO(strictEqualTo(6)),
    );

    test.io(
      "returns error if present",
      IO.mergeAll([IO.succeed(1), IO.fail("error")], 0, (a, b) => a + b).result.assertIO(fails(strictEqualTo("error"))),
    );
  });

  suite("never", () => {
    it.io("interrupt of never is interrupted with cause", () =>
      IO.never.fork.flatMap((f) => f.interrupt).assertIO(isOnlyInterrupted),
    );
  });

  suite("once", () => {
    test.io(
      "executes effect only once",
      Do((Δ) => {
        const ref    = Δ(Ref.make(0));
        const effect = Δ(ref.update((n) => n + 1).once);
        Δ(IO.foreachConcurrent([1, 2, 3], () => effect));
        const count = Δ(ref.get);
        return count.assert(strictEqualTo(1));
      }),
    );
  });

  suite("onExit", () => {
    test.io(
      "cleanup runs on success",
      Do((Δ) => {
        const ref   = Δ(Ref.make<Exit<string, number>>(Exit.succeed(0)));
        const value = Δ(IO.succeed(42).onExit((exit) => ref.set(exit)));
        const exit  = Δ(ref.get);
        return value.assert(strictEqualTo(42)) && exit.assert(strictEqualTo(Exit.succeed(42)));
      }),
    );

    test.io(
      "cleanup runs on failure",
      Do((Δ) => {
        const ref  = Δ(Ref.make<Exit<string, number>>(Exit.succeed(0)));
        const exit = Δ(IO.fail("error").onExit((exit) => ref.set(exit)).result);
        const seen = Δ(ref.get);
        return exit.assert(fails(strictEqualTo("error"))) && seen.assert(fails(strictEqualTo("error")));
      }),
    );

    test.io(
      "cleanup runs on interruption",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const ref   = Δ(Ref.make(false));
        const fiber = Δ((ready.succeed(undefined) > IO.never).onExit((exit) => ref.set(exit.isFailure())).fork);
        Δ(ready.await);
        Δ(fiber.interrupt);
        const ran = Δ(ref.get);
        return ran.assert(isTrue);
      }),
    );

    test.io(
      "finalizer can detect interruption",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const ref   = Δ(Ref.make(false));
        const fiber = Δ(
          (ready.succeed(undefined) > IO.never).onExit((exit) =>
            ref.set(
              exit.match(
                (cause) => cause.isInterrupted,
                () => false,
              ),
            ),
          ).fork,
        );
        Δ(ready.await);
        Δ(fiber.interrupt);
        const interrupted = Δ(ref.get);
        return interrupted.assert(isTrue);
      }),
    );
  });

  suite("or", () => {
    for (const left of [true, false]) {
      for (const right of [true, false]) {
        test.io(
          `${left} or ${right}`,
          IO.succeed(left)
            .or(IO.succeed(right))
            .assertIO(strictEqualTo(left || right)),
        );
      }
    }

    test.io("short circuits", IO.succeed(true).or(IO.halt("not evaluated")).assertIO(isTrue));
  });

  suite("orElse", () => {
    test.io(
      "does not recover from defects",
      IO.halt("defect")
        .orElse(IO.succeed(1))
        .result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "left failed and right died",
      IO.fail("left")
        .orElse(IO.halt("right"))
        .result.assertIO(halts(strictEqualTo("right"))),
    );

    test.io(
      "left failed and right failed",
      IO.fail("left")
        .orElse(IO.fail("right"))
        .result.assertIO(fails(strictEqualTo("right"))),
    );

    test.io("is associative", () => {
      const a = IO.fail("a");
      const b = IO.fail("b");
      const c = IO.succeed(3);
      return a
        .orElse(b)
        .orElse(c)
        .zip(a.orElse(b.orElse(c)))
        .assertIO(deepEqualTo([3, 3]));
    });
  });

  suite("orElseFail", () => {
    test.io("keeps successful value", IO.succeed(1).orElseFail("replacement").assertIO(strictEqualTo(1)));

    test.io(
      "replaces error",
      IO.fail("error")
        .orElseFail("replacement")
        .result.assertIO(fails(strictEqualTo("replacement"))),
    );
  });

  suite("orElseMaybe", () => {
    test.io("keeps successful value", IO.succeed(1).orElseMaybe(IO.succeed(2)).assertIO(strictEqualTo(1)));

    test.io(
      "keeps Just error",
      IO.fail(Just("error"))
        .orElseMaybe(IO.succeed(2))
        .result.assertIO(fails(isJust(strictEqualTo("error")))),
    );

    test.io("recovers from Nothing error", IO.fail(Nothing()).orElseMaybe(IO.succeed(2)).assertIO(strictEqualTo(2)));
  });

  suite("orElseSucceed", () => {
    test.io("keeps successful value", IO.succeed(1).orElseSucceed(2).assertIO(strictEqualTo(1)));

    test.io("replaces failure", IO.fail("error").orElseSucceed(2).assertIO(strictEqualTo(2)));
  });

  suite("orHaltKeep", () => {
    test.io("orHaltKeep preserves cause structure", () => {
      const cause = Cause.parallel(Cause.fail("error"), Cause.halt("defect"));
      return IO.failCause(cause)
        .orHaltKeep.sandbox.swap.map((c) => c.untraced)
        .assertIO(strictEqualTo(Cause.parallel(Cause.halt("error"), Cause.halt("defect"))));
    });
  });

  suite("partition", () => {
    test.io(
      "collects only successes",
      IO.partition([1, 2, 3], IO.succeedNow).assertIO(deepEqualTo([Conc.empty(), Conc(1, 2, 3)])),
    );

    test.io(
      "collects only failures",
      IO.partition([1, 2, 3], IO.failNow).assertIO(deepEqualTo([Conc(1, 2, 3), Conc.empty()])),
    );

    test.io(
      "collects failures and successes",
      IO.partition([1, 2, 3, 4], (n) => (n % 2 === 0 ? IO.succeed(n) : IO.fail(n))).assertIO(
        deepEqualTo([Conc(1, 3), Conc(2, 4)]),
      ),
    );

    test.io(
      "evaluates effects in order",
      Do((Δ) => {
        const ref = Δ(Ref.make(Conc.empty<number>()));
        Δ(IO.partition([1, 2, 3], (n) => ref.update((ns) => ns.append(n)) > IO.fail(n)));
        const visited = Δ(ref.get);
        return visited.assert(strictEqualTo(Conc(1, 2, 3)));
      }),
    );

    test.io(
      "propagates defects",
      IO.partition([1, 2], () => IO.halt("defect")).result.assertIO(halts(strictEqualTo("defect"))),
    );
  });

  suite("race", () => {
    it.io(
      "race in daemon is executed",
      Do((Δ) => {
        const latch1 = Δ(Future.make<never, void>());
        const latch2 = Δ(Future.make<never, void>());
        const f1     = Δ(Future.make<never, void>());
        const f2     = Δ(Future.make<never, void>());
        const loser1 = IO.bracket(
          latch1.succeed(undefined),
          () => IO.never,
          () => f1.succeed(undefined),
        );
        const loser2 = IO.bracket(
          latch2.succeed(undefined),
          () => IO.never,
          () => f2.succeed(undefined),
        );
        const fiber = Δ(loser1.race(loser2).forkDaemon);
        Δ(latch1.await);
        Δ(latch2.await);
        Δ(fiber.interrupt);
        const res1 = Δ(f1.await);
        const res2 = Δ(f1.await);
        return res1.assert(isUnit) && res2.assert(isUnit);
      }),
    );

    it.io("race of fail with success", () => {
      const io = IO.fail(42).race(IO.succeed(24)).either;
      return io.assertIO(isRight(strictEqualTo(24)));
    });

    it.io("race of terminate with success", () => {
      const io = IO.halt(new Error()).race(IO.succeed(24));
      return io.assertIO(strictEqualTo(24));
    });

    it.io("race of fail with fail", () => {
      const io = IO.fail(42).race(IO.fail(42)).either;
      return io.assertIO(isLeft(strictEqualTo(42)));
    });

    it.io("race of value and never", () => {
      const io = IO.succeed(42).race(IO.never);
      return io.assertIO(strictEqualTo(42));
    });

    it.io("race in uninterruptible region", () => {
      const effect = IO.unit.race(IO.never).uninterruptible;
      return effect.assertIO(isUnit);
    });

    it.io(
      "race of two forks does not interrupt winner",
      Do((Δ) => {
        const ref    = Δ(Ref.make(0));
        const fibers = Δ(Ref.make(HashSet.empty<Fiber<any, any>>()));
        const latch  = Δ(Future.make<never, void>());
        const effect = IO.uninterruptibleMask((restore) =>
          restore(latch.await.onInterrupt(() => ref.update((n) => n + 1))).fork.tap((f) =>
            fibers.update((set) => set.add(f)),
          ),
        );
        const awaitAll = fibers.get.flatMap(Fiber.awaitAll);
        Δ(effect.race(effect));
        const value = Δ(latch.succeed() > awaitAll > ref.get);
        return value.assert(isLessThanOrEqualTo(1));
      }),
    );

    test.io("returns success after failure", IO.fail("error").race(IO.succeed(42)).assertIO(strictEqualTo(42)));

    test.io(
      "preserves both failures",
      IO.fail("left")
        .race(IO.fail("right"))
        .sandbox.swap.map((c) => c.failures)
        .assertIO(strictEqualTo(List("left", "right"))),
    );

    test.io(
      "always calls finalizers",
      Do((Δ) => {
        const ready     = Δ(Future.make<never, void>());
        const finalized = Δ(Future.make<never, void>());
        const value     = Δ(
          (ready.succeed(undefined) > IO.never).ensuring(finalized.succeed(undefined)).race(ready.await.as(42)),
        );
        Δ(finalized.await);
        return value.assert(strictEqualTo(42));
      }),
    );

    test.io(
      "interruption of raced effect finalizes both sides",
      Do((Δ) => {
        const left      = Δ(Future.make<never, void>());
        const right     = Δ(Future.make<never, void>());
        const leftDone  = Δ(Future.make<never, void>());
        const rightDone = Δ(Future.make<never, void>());
        const fiber     = Δ(
          (left.succeed(undefined) > IO.never)
            .ensuring(leftDone.succeed(undefined))
            .race((right.succeed(undefined) > IO.never).ensuring(rightDone.succeed(undefined))).fork,
        );
        Δ(left.await);
        Δ(right.await);
        const exit = Δ(fiber.interrupt);
        Δ(leftDone.await);
        Δ(rightDone.await);
        return exit.assert(isInterrupted);
      }),
    );
  });

  suite("raceFirst", () => {
    it.io(
      "raceFirst interrupts loser on success",
      Do((Δ) => {
        const s      = Δ(Future.make<never, void>());
        const effect = Δ(Future.make<never, number>());
        const winner = s.await.asUnit;
        const loser  = IO.bracket(
          s.succeed(undefined),
          () => IO.never,
          () => effect.succeed(42),
        );
        Δ(winner.raceFirst(loser));
        const b = Δ(effect.await);
        return b.assert(strictEqualTo(42));
      }),
    );

    it.io(
      "raceFirst interrupts loser on failure",
      Do((Δ) => {
        const s      = Δ(Future.make<never, void>());
        const effect = Δ(Future.make<never, number>());
        const winner = s.await > IO.fail(new Error());
        const loser  = IO.bracket(
          s.succeed(undefined),
          () => IO.never,
          () => effect.succeed(42),
        );
        Δ(winner.raceFirst(loser).result);
        const b = Δ(effect.await);
        return b.assert(strictEqualTo(42));
      }),
    );

    for (const failure of [false, true]) {
      test.io(
        `raceFirst calls finalizers on ${failure ? "failure" : "success"}`,
        Do((Δ) => {
          const ready     = Δ(Future.make<never, void>());
          const finalized = Δ(Future.make<never, void>());
          const winner    = ready.await > (failure ? IO.fail("error") : IO.succeed(42));
          const exit      = Δ(
            (ready.succeed(undefined) > IO.never).ensuring(finalized.succeed(undefined)).raceFirst(winner).result,
          );
          Δ(finalized.await);
          return failure ? exit.assert(fails(strictEqualTo("error"))) : exit.assert(strictEqualTo(Exit.succeed(42)));
        }),
      );
    }
  });

  suite("refineOrHalt", () => {
    test.io(
      "retains matching typed errors",
      IO.fail("error")
        .refineOrHalt((e) => Just(e))
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "turns unmatched errors into defects",
      IO.fail("error")
        .refineOrHalt(() => Nothing())
        .result.assertIO(halts(strictEqualTo("error"))),
    );

    test.io(
      "preserves existing defects",
      IO.halt("defect")
        .refineOrHalt(() => Nothing())
        .result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "refineOrHalt preserves original trace",
      Do((Δ) => {
        const original     = Δ(IO.fail("error").sandbox.swap);
        const refined      = Δ(IO.failCause(original).refineOrHalt((e) => Just(e)).sandbox.swap);
        const firstFrame   = original.failureTraceMaybe.flatMap(([, trace]) => trace.stackTrace.head);
        const refinedFrame = refined.failureTraceMaybe.flatMap(([, trace]) => trace.stackTrace.head);
        return firstFrame.assert(isJust(completes)) && refinedFrame.assert(deepEqualTo(firstFrame));
      }),
    );

    test.io("refineOrHalt preserves cause structure", () => {
      const cause = Cause.parallel(Cause.fail("error"), Cause.halt("defect"));
      return IO.failCause(cause)
        .refineOrHalt((e) => Just(e))
        .sandbox.swap.map((c) => c.untraced)
        .assertIO(strictEqualTo(cause));
    });
  });

  suite("reject", () => {
    test.io(
      "returns failure ignoring value",
      IO.succeed(1)
        .reject(() => Just("rejected"))
        .result.assertIO(fails(strictEqualTo("rejected"))),
    );

    test.io(
      "keeps unmatched value",
      IO.succeed(1)
        .reject(() => Nothing())
        .assertIO(strictEqualTo(1)),
    );
  });

  suite("rejectIO", () => {
    test.io(
      "returns failure ignoring value",
      IO.succeed(1)
        .rejectIO(() => Just(IO.fail("rejected")))
        .result.assertIO(fails(strictEqualTo("rejected"))),
    );

    test.io(
      "keeps unmatched value",
      IO.succeed(1)
        .rejectIO((): Maybe<UIO<string>> => Nothing())
        .assertIO(strictEqualTo(1)),
    );
  });

  for (const mode of ["until", "while", "untilIO", "whileIO"] as const) {
    suite(
      mode === "until"
        ? "repeatUntil"
        : mode === "while"
          ? "repeatWhile"
          : mode === "untilIO"
            ? "repeatUntilIO"
            : "repeatWhileIO",
      () => {
        if (mode === "until") {
          it.io(
            "repeats until condition is true",
            Do((Δ) => {
              const inp = Δ(Ref.make(10));
              const out = Δ(Ref.make(0));
              Δ((inp.updateAndGet((n) => n - 1) < out.update((n) => n + 1)).repeatUntil((n) => n === 0));
              const result = Δ(out.get);

              return result.assert(strictEqualTo(10));
            }),
          );

          it.io(
            "always evaluates the effect at least once",
            Do((Δ) => {
              const ref = Δ(Ref.make(0));
              Δ(ref.update((n) => n + 1).repeatUntil(() => true));
              const result = Δ(ref.get);
              return result.assert(strictEqualTo(1));
            }),
          );
        }
        test.io(
          "repeats until stopping condition",
          Do((Δ) => {
            const ref      = Δ(Ref.make(0));
            const effect   = ref.updateAndGet((n) => n + 1);
            const repeated =
              mode === "until"
                ? effect.repeatUntil((n) => n === 5)
                : mode === "while"
                  ? effect.repeatWhile((n) => n < 5)
                  : mode === "untilIO"
                    ? effect.repeatUntilIO((n) => IO.succeed(n === 5))
                    : effect.repeatWhileIO((n) => IO.succeed(n < 5));
            const value = Δ(repeated);
            const count = Δ(ref.get);
            return value.assert(strictEqualTo(5)) && count.assert(strictEqualTo(5));
          }),
        );

        test.io(
          "always evaluates effect at least once",
          Do((Δ) => {
            const ref    = Δ(Ref.make(0));
            const effect = ref.updateAndGet((n) => n + 1);
            Δ(
              mode === "until"
                ? effect.repeatUntil(() => true)
                : mode === "while"
                  ? effect.repeatWhile(() => false)
                  : mode === "untilIO"
                    ? effect.repeatUntilIO(() => IO.succeed(true))
                    : effect.repeatWhileIO(() => IO.succeed(false)),
            );
            const count = Δ(ref.get);
            return count.assert(strictEqualTo(1));
          }),
        );
      },
    );
    suite(
      mode === "until"
        ? "retryUntil"
        : mode === "while"
          ? "retryWhile"
          : mode === "untilIO"
            ? "retryUntilIO"
            : "retryWhileIO",
      () => {
        test.io(
          "retries until stopping condition",
          Do((Δ) => {
            const ref     = Δ(Ref.make(0));
            const effect  = ref.updateAndGet((n) => n + 1).flatMap(IO.failNow);
            const retried =
              mode === "until"
                ? effect.retryUntil((n) => n === 5)
                : mode === "while"
                  ? effect.retryWhile((n) => n < 5)
                  : mode === "untilIO"
                    ? effect.retryUntilIO((n) => IO.succeed(n === 5))
                    : effect.retryWhileIO((n) => IO.succeed(n < 5));
            const exit  = Δ(retried.result);
            const count = Δ(ref.get);
            return exit.assert(fails(strictEqualTo(5))) && count.assert(strictEqualTo(5));
          }),
        );

        test.io(
          "runs at least once",
          Do((Δ) => {
            const ref    = Δ(Ref.make(0));
            const effect = ref.updateAndGet((n) => n + 1).flatMap(IO.failNow);
            Δ(
              (mode === "until"
                ? effect.retryUntil(() => true)
                : mode === "while"
                  ? effect.retryWhile(() => false)
                  : mode === "untilIO"
                    ? effect.retryUntilIO(() => IO.succeed(true))
                    : effect.retryWhileIO(() => IO.succeed(false))
              ).result,
            );
            const count = Δ(ref.get);
            return count.assert(strictEqualTo(1));
          }),
        );
      },
    );
  }

  suite("replicate", () => {
    for (const n of [0, -1, 3]) {
      test.io(
        `${n} repetitions`,
        IO.sequenceIterable(IO.succeed(1).replicate(n)).assertIO(strictEqualTo(n <= 0 ? Conc.empty() : Conc(1, 1, 1))),
      );
    }
  });

  suite("require", () => {
    test.io("extracts optional value", IO.succeed(Just(1)).require("missing").assertIO(strictEqualTo(1)));

    test.io(
      "fails on Nothing",
      IO.succeed(Nothing())
        .require("missing")
        .result.assertIO(fails(strictEqualTo("missing"))),
    );
  });

  suite("result", () => {
    test.io(
      "run preserves interruption status",
      Do((Δ) => {
        const p = Δ(Future.make<never, void>());
        const f = Δ((p.succeed(undefined) > IO.never).fork);
        Δ(p.await);
        const exit = Δ(f.interrupt);
        return exit.mapErrorCause((cause) => cause.untraced).assert(isInterrupted);
      }),
    );

    test.io(
      "run swallows inner interruption",
      Do((Δ) => {
        const p = Δ(Future.make<never, number>());
        Δ(IO.interrupt.result > p.succeed(42));
        const res = Δ(p.await);
        return res.assert(strictEqualTo(42));
      }),
    );
  });

  suite("resurrect", () => {
    test.io(
      "turns defect into checked failure",
      IO.halt("defect").resurrect.result.assertIO(fails(strictEqualTo("defect"))),
    );
  });

  suite("retry", () => {
    test.io(
      "retries n times",
      Do((Δ) => {
        const ref   = Δ(Ref.make(0));
        const exit  = Δ((ref.update((n) => n + 1) > IO.fail("error")).retry(Schedule.recurs(3)).result);
        const count = Δ(ref.get);
        return exit.assert(fails(strictEqualTo("error"))) && count.assert(strictEqualTo(4));
      }),
    );
  });

  suite("sandbox", () => {
    test.io(
      "sandbox of ordinary failure",
      IO.fail("error")
        .sandbox.swap.map((c) => c.failures)
        .assertIO(strictEqualTo(List("error"))),
    );

    test.io(
      "sandbox of ordinary failure with fork join",
      IO.fail("error")
        .sandbox.fork.flatMap((f) => f.join)
        .swap.map((c) => c.failures)
        .assertIO(strictEqualTo(List("error"))),
    );
  });

  suite("schedule", () => {
    test.io(
      "runs effect for each recurrence",
      Do((Δ) => {
        const ref = Δ(Ref.make(0));
        Δ(ref.update((n) => n + 1).schedule(Schedule.recurs(3)));
        const count = Δ(ref.get);
        return count.assert(strictEqualTo(3));
      }),
    );
  });

  suite("scoped", () => {
    test.io(
      "closing scope is uninterruptible",
      Do((Δ) => {
        const ref = Δ(Ref.make(false));
        Δ((IO.addFinalizer(IO.checkInterruptible((status) => ref.set(status.isInterruptible))) > IO.unit).scoped);
        const interruptible = Δ(ref.get);
        return interruptible.assert(isFalse);
      }),
    );
  });

  suite("sequenceIterable", () => {
    test.io(
      "returns results in order",
      IO.sequenceIterable([IO.succeed(1), IO.succeed(2), IO.succeed(3)]).assertIO(strictEqualTo(Conc(1, 2, 3))),
    );

    test.io("is referentially transparent", () => {
      const effect = IO.sequenceIterable([IO.succeed(1), IO.succeed(2)]);
      return effect.zip(effect).assertIO(deepEqualTo([Conc(1, 2), Conc(1, 2)]));
    });

    test.io(
      "preserves failures",
      IO.sequenceIterable([IO.succeed(1), IO.fail("error")]).result.assertIO(fails(strictEqualTo("error"))),
    );
  });

  suite("sleep", () => {
    it.io("sleep 0 must return", Live.live(Clock.sleep((0).milliseconds)).assertIO(isUnit));
  });

  suite("summarized", () => {
    test.io(
      "returns summary and value",
      Do((Δ) => {
        const ref    = Δ(Ref.make(0));
        const result = Δ(
          ref
            .set(3)
            .as("value")
            .summarized(ref.get, (start, end) => end - start),
        );
        return result.assert(deepEqualTo([3, "value"]));
      }),
    );
  });

  suite("swap", () => {
    test.io("swap must make error into value", () => {
      const error = "error";
      const io    = IO.fail(error).swap;
      return io.assertIO(strictEqualTo(error));
    });

    test.io("swap must make value into error", () => {
      const io = IO.succeedNow(42).swap;
      return io.either.assertIO(isLeft(strictEqualTo(42)));
    });

    test.io("swapping twice returns identical value", () => {
      const io = IO.succeedNow(42);
      return io.swap.swap.assertIO(strictEqualTo(42));
    });
  });

  suite("tapErrorCause", () => {
    test.io(
      "peeks at failure cause without changing it",
      Do((Δ) => {
        const ref   = Δ(Ref.make(Cause.empty<string>()));
        const exit  = Δ(IO.fail("error").tapErrorCause((c) => ref.set(c)).result);
        const cause = Δ(ref.get);
        return exit.assert(fails(strictEqualTo("error"))) && cause.failures.assert(strictEqualTo(List("error")));
      }),
    );

    test.io(
      "does not run on success",
      IO.succeed(1)
        .tapErrorCause(() => IO.halt("unexpected"))
        .assertIO(strictEqualTo(1)),
    );
  });

  suite("timeout", () => {
    test.io("timeout a long computation", () => {
      const io = (Clock.sleep((5).seconds) > IO.succeed(true)).timeout((10).milliseconds);
      return Live.live(io).assertIO(isNothing);
    });

    test.io("timeout repetition of uninterruptible effect", () => {
      const io = IO.unit.uninterruptible.forever;
      return Live.live(io.timeout((1).seconds)).assertIO(isNothing);
    });

    test.io("timeout preserves uninterruptibility", () => {
      const run = (start: Future<never, void>, end: Future<never, void>) =>
        Do((Δ) => {
          const future = Δ(Future.make<never, void>());
          Δ(future.succeed());
          Δ(start.succeed().withFinalizer(() => future.await.timeout((10).seconds).disconnect) > end.succeed());
          Δ(IO.never);
        }).scoped;
      return Do((Δ) => {
        const start = Δ(Future.make<never, void>());
        const end   = Δ(Future.make<never, void>());
        const fiber = Δ(run(start, end).forkDaemon);
        Δ(start.await);
        Δ(fiber.interrupt);
        Δ(end.await);
        return true.assert(completes);
      });
    });

    test.io(
      "preserves failure",
      IO.fail("error")
        .timeout((1).seconds)
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io(
      "preserves defect",
      IO.halt("defect")
        .timeout((1).seconds)
        .result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "inherits FiberRefs when effect wins with failure",
      Do((Δ) => {
        const ref = Δ(FiberRef.make(0));
        Δ((ref.set(1) > IO.fail("error")).timeout((1).seconds).result);
        const value = Δ(ref.get);
        return value.assert(strictEqualTo(0));
      }).scoped,
    );

    test.io(
      "does not inherit losing FiberRefs",
      Do((Δ) => {
        const ref   = Δ(FiberRef.make(0));
        const fiber = Δ((ref.set(1) > IO.never).timeout((1).seconds).fork);
        Δ(TestClock.adjust(1000));
        Δ(fiber.join);
        const value = Δ(ref.get);
        return value.assert(strictEqualTo(0));
      }).scoped,
    );

    test.io("timeout in uninterruptible region", IO.unit.timeout((1).seconds).uninterruptible.assertIO(isJust(isUnit)));

    suite("disconnect", () => {
      test.io(
        "disconnect returns Just for fast effect",
        IO.succeed(42)
          .disconnect.timeout((1).seconds)
          .assertIO(isJust(strictEqualTo(42))),
      );

      test.io(
        "disconnect returns Nothing for slow effect",
        Do((Δ) => {
          const fiber = Δ(IO.never.disconnect.timeout((1).seconds).fork);
          Δ(TestClock.adjust(1000));
          const value = Δ(fiber.join);
          return value.assert(isNothing);
        }),
      );
    });
  });

  suite("timeoutFail", () => {
    test.io(
      "timeoutFail returns supplied error",
      Do((Δ) => {
        const fiber = Δ(IO.never.timeoutFail((1).seconds, "timeout").fork);
        Δ(TestClock.adjust(1000));
        const exit = Δ(fiber.join.result);
        return exit.assert(fails(strictEqualTo("timeout")));
      }),
    );
  });

  suite("timeoutTo", () => {
    test.io(
      "times out with a cause",
      Do((Δ) => {
        const cause = Cause.halt("timeout");
        const fiber = Δ(IO.never.timeoutTo((1).seconds, IO.failCause(cause), IO.succeedNow).flatten.fork);
        Δ(TestClock.adjust(1000));
        const exit = Δ(fiber.join.result);
        return exit.assert(halts(strictEqualTo("timeout")));
      }),
    );
  });

  suite("transplant", () => {
    it.io(
      "child can outlive parent in race",
      Do((Δ) => {
        const future = Δ(Future.make<never, void>());
        const race   = IO.unit.raceWith(
          future.await,
          (_, fiber) => IO.succeed(fiber),
          (_, fiber) => IO.succeed(fiber),
        );
        const fiber = Δ(IO.transplant((grafter) => grafter.graft(race).fork.flatMap((fiber) => fiber.join)));
        Δ(future.succeed());
        const exit = Δ(fiber.await);
        return exit.isSuccess().assert(isTrue);
      }),
    );

    test.io(
      "preserves supervision relationship of nested fibers",
      Do((Δ) => {
        const ready     = Δ(Future.make<never, void>());
        const finalized = Δ(Future.make<never, void>());
        const fiber     = Δ(
          IO.transplant((grafter) =>
            grafter.graft(
              ((ready.succeed(undefined) > IO.never).onInterrupt(() => finalized.succeed(undefined)).fork > IO.never)
                .fork,
            ),
          ),
        );
        Δ(ready.await);
        Δ(fiber.interrupt);
        Δ(finalized.await);
        return true.assert(completes);
      }),
    );

    test.io(
      "grafted race child completes successfully after parent exits",
      Do((Δ) => {
        const gate = Δ(Future.make<never, void>());
        const race = IO.unit.raceWith(
          gate.await,
          (_, fiber) => IO.succeed(fiber),
          (_, fiber) => IO.succeed(fiber),
        );
        const fiber = Δ(IO.transplant((grafter) => grafter.graft(race).fork.flatMap((f) => f.join)));
        Δ(gate.succeed(undefined));
        const exit = Δ(fiber.await);
        return exit.assert(strictEqualTo(Exit.succeed(undefined)));
      }),
    );
  });

  suite("unjust", () => {
    test.io(
      "fails when given Just error",
      IO.fail(Just("error")).unjust.result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io("succeeds with Nothing given Nothing error", IO.fail(Nothing()).unjust.assertIO(isNothing));

    test.io("succeeds with Just given a value", IO.succeed(1).unjust.assertIO(isJust(strictEqualTo(1))));
  });

  suite("unrefineWith", () => {
    test.io(
      "converts matching defects into errors",
      IO.halt("defect")
        .unrefineWith((u) => (typeof u === "string" ? Just(u.length) : Nothing()), Function.identity)
        .result.assertIO(fails(strictEqualTo(6))),
    );

    test.io(
      "leaves unmatched defects",
      IO.halt("defect")
        .unrefineWith(() => Nothing(), Function.identity)
        .result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "maps typed errors",
      IO.fail(1)
        .unrefineWith(
          () => Nothing(),
          (n) => n + 1,
        )
        .result.assertIO(fails(strictEqualTo(2))),
    );
  });

  suite("unsandbox", () => {
    test.io("unwraps cause", IO.fail(Cause.halt("defect")).unsandbox.result.assertIO(halts(strictEqualTo("defect"))));

    test.io("no information is lost during composition", () => {
      const cause = Cause.parallel(Cause.fail("error"), Cause.halt("defect"));
      return IO.failCause(cause)
        .sandbox.unsandbox.sandbox.swap.map((c) => c.untraced)
        .assertIO(strictEqualTo(cause));
    });
  });

  suite("when", () => {
    for (const condition of [true, false]) {
      test.io(
        `executes correct branch for ${condition}`,
        Do((Δ) => {
          const ref = Δ(Ref.make(0));
          Δ(ref.update((n) => n + 1).when(condition));
          const count = Δ(ref.get);
          return count.assert(strictEqualTo(condition ? 1 : 0));
        }),
      );
    }
  });

  suite("whenIO", () => {
    for (const condition of [true, false]) {
      test.io(
        `executes condition and correct branch for ${condition}`,
        Do((Δ) => {
          const conditions = Δ(Ref.make(0));
          const branches   = Δ(Ref.make(0));
          const result     = Δ(branches.updateAndGet((n) => n + 1).whenIO(conditions.update((n) => n + 1).as(condition)));
          const checked    = Δ(conditions.get);
          const executed   = Δ(branches.get);
          return (
            checked.assert(strictEqualTo(1)) &&
            executed.assert(strictEqualTo(condition ? 1 : 0)) &&
            result.assert(condition ? isJust(strictEqualTo(1)) : isNothing)
          );
        }),
      );
    }

    test.io(
      "propagates condition failure",
      IO.halt("unexpected")
        .whenIO(IO.fail("condition"))
        .result.assertIO(fails(strictEqualTo("condition"))),
    );
  });

  suite("zip", () => {
    test.io(
      "is compositional",
      IO.succeed(1)
        .zip(IO.succeed(2))
        .zip(IO.succeed(3))
        .assertIO(deepEqualTo([[1, 2], 3])),
    );
  });

  suite("zipConcurrent", () => {
    it.io(
      "is interruptible",
      Do((Δ) => {
        const future1 = Δ(Future.make<never, void>());
        const future2 = Δ(Future.make<never, void>());
        const left    = future1.succeed() > IO.never;
        const right   = future2.succeed() > IO.never;
        const fiber   = Δ(left.zipConcurrent(right).fork);
        Δ(future1.await);
        Δ(future2.await);
        Δ(fiber.interrupt);
        return true.assert(completes);
      }),
    );

    test.io(
      "parallelizes simple success values",
      IO.succeed(1)
        .zipConcurrent(IO.succeed(2))
        .assertIO(deepEqualTo(Zipped(1, 2))),
    );

    test.io(
      "preserves failures",
      IO.succeed(1)
        .zipConcurrent(IO.fail("error"))
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io("propagates interruption", IO.succeed(1).zipConcurrent(IO.interrupt).result.assertIO(isInterrupted));

    test.io(
      "does not swallow loser finalizer cause",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const exit  = Δ(
          (ready.succeed(undefined) > IO.never)
            .ensuring(IO.halt("defect"))
            .zipConcurrent(ready.await > IO.fail("error")).result,
        );
        return exit.assert(fails(strictEqualTo("error")) && halts(strictEqualTo("defect")));
      }),
    );

    test.io(
      "propagates FiberRef values",
      Do((Δ) => {
        const ref = Δ(FiberRef.make(0));
        Δ(ref.set(1).zipConcurrent(IO.unit));
        const value = Δ(ref.get);
        return value.assert(strictEqualTo(1));
      }).scoped,
    );

    test.io("does not fail when loser already succeeded", IO.unit.zipConcurrent(IO.unit).asUnit.assertIO(isUnit));

    test.io(
      "does not report extra failure when interrupting successful loser",
      IO.interrupt
        .zipConcurrent(IO.succeed(1))
        .sandbox.either.map((either) => either.mapLeft((cause) => cause.isInterrupted))
        .assertIO(isLeft(isTrue)),
    );

    test.io(
      "does not swallow interrupted exit causes",
      IO.interrupt
        .zipConcurrent(IO.interrupt)
        .sandbox.swap.map((cause) => cause.interruptors.size > 0)
        .assertIO(isTrue),
    );

    test.io(
      "passes success composition regression",
      IO.succeed(1)
        .zipConcurrent(IO.succeed(2))
        .flatMap(([a, b]) => IO.succeed(a + b))
        .assertIO(strictEqualTo(3)),
    );

    test.io("parallelizes repeated simple successes", () => {
      function countdown(n: number): UIO<number> {
        return n === 0
          ? IO.succeed(0)
          : IO.succeed(1)
              .zipConcurrent(IO.succeed(2))
              .flatMap(([a, b]) => countdown(n - 1).map((sum) => sum + a + b));
      }
      return countdown(50).assertIO(strictEqualTo(150));
    });

    test.io(
      "passes nested zip regression",
      IO.succeed(1)
        .zipConcurrent(IO.succeed(2))
        .zipConcurrent(IO.succeed(3))
        .assertIO(deepEqualTo(Zipped(Zipped(1, 2), 3))),
    );

    test.io(
      "does not kill fiber forked on parent scope",
      Do((Δ) => {
        const gate  = Δ(Future.make<never, void>());
        const fiber = Δ(IO.unit.zipWithConcurrent(gate.await.as(42).fork, (_, fiber) => fiber));
        Δ(gate.succeed(undefined));
        const value = Δ(fiber.join);
        return value.assert(strictEqualTo(42));
      }),
    );
  });

  suite("RTS asynchronous correctness", () => {
    it.io("deep asyncIO doesn't block", () => {
      function stackIOs(count: number): UIO<number> {
        if (count <= 0) return IO.succeed(42);
        else return asyncIO(stackIOs(count - 1));
      }
      function asyncIO(cont: UIO<number>): UIO<number> {
        return IO.asyncIO<never, never, number>(
          (k) => Clock.sleep((5).milliseconds) > cont > IO.succeed(k(IO.succeed(42))),
        );
      }
      const io = stackIOs(17);
      return Live.live(io).assertIO(strictEqualTo(42));
    });

    it.io("shallow bind of async chain", () => {
      const io = Iterable.range(0, 9).foldLeft(IO.succeed(0), (acc, _) =>
        acc.flatMap((n) => IO.async<never, never, number>((k) => k(IO.succeed(n + 1)))),
      );
      return io.assertIO(strictEqualTo(10));
    });
  });

  suite("RTS failure", () => {
    test.io("error in sync effect", () => {
      const error = "error";
      const io    = IO.attempt(() => {
        throw error;
      }).match(
        (error) => Just(error),
        () => Nothing(),
      );
      return io.assertIO(isJust(strictEqualTo(error)));
    });

    test.io(
      "attempt followed by fail",
      IO.attempt(1)
        .flatMap(() => IO.fail("error"))
        .result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io("uncaught fail", IO.fail("error").result.assertIO(fails(strictEqualTo("error"))));

    test.io(
      "uncaught sync effect error",
      IO.succeed(() => {
        throw "defect";
      }).result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "attempt sandbox halt",
      IO.halt("defect")
        .either.sandbox.swap.map((c) => c.defects)
        .assertIO(strictEqualTo(List("defect"))),
    );

    test.io(
      "fold sandbox halt",
      IO.halt("defect")
        .match(
          () => 0,
          () => 1,
        )
        .result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "catch sandbox halt",
      IO.halt("defect")
        .sandbox.catchAll((c) => IO.succeed(c.defects))
        .assertIO(strictEqualTo(List("defect"))),
    );
  });

  suite("RTS interruption", () => {
    test.io(
      "self interruption triggers onInterrupt",
      Do((Δ) => {
        const ref  = Δ(Ref.make(false));
        const exit = Δ(IO.interrupt.onInterrupt(() => ref.set(true)).result);
        const ran  = Δ(ref.get);
        return exit.assert(isInterrupted) && ran.assert(isTrue);
      }),
    );

    test.io(
      "self interruption can be averted in uninterruptible region",
      IO.interrupt.catchAllCause(() => IO.succeed(42)).uninterruptible.assertIO(strictEqualTo(42)),
    );

    test.io(
      "interruption cannot be caught in interruptible region",
      Do((Δ) => {
        const started   = Δ(Future.make<never, void>());
        const recovered = Δ(Ref.make(false));
        const fiber     = Δ((started.succeed(undefined) > IO.never).catchAllCause(() => recovered.set(true)).fork);
        Δ(started.await);
        const exit   = Δ(fiber.interrupt);
        const caught = Δ(recovered.get);
        return exit.assert(isInterrupted) && caught.assert(isFalse);
      }),
    );

    test.io(
      "cause reflects interruption",
      IO.interrupt.sandbox.swap.map((cause) => cause.isInterrupted).assertIO(isTrue),
    );

    test.io(
      "interruption cannot be caught at end of uninterruptible region",
      Do((Δ) => {
        const started = Δ(Future.make<never, void>());
        const gate    = Δ(Future.make<never, void>());
        const ref     = Δ(Ref.make(false));
        const fiber   = Δ(
          (started.succeed(undefined) > gate.await).uninterruptible.catchAllCause(() => ref.set(true)).fork,
        );
        Δ(started.await);
        Δ(fiber.interruptFork);
        Δ(gate.succeed(undefined));
        const exit      = Δ(fiber.await);
        const recovered = Δ(ref.get);
        return exit.assert(isInterrupted) && recovered.assert(isFalse);
      }),
    );

    test.io(
      "interruption can be caught at beginning of uninterruptible region",
      Do((Δ) => {
        const started = Δ(Future.make<never, void>());
        const ref     = Δ(Ref.make(false));
        const fiber   = Δ(
          IO.uninterruptibleMask((restore) =>
            restore(started.succeed(undefined) > IO.never).catchAllCause(() => ref.set(true)),
          ).fork,
        );
        Δ(started.await);
        Δ(fiber.interrupt);
        const recovered = Δ(ref.get);
        return recovered.assert(isTrue);
      }),
    );

    test.io(
      "interruption cannot be observed inside region where it originates",
      Do((Δ) => {
        const started  = Δ(Future.make<never, void>());
        const gate     = Δ(Future.make<never, void>());
        const ref      = Δ(Ref.make(false));
        const observed = Δ(Ref.make(Cause.empty<string>()));
        const fiber    = Δ(
          (started.succeed(undefined) > gate.await > IO.fail("error"))
            .onInterrupt(() => ref.set(true))
            .sandbox.swap.flatMap((cause) => observed.set(cause)).fork.uninterruptible,
        );
        Δ(started.await);
        Δ(fiber.interruptFork);
        Δ(gate.succeed(undefined));
        Δ(fiber.await);
        const cause       = Δ(observed.get);
        const interrupted = Δ(ref.get);
        return (
          cause.failures.assert(strictEqualTo(List("error"))) &&
          cause.isInterrupted.assert(isFalse) &&
          interrupted.assert(isFalse)
        );
      }),
    );

    test.io(
      "interrupters can be seen in uninterruptible regions",
      Do((Δ) => {
        const parent   = Δ(IO.fiberId);
        const started  = Δ(Future.make<never, void>());
        const gate     = Δ(Future.make<never, void>());
        const observed = Δ(Ref.make(false));
        const fiber    = Δ(
          (
            started.succeed(undefined) >
            gate.await >
            IO.descriptor.flatMap((descriptor) => observed.set(descriptor.interruptors.has(parent)))
          ).fork.uninterruptible,
        );
        Δ(started.await);
        Δ(fiber.interruptFork);
        Δ(gate.succeed(undefined));
        Δ(fiber.await);
        const sawInterrupter = Δ(observed.get);
        return sawInterrupter.assert(isTrue);
      }),
    );

    test.io(
      "async can be uninterruptible",
      Do((Δ) => {
        const ready  = Δ(Future.make<never, void>());
        const resume = Δ(Future.make<never, void>());
        const ref    = Δ(Ref.make(false));
        const fiber  = Δ((ready.succeed(undefined) > resume.await > ref.set(true)).uninterruptible.fork);
        Δ(ready.await);
        Δ(fiber.interruptFork);
        Δ(resume.succeed(undefined));
        Δ(fiber.await);
        const completed = Δ(ref.get);
        return completed.assert(isTrue);
      }),
    );

    test.io(
      "alternating interruptibility",
      IO.checkInterruptible(
        (outer) =>
          IO.checkInterruptible((inner) => IO.succeed([outer.isInterruptible, inner.isInterruptible] as const))
            .interruptible,
      ).uninterruptible.assertIO(deepEqualTo([false, true] as const)),
    );

    test.io(
      "interruption after defect preserves defect",
      Do((Δ) => {
        const finalizing = Δ(Future.make<never, void>());
        const fiber      = Δ(IO.halt("defect").ensuring((finalizing.succeed(undefined) > IO.never).interruptible).fork);
        Δ(finalizing.await);
        const exit = Δ(fiber.interrupt);
        return exit.assert(isInterrupted && halts(strictEqualTo("defect")));
      }),
    );

    test.io(
      "catchAll and ensuring preserve finalization on interrupt",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const ref   = Δ(Ref.make(false));
        const effect: FIO<string, never> = ready.succeed(undefined) > IO.never;
        const fiber = Δ(effect.catchAll(IO.failNow).ensuring(ref.set(true)).fork);
        Δ(ready.await);
        const exit      = Δ(fiber.interrupt);
        const finalized = Δ(ref.get);
        return exit.assert(isInterrupted) && finalized.assert(isTrue);
      }),
    );

    test.io(
      "recovers from error in interrupted finalizer",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const ref   = Δ(Ref.make(false));
        const fiber = Δ(
          (ready.succeed(undefined) > IO.never).ensuring(IO.fail("release").catchAll(() => ref.set(true))).fork,
        );
        Δ(ready.await);
        Δ(fiber.interrupt);
        const recovered = Δ(ref.get);
        return recovered.assert(isTrue);
      }),
    );

    test.io(
      "interrupted cause persists after catching",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const exits = Δ(Ref.make(Conc.empty<Exit<never, unknown>>()));
        const fiber = Δ(
          IO.uninterruptibleMask((restore) =>
            restore(
              IO.uninterruptibleMask((innerRestore) =>
                innerRestore(ready.succeed(undefined) > IO.never).onExit((exit) =>
                  exits.update((ns) => ns.append(exit)),
                ),
              ),
            ).result.flatMap((exit) => exits.update((ns) => ns.append(exit))),
          ).fork,
        );
        Δ(ready.await);
        Δ(fiber.interrupt);
        const observed = Δ(exits.get);
        return (
          observed.length.assert(strictEqualTo(2)) &&
          observed
            .map((exit) =>
              exit.match(
                (cause) => cause.isInterruptedOnly,
                () => false,
              ),
            )
            .assert(every(isTrue))
        );
      }),
    );

    for (const sandboxed of [false, true]) {
      test.io(
        `${sandboxed ? "sandbox" : "result"} of interruptible region`,
        Do((Δ) => {
          const ready    = Δ(Future.make<never, void>());
          const ref      = Δ(Ref.make(false));
          const effect   = ready.succeed(undefined) > IO.never.interruptible;
          const observed = sandboxed
            ? effect.sandbox.either.flatMap((either) =>
                ref.set(
                  either.match(
                    (cause) => cause.isInterrupted,
                    () => false,
                  ),
                ),
              )
            : effect.result.flatMap((exit) =>
                ref.set(
                  exit.match(
                    (cause) => cause.isInterrupted,
                    () => false,
                  ),
                ),
              );
          const fiber = Δ(observed.uninterruptible.fork);
          Δ(ready.await);
          Δ(fiber.interrupt);
          const recovered = Δ(ref.get);
          return recovered.assert(isTrue);
        }),
      );
    }

    test.io(
      "finalizer can see interrupting fiber",
      Do((Δ) => {
        const parent = Δ(IO.fiberId);
        const ready  = Δ(Future.make<never, void>());
        const ref    = Δ(Ref.make(false));
        const fiber  = Δ(
          (ready.succeed(undefined) > IO.never).ensuring(
            IO.descriptor.flatMap((d) => ref.set(d.interruptors.has(parent))),
          ).fork,
        );
        Δ(ready.await);
        Δ(fiber.interrupt);
        const observed = Δ(ref.get);
        return observed.assert(isTrue);
      }),
    );

    test.io(
      "alternating interruptible regions continue in enclosing masks",
      Do((Δ) => {
        const ready = Δ(Future.make<never, void>());
        const ref   = Δ(Ref.make(0));
        const fiber = Δ(
          (
            ((ready.succeed(undefined) > IO.never.interruptible).result > ref.update((n) => n + 1)).uninterruptible
              .interruptible.result > ref.update((n) => n + 1)
          ).uninterruptible.fork,
        );
        Δ(ready.await);
        Δ(fiber.interrupt);
        const count = Δ(ref.get);
        return count.assert(strictEqualTo(2));
      }),
    );

    for (const disconnect of [false, true]) {
      test.io(
        `${disconnect ? "disconnect" : "timeout"} does not expose interruption within uninterruptible region`,
        Do((Δ) => {
          const ready       = Δ(Future.make<never, void>());
          const release     = Δ(Future.make<never, void>());
          const interrupted = Δ(Ref.make(false));
          const effect      = (ready.succeed(undefined) > release.await).onInterrupt(() => interrupted.set(true));
          const fiber       = Δ((disconnect ? effect.disconnect : effect.timeout((1).seconds)).uninterruptible.fork);
          Δ(ready.await);
          Δ(fiber.interruptFork);
          Δ(release.succeed(undefined));
          Δ(fiber.await);
          const observed = Δ(interrupted.get);
          return observed.assert(isFalse);
        }),
      );
    }

    for (const defect of [false, true]) {
      test.io(
        `previous ${defect ? "untyped errors are retained" : "typed errors are discarded"} after interruptible region`,
        Do((Δ) => {
          const finalizing = Δ(Future.make<never, void>());
          const observed   = Δ(Ref.make(Cause.empty<number>()));
          const failure    = defect ? IO.halt("error") : IO.fail("error");
          const fiber      = Δ(
            IO.uninterruptibleMask((restore) =>
              restore(
                failure.ensuring(finalizing.succeed(undefined) > IO.never.interruptible).mapError(() => 42),
              ).catchAllCause((cause) => observed.set(cause)),
            ).fork,
          );
          Δ(finalizing.await);
          Δ(fiber.interrupt);
          const cause = Δ(observed.get);
          return (
            cause.failures.assert(isEmpty) && cause.defects.assert(strictEqualTo(defect ? List("error") : List.empty()))
          );
        }),
      );
    }

    test.io(
      "interruption after defect in uninterruptible mask",
      Do((Δ) => {
        const finalizing = Δ(Future.make<never, void>());
        const observed   = Δ(Ref.make(Cause.empty<never>()));
        const fiber      = Δ(
          IO.uninterruptibleMask((restore) =>
            restore(IO.halt("defect").ensuring(finalizing.succeed(undefined) > IO.never.interruptible)).catchAllCause(
              (cause) => observed.set(cause),
            ),
          ).fork,
        );
        Δ(finalizing.await);
        Δ(fiber.interrupt);
        const cause = Δ(observed.get);
        return cause.defects.assert(strictEqualTo(List("defect"))) && cause.isInterrupted.assert(isTrue);
      }),
    );
  });

  suite("RTS synchronous correctness", () => {
    test.io(
      "deferTry must catch",
      IO.deferTry(() => {
        throw "error";
      }).either.assertIO(isLeft(strictEqualTo("error"))),
    );

    test.io(
      "defer must not catch",
      IO.defer(() => {
        throw "error";
      }).sandbox.either.assertIO(isLeft(strictEqualTo(Cause.halt("error")))),
    );

    test.io("defer must be evaluatable", IO.defer(IO.succeed(42)).assertIO(strictEqualTo(42)));

    test.io("point, bind, map", () => {
      const fibIO = (n: bigint): UIO<bigint> => {
        if (n <= 1) return IO.succeed(n);
        else {
          return Do((Δ) => {
            const a = Δ(fibIO(n - 1n));
            const b = Δ(fibIO(n - 2n));
            return a + b;
          });
        }
      };

      return fibIO(10n).assertIO(strictEqualTo(fib(10n)));
    });

    test.io("effect, bind, map", () => {
      const fibIO = (n: bigint): FIO<unknown, bigint> => {
        if (n <= 1) return IO.attempt(n);
        else {
          return Do((Δ) => {
            const a = Δ(fibIO(n - 1n));
            const b = Δ(fibIO(n - 2n));
            return a + b;
          });
        }
      };

      return fibIO(10n).assertIO(strictEqualTo(fib(10n)));
    });

    test.io("effect, bind, map, redeem", () => {
      const fibIO = (n: bigint): FIO<unknown, bigint> => {
        if (n <= 1)
          return IO.attempt<bigint>(() => {
            throw new Error("error");
          }).catchAll(() => IO.attempt(n));
        else {
          return Do((Δ) => {
            const a = Δ(fibIO(n - 1n));
            const b = Δ(fibIO(n - 2n));
            return a + b;
          });
        }
      };

      return fibIO(10n).assertIO(strictEqualTo(fib(10n)));
    });

    test.io(
      "succeed is lazy",
      Do((Δ) => {
        let evaluated = false;
        const effect  = IO.succeed(() => {
          evaluated = true;
          return 42;
        });
        const before = evaluated;
        const value  = Δ(effect);
        return before.assert(isFalse) && evaluated.assert(isTrue) && value.assert(strictEqualTo(42));
      }),
    );

    test.io(
      "defer is lazy",
      Do((Δ) => {
        let evaluated = false;
        const effect  = IO.defer(() => {
          evaluated = true;
          return IO.succeed(42);
        });
        const before = evaluated;
        const value  = Δ(effect);
        return before.assert(isFalse) && evaluated.assert(isTrue) && value.assert(strictEqualTo(42));
      }),
    );

    test.io(
      "defer does not catch thrown exceptions as typed errors",
      IO.defer((): UIO<never> => {
        throw "defect";
      }).result.assertIO(halts(strictEqualTo("defect"))),
    );

    test.io(
      "deferTry catches thrown exceptions",
      IO.deferTry((): FIO<unknown, never> => {
        throw "error";
      }).result.assertIO(fails(strictEqualTo("error"))),
    );

    test.io("defer is evaluatable", IO.defer(IO.succeed(42)).assertIO(strictEqualTo(42)));

    test.io(
      "fast path resumption",
      IO.succeed(1)
        .flatMap((n) => IO.succeed(n + 1))
        .assertIO(strictEqualTo(2)),
    );
  });

  suite("RTS synchronous stack safety", () => {
    test.io("deep effects", () => {
      const incLeft = (n: number, ref: Ref<number>): UIO<number> => {
        if (n <= 0) return ref.get;
        else return incLeft(n - 1, ref) < ref.update((n) => n + 1);
      };
      const incRight = (n: number, ref: Ref<number>): UIO<number> => {
        if (n <= 0) return ref.get;
        else return ref.update((n) => n + 1) > incRight(n - 1, ref);
      };

      const l = Do((Δ) => {
        const ref = Δ(Ref.make(0));
        const v   = Δ(incLeft(100, ref));
        return v === 0;
      });

      const r = Do((Δ) => {
        const ref = Δ(Ref.make(0));
        const v   = Δ(incRight(1000, ref));
        return v === 1000;
      });

      return l.zipWith(r, (a, b) => a === b).assertIO(isTrue);
    });

    for (const kind of ["succeed", "attempt", "async"] as const) {
      test.io(`deep map of ${kind}`, () => {
        let effect: FIO<unknown, number> =
          kind === "succeed"
            ? IO.succeed(0)
            : kind === "attempt"
              ? IO.attempt(0)
              : IO.async<never, never, number>((cb) => cb(IO.succeed(0)));
        for (let i = 0; i < 10000; i++) effect = effect.map((n) => n + 1);
        return effect.assertIO(strictEqualTo(10000));
      });
    }

    test.io("deep flatMap", () => {
      let effect = IO.succeed(0);
      for (let i = 0; i < 10000; i++) effect = effect.flatMap((n) => IO.succeed(n + 1));
      return effect.assertIO(strictEqualTo(10000));
    });

    for (const async of [false, true]) {
      test.io(`deep absolve either identity ${async ? "async" : "sync"}`, () => {
        let effect: FIO<string, number> = async
          ? IO.async<never, string, number>((cb) => cb(IO.succeed(42)))
          : IO.succeed(42);
        for (let i = 0; i < 1000; i++) effect = effect.either.absolve;
        return effect.assertIO(strictEqualTo(42));
      });
    }

    test.io("deep uncaught sync error", () => {
      let effect: UIO<number> = IO.succeed(() => {
        throw "defect";
      });
      for (let i = 0; i < 10000; i++) effect = effect.flatMap((n) => IO.succeed(n + 1));
      return effect.result.assertIO(halts(strictEqualTo("defect")));
    });

    for (const defect of [false, true]) {
      test.io(`deep attempt ${defect ? "thrown" : "typed"} error`, () => {
        let effect: FIO<unknown, number> = defect
          ? IO.attempt(() => {
              throw "error";
            })
          : IO.fail("error");
        for (let i = 0; i < 10000; i++) effect = effect.flatMap((n) => IO.attempt(n + 1));
        return effect.result.assertIO(fails(strictEqualTo("error")));
      });
    }
  });
});

function fib(n: bigint): bigint {
  if (n <= 1) return n;
  else return fib(n - 1n) + fib(n - 2n);
}

function concurrentFib(n: bigint): UIO<bigint> {
  if (n <= 1) return IO.succeed(n);
  else
    return Do((Δ) => {
      const f1 = Δ(concurrentFib(n - 1n).fork);
      const f2 = Δ(concurrentFib(n - 2n).fork);
      const v1 = Δ(f1.join);
      const v2 = Δ(f2.join);
      return v1 + v2;
    });
}
