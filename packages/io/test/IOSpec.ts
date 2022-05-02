import { Live } from "@fncts/test/control/Live";

class IOSpec extends DefaultRunnableSpec {
  spec = suite(
    "IO",
    suite(
      "repeatUntil",
      testIO(
        "repeats until condition is true",
        Do((Δ) => {
          const inp = Δ(Ref.make(10));
          const out = Δ(Ref.make(0));
          Δ((inp.updateAndGet((n) => n - 1) < out.update((n) => n + 1)).repeatUntil((n) => n === 0));
          const result = Δ(out.get);
          return result.assert(strictEqualTo(10));
        }),
      ),
      testIO(
        "always evaluates the effect at least once",
        Do((Δ) => {
          const ref = Δ(Ref.make(0));
          Δ(ref.update((n) => n + 1).repeatUntil(() => true));
          const result = Δ(ref.get);
          return result.assert(strictEqualTo(1));
        }),
      ),
    ),
    suite(
      "foreachC",
      testIO("returns results in the same order", () => {
        const list = List("1", "2", "3");
        const res  = IO.foreachC(list, (x) => IO.succeed(parseInt(x)));
        return res.assert(strictEqualTo(Conc(1, 2, 3)));
      }),
      testIO(
        "runs effects in parallel",
        Do((Δ) => {
          const f     = Δ(Future.make<never, void>());
          const fiber = Δ(IO.foreachC([IO.never, f.succeed(undefined)], Function.identity).fork);
          Δ(f.await);
          Δ(fiber.interrupt);
          return true;
        }).assert(isTrue),
      ),
      testIO("propagates error", () => {
        const ints = List(1, 2, 3, 4, 5, 6);
        const odds = IO.foreachC(ints, (n) => (n % 2 !== 0 ? IO.succeed(n) : IO.fail("not odd")));
        return odds.swap.assert(strictEqualTo("not odd"));
      }),
      testIO(
        "interrupts effects on the first failure",
        Do((Δ) => {
          const ref     = Δ(Ref.make(false));
          const future  = Δ(Future.make<never, void>());
          const actions = List<IO<unknown, string, void>>(
            IO.never,
            IO.succeed(1),
            IO.fail("C"),
            future.await > ref.set(true),
          );
          const e = Δ(IO.foreachC(actions, Function.identity).swap);
          const v = Δ(ref.get);
          return e.assert(strictEqualTo("C")) && v.assert(isFalse);
        }),
      ),
      testIO(
        "does not kill fiber when forked on the parent scope",
        Do((Δ) => {
          const ref    = Δ(Ref.make(0));
          const fibers = Δ(IO.foreachC(Iterable.range(1, 100), () => ref.update((n) => n + 1).fork));
          Δ(IO.foreach(fibers, (f) => f.await));
          const value = Δ(ref.get);
          return value.assert(strictEqualTo(100));
        }),
      ),
    ),
    suite(
      "RTS finalizers",
      testIO("fail ensuring", () => {
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
      }),
      testIO("finalizer errors not caught", () => {
        const e2 = new Error("e2");
        const e3 = new Error("e3");

        const io = IO.fail("error").ensuring(IO.halt(e2)).ensuring(IO.halt(e3));

        const expectedCause = Cause.then(Cause.fail("error"), Cause.then(Cause.halt(e2), Cause.halt(e3)));

        return io.sandbox.swap.map((c) => c.untraced).assert(strictEqualTo(expectedCause));
      }),
      testIO("finalizer errors reported", () => {
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
      }),
    ),
    suite(
      "RTS asynchronous correctness",
      testIO("simple async must return", () => {
        const io = IO.async<unknown, never, number>((k) => k(IO.succeed(42)));
        return io.assert(strictEqualTo(42));
      }),
      testIO("simple asyncIO must return", () => {
        const io = IO.asyncIO<unknown, never, number>((k) => IO.succeed(k(IO.succeed(42))));
        return io.assert(strictEqualTo(42));
      }),
      testIO("deep asyncIO doesn't block", () => {
        function stackIOs(count: number): UIO<number> {
          if (count <= 0) return IO.succeed(42);
          else return asyncIO(stackIOs(count - 1));
        }
        function asyncIO(cont: UIO<number>): UIO<number> {
          return IO.asyncIO<unknown, never, number>((k) => Clock.sleep((5).milliseconds) > cont > IO.succeed(k(IO.succeed(42))));
        }
        const io = stackIOs(17);
        return Live.Live(io).assert(strictEqualTo(42));
      }),
      testIO(
        "interrupt of asyncIO register",
        Do((Δ) => {
          const release = Δ(Future.make<never, void>());
          const acquire = Δ(Future.make<never, void>());
          const fiber   = Δ(
            IO.asyncIO<unknown, never, void>(() =>
              IO.bracket(
                acquire.succeed(undefined),
                () => IO.never,
                () => {
                  debugger;
                  return release.succeed(undefined);
                },
              ),
            ).disconnect.fork,
          );
          Δ(acquire.await);
          Δ(fiber.interruptFork);
          const a = Δ(release.await);
          return a.assert(strictEqualTo<void>(undefined));
        }),
      ),
      testIO(
        "async should not resume fiber twice after interruption",
        Do((Δ) => {
          const step            = Δ(Future.make<never, void>());
          const unexpectedPlace = Δ(Ref.make(List.empty<number>()));
          const runtime         = Δ(IO.runtime<Has<Live>>());
          const fork            = Δ(
            IO.async<unknown, never, void>((k) => {
              runtime.unsafeRunAsync(step.await > IO.succeed(k(unexpectedPlace.update((_) => 1 + _))));
            })
              .ensuring(
                IO.async<unknown, never, void>(() => {
                  runtime.unsafeRunAsync(step.succeed(undefined));
                  // never complete
                }),
              )
              .ensuring(unexpectedPlace.update((_) => 2 + _)).forkDaemon,
          );
          const result     = Δ(Live.withLive(fork.interrupt, (io) => io.timeout((1).seconds)));
          const unexpected = Δ(unexpectedPlace.get);
          return unexpected.assert(isEmpty) && result.assert(isNothing);
        }),
      ),
      testIO(
        "asyncMaybe should not resume fiber twice after synchronous result",
        Do((Δ) => {
          const step            = Δ(Future.make<never, void>());
          const unexpectedPlace = Δ(Ref.make(List.empty<number>()));
          const runtime         = Δ(IO.runtime<Has<Live>>());
          const fork            = Δ(
            IO.asyncMaybe((k) => {
              runtime.unsafeRunAsync(step.await > IO.succeed(k(unexpectedPlace.update((_) => 1 + _))));
              return Just(IO.unit);
            })
              .flatMap(() =>
                IO.async<unknown, never, void>(() => {
                  runtime.unsafeRunAsync(step.succeed(undefined));
                  // never complete
                }),
              )
              .ensuring(unexpectedPlace.update((_) => 2 + _)).uninterruptible.forkDaemon,
          );
          const result     = Δ(Live.withLive(fork.interrupt, (io) => io.timeout((1).seconds)));
          const unexpected = Δ(unexpectedPlace.get);
          return unexpected.assert(isEmpty) && result.assert(isNothing);
        }),
      ),
    ),
  );
}

export default new IOSpec();
