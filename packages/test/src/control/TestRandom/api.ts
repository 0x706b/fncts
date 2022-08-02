import { IOEnv } from "@fncts/io/IOEnv";
import { Buffer, Data, TestRandom } from "@fncts/test/control/TestRandom";

/**
 * @tsplus static fncts.test.TestRandom feedInts
 */
export function feedInts(...ints: ReadonlyArray<number>) {
  return IO.serviceWithIO((tr) => tr.feedInts(...ints), TestRandom.Tag);
}
/**
 * @tsplus static fncts.test.TestRandom feedBytes
 */
export function feedBytes(...bytes: ReadonlyArray<ReadonlyArray<Byte>>) {
  return IO.serviceWithIO((tr) => tr.feedBytes(...bytes), TestRandom.Tag);
}
/**
 * @tsplus static fncts.test.TestRandom feedChars
 */
export function feedChars(...chars: ReadonlyArray<string>) {
  return IO.serviceWithIO((tr) => tr.feedChars(...chars), TestRandom.Tag);
}
/**
 * @tsplus static fncts.test.TestRandom feedDoubles
 */
export function feedDoubles(...doubles: ReadonlyArray<number>) {
  return IO.serviceWithIO((tr) => tr.feedDoubles(...doubles), TestRandom.Tag);
}
/**
 * @tsplus static fncts.test.TestRandom feedStrings
 */
export function feedStrings(...strings: ReadonlyArray<string>) {
  return IO.serviceWithIO((tr) => tr.feedStrings(...strings), TestRandom.Tag);
}
/**
 * @tsplus static fncts.test.TestRandom feedBooleans
 */
export function feedBooleans(...booleans: ReadonlyArray<boolean>) {
  return IO.serviceWithIO((tr) => tr.feedBooleans(...booleans), TestRandom.Tag);
}

/**
 * @tsplus static fncts.test.TestRandomOps make
 */
export function make(initialData: Data): Layer<never, never, Random | TestRandom> {
  return Layer.fromIOEnvironment(
    Do((_) => {
      const data   = _(Ref.make(initialData));
      const buffer = _(Ref.make(new Buffer()));
      const test   = new TestRandom(data, buffer);
      return Environment().add(test, TestRandom.Tag).add(test, Random.Tag);
    }),
  );
}

const defaultData = new Data(1071905196, 1911589680);

/**
 * @tsplus static fncts.test.TestRandomOps Deterministic
 */
export const determinictic = TestRandom.make(defaultData);

/**
 * @tsplus static fncts.test.TestRandomOps Random
 */
export const random: Layer<unknown, never, TestRandom> = determinictic.to(
  Layer.scoped(
    Do((_) => {
      const testRandom = _(IO.service(TestRandom.Tag));
      const time       = _(Clock.currentTime);
      _(testRandom.setSeed(time));
      _(IOEnv.services.locallyScopedWith((_) => _.add(testRandom, Random.Tag)));
      return testRandom;
    }),
    TestRandom.Tag,
  ),
);
