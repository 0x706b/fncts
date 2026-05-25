import { Console } from "@fncts/io/Console";
import { UnsafeSink } from "@fncts/io/Push/Sink";
import { strictEqualTo } from "@fncts/test/control/Assertion";
import { TestConsole } from "@fncts/test/control/TestConsole";

suite("RefSubject", () => {
  test.io(
    "acts as a Ref and a Subject",
    () =>
      Do((Δ) => {
        const refSubject = Δ(RefSubject.fromIO(IO.succeedNow(1)));

        const fiber = Δ(
          refSubject.run(
            UnsafeSink.unsafeMake(
              (value) => Console.show(value),
              (cause) => Console.show(cause),
            ),
          ).fork,
        );

        const updateAndYield = refSubject.update((n) => n + 1) > IO.yieldNow;

        Δ(updateAndYield);
        Δ(updateAndYield);
        Δ(updateAndYield);
        Δ(updateAndYield);
        Δ(updateAndYield);

        Δ(fiber.interrupt);

        const value         = Δ(refSubject.get);
        const testConsole   = Δ(IO.service(TestConsole.Tag));
        const consoleOutput = Δ(testConsole.output);
        return value.assert(strictEqualTo(6)) && consoleOutput.assert(strictEqualTo(Vector("2", "3", "4", "5", "6")));
      }).scoped,
  );
});
