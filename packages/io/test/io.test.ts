import { withLatch } from "./Latch.js";

suite.concurrent("IO", () => {
  suite.concurrent("repeatUntil", () => {
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
  });

  suite.concurrent("foreachConcurrent", () => {
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
        const fiber = Δ(IO.foreachConcurrent([IO.never, f.succeed(undefined)], Function.identity).fork);
        Δ(f.await);
        Δ(fiber.interrupt);
        return true;
      }).assert(isTrue),
    );

    it.io("propagates error", () => {
      const ints = List(1, 2, 3, 4, 5, 6);
      const odds = IO.foreachConcurrent(ints, (n) => (n % 2 !== 0 ? IO.succeed(n) : IO.fail("not odd")));
      return odds.swap.assert(strictEqualTo("not odd"));
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
        const e = Δ(IO.foreachConcurrent(actions, Function.identity).swap);
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
  });

  suite.concurrent("RTS finalizers", () => {
    it.io("fail ensuring", () => {
      let finalized = false;

      const io = IO.fail("error").ensuring(
        IO.succeed(() => {
          finalized = true;
        }),
      );

      return Do((Δ) => {
        const a1 = Δ(io.result.assert(fails(strictEqualTo("error"))));
        const a2 = finalized.assert(isTrue);
        return a1 && a2;
      });
    });

    it.io("finalizer errors not caught", () => {
      const e2 = new Error("e2");
      const e3 = new Error("e3");

      const io = IO.fail("error").ensuring(IO.halt(e2)).ensuring(IO.halt(e3));

      const expectedCause = Cause.sequential(Cause.fail("error"), Cause.sequential(Cause.halt(e2), Cause.halt(e3)));

      return io.sandbox.swap.map((c) => c.untraced).assert(strictEqualTo(expectedCause));
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
  });

  suite.concurrent("RTS asynchronous correctness", () => {
    it.io("simple async must return", () => {
      const io = IO.async<never, never, number>((k) => k(IO.succeed(42)));
      return io.assert(strictEqualTo(42));
    });
    it.io("simple asyncIO must return", () => {
      const io = IO.asyncIO<never, never, number>((k) => IO.succeed(k(IO.succeed(42))));
      return io.assert(strictEqualTo(42));
    });
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
      return Live.live(io).assert(strictEqualTo(42));
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
        return a.assert(strictEqualTo<void>(undefined));
      }),
    );
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
    it.io("sleep 0 must return", Live.live(Clock.sleep((0).milliseconds)).assert(isUnit));
    it.io("shallow bind of async chain", () => {
      const io = Iterable.range(0, 9).foldLeft(IO.succeed(0), (acc, _) =>
        acc.flatMap((n) => IO.async<never, never, number>((k) => k(IO.succeed(n + 1)))),
      );
      return io.assert(strictEqualTo(10));
    });
    it.io("asyncIO can fail before registering", () => {
      const io = IO.asyncIO<never, string, never>(() => IO.fail("Ouch")).swap;
      return io.assert(strictEqualTo("Ouch"));
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
      return io.assert(isJust(strictEqualTo("Ouch")));
    });
  });
  suite.concurrent("RTS concurrency correctness", () => {
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
      return concurrentFib(n).assert(strictEqualTo(fib(n)));
    });
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

      return io.assert(strictEqualTo(2));
    });
    it.io("race of fail with success", () => {
      const io = IO.fail(42).race(IO.succeed(24)).either;
      return io.assert(isRight(strictEqualTo(24)));
    });
    it.io("race of terminate with success", () => {
      const io = IO.halt(new Error()).race(IO.succeed(24));
      return io.assert(strictEqualTo(24));
    });
    it.io("race of fail with fail", () => {
      const io = IO.fail(42).race(IO.fail(42)).either;
      return io.assert(isLeft(strictEqualTo(42)));
    });
    it.io("race of value and never", () => {
      const io = IO.succeed(42).race(IO.never);
      return io.assert(strictEqualTo(42));
    });
    it.io("race in uninterruptible region", () => {
      const effect = IO.unit.race(IO.never).uninterruptible;
      return effect.assert(isUnit);
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
        const value = Δ(latch.succeed(undefined) > awaitAll > ref.get);
        return value.assert(isLessThanOrEqualTo(1));
      }),
    );
    it.io(
      "child can outlive parent in race",
      Do((Δ) => {
        const future = Δ(Future.make<never, void>());
        const race   = IO.unit.raceWith(
          future.await,
          (_, fiber) => IO.succeed(fiber),
          (_, fiber) => IO.succeed(fiber),
        );
        const fiber = Δ(IO.transplant((graft) => graft(race).fork.flatMap((fiber) => fiber.join)));
        Δ(future.succeed(undefined));
        const exit = Δ(fiber.await);
        return exit.isSuccess().assert(isTrue);
      }),
    );
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
    it.io("mergeAll", () => {
      const io = IO.mergeAll(List("a", "aa", "aaa", "aaaa").map(IO.succeedNow), 0, (b, a) => b + a.length);
      return io.assert(strictEqualTo(10));
    });
  });
  suite.concurrent("RTS interruption", () => {
    it.io("sync forever is interruptible", () =>
      IO.succeed(1)
        .forever.fork.flatMap((f) => f.interrupt)
        .as(true)
        .assert(strictEqualTo(true)),
    );
    it.io("interrupt of never is interrupted with cause", () =>
      IO.never.fork.flatMap((f) => f.interrupt).assert(isOnlyInterrupted),
    );
    it.io("asyncIO is interruptible", () =>
      IO.asyncIO<never, never, never>(() => IO.never)
        .fork.flatMap((f) => f.interrupt)
        .as(42)
        .assert(strictEqualTo(42)),
    );
    it.io("async is interruptible", () =>
      IO.async<never, never, never>(() => {
        //
      })
        .fork.flatMap((f) => f.interrupt)
        .as(42)
        .assert(strictEqualTo(42)),
    );
    it.io("bracket is uninterruptible", () => {
      const io = Do((Δ) => {
        const future = Δ(Future.make<never, void>());
        const fiber  = Δ(
          IO.bracket(
            future.succeed(undefined) < IO.never,
            () => IO.unit,
            () => IO.unit,
          ).forkDaemon,
        );
        return Δ(future.await > fiber.interrupt.timeoutTo((1).seconds, 42, () => 0));
      });
      return Live.live(io).assert(strictEqualTo(42));
    });
    it.io("bracketExit is uninterruptible", () => {
      const io = Do((Δ) => {
        const future = Δ(Future.make<never, void>());
        const fiber  = Δ(
          IO.bracketExit(
            future.succeed(undefined) > IO.never > IO.succeed(1),
            () => IO.unit,
            () => IO.unit,
          ).forkDaemon,
        );
        return Δ(future.await > fiber.interrupt.timeoutTo((1).seconds, 42, () => 0));
      });
      return Live.live(io).assert(strictEqualTo(42));
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
      return io.timeoutTo((1).seconds, 42, () => 0).assert(strictEqualTo(0));
    });
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
  });
  suite.concurrent("zipConcurrent", () => {
    it.io(
      "is interruptible",
      Do((Δ) => {
        const future1 = Δ(Future.make<never, void>());
        const future2 = Δ(Future.make<never, void>());
        const left    = future1.succeed(undefined) > IO.never;
        const right   = future2.succeed(undefined) > IO.never;
        const fiber   = Δ(left.zipConcurrent(right).fork);
        Δ(future1.await);
        Δ(future2.await);
        Δ(fiber.interrupt);
        return true.assert(completes);
      }),
    );
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
