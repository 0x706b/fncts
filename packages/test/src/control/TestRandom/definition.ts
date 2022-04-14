import type { ArrayInt } from "@fncts/base/util/rand";

import { IllegalArgumentError } from "@fncts/base/data/exceptions";

/**
 * @tsplus static fncts.test.control.TestRandomOps Tag
 */
export const TestRandomTag = Tag<TestRandom>();

/**
 * @tsplus type fncts.test.control.TestRandom
 * @tsplus companion fncts.test.control.TestRandomOps
 */
export class TestRandom implements Random {
  constructor(readonly randomState: Ref<Data>, readonly bufferState: Ref<Buffer>) {}

  clearBooleans: UIO<void> = this.bufferState.update((buff) =>
    buff.copy({ booleans: Vector.empty() }),
  );
  clearBytes: UIO<void>   = this.bufferState.update((buff) => buff.copy({ bytes: Vector.empty() }));
  clearChars: UIO<void>   = this.bufferState.update((buff) => buff.copy({ chars: Vector.empty() }));
  clearDoubles: UIO<void> = this.bufferState.update((buff) =>
    buff.copy({ doubles: Vector.empty() }),
  );
  clearInts: UIO<void>    = this.bufferState.update((buff) => buff.copy({ integers: Vector.empty() }));
  clearStrings: UIO<void> = this.bufferState.update((buff) =>
    buff.copy({ strings: Vector.empty() }),
  );
  feedBooleans(...booleans: ReadonlyArray<boolean>): UIO<void> {
    return this.bufferState.update((buff) =>
      buff.copy({ booleans: Vector.from(booleans).concat(buff.booleans) }),
    );
  }
  feedBytes(...bytes: ReadonlyArray<ReadonlyArray<Byte>>): UIO<void> {
    return this.bufferState.update((data) =>
      data.copy({ bytes: Vector.from(bytes).concat(data.bytes) }),
    );
  }
  feedChars(...chars: ReadonlyArray<string>): UIO<void> {
    return this.bufferState.update((data) =>
      data.copy({ chars: Vector.from(chars).concat(data.chars) }),
    );
  }
  feedDoubles(...doubles: ReadonlyArray<number>): UIO<void> {
    return this.bufferState.update((data) =>
      data.copy({ doubles: Vector.from(doubles).concat(data.doubles) }),
    );
  }
  feedInts(...ints: ReadonlyArray<number>): UIO<void> {
    return this.bufferState.update((data) =>
      data.copy({ integers: Vector.from(ints).concat(data.integers) }),
    );
  }
  feedStrings(...strings: ReadonlyArray<string>): UIO<void> {
    return this.bufferState.update((data) =>
      data.copy({ strings: Vector.from(strings).concat(data.strings) }),
    );
  }
  getSeed: UIO<number> = this.randomState.get.map(
    (data) => ((data.seed1 << 24) | data.seed2) ^ 0x5deece66d,
  );

  setSeed(seed: number): UIO<void> {
    const mash    = Mash();
    const newSeed = mash(seed.toString());
    const seed1   = Math.floor(newSeed >>> 24);
    const seed2   = Math.floor(newSeed) & ((1 << 24) - 1);
    return this.randomState.set(new Data(seed1, seed2, ImmutableQueue.empty()));
  }

  private bufferedBoolean = (buffer: Buffer): readonly [Maybe<boolean>, Buffer] => {
    return [buffer.booleans.head, buffer.copy({ booleans: buffer.booleans.drop(1) })];
  };
  private bufferedDouble = (buffer: Buffer): readonly [Maybe<number>, Buffer] => {
    return [buffer.doubles.head, buffer.copy({ doubles: buffer.doubles.drop(1) })];
  };
  private bufferedInt = (buffer: Buffer): readonly [Maybe<number>, Buffer] => {
    return [buffer.integers.head, buffer.copy({ integers: buffer.integers.drop(1) })];
  };

  private getOrElse = <A>(
    buffer: (_: Buffer) => readonly [Maybe<A>, Buffer],
    random: UIO<A>,
  ): UIO<A> => {
    return this.bufferState.modify(buffer).chain((_) => _.match(() => random, IO.succeedNow));
  };

  private leastSignificantBits = (x: number): number => {
    return Math.floor(x) & ((1 << 24) - 1);
  };

  private mostSignificantBits = (x: number): number => {
    return Math.floor(x / (1 << 24));
  };

  private randomBits = (bits: number): UIO<number> => {
    return this.randomState.modify((data) => {
      const multiplier  = 0x5deece66d;
      const multiplier1 = Math.floor(multiplier >>> 24);
      const multiplier2 = Math.floor(multiplier) & ((1 << 24) - 1);
      const product1    = data.seed1 * multiplier1 + data.seed1 * multiplier2;
      const product2    = data.seed2 * multiplier2 + 0xb;
      const newSeed1    = (this.mostSignificantBits(product2) + this.leastSignificantBits(product1)) &
        ((1 << 24) - 1);
      const newSeed2 = this.leastSignificantBits(product2);
      const result   = (newSeed1 << 8) | (newSeed2 >> 16);
      return [result >>> (32 - bits), new Data(newSeed1, newSeed2, data.nextNextGaussians)];
    });
  };

  private randomBoolean = this.randomBits(1).map((n) => n !== 0);

  private randomBytes = (length: number): UIO<ReadonlyArray<Byte>> => {
    const loop = (
      i: number,
      rnd: UIO<number>,
      n: number,
      acc: UIO<List<Byte>>,
    ): UIO<List<Byte>> => {
      if (i === length) {
        return acc.map((l) => l.reverse);
      } else if (n > 0) {
        return rnd.chain((rnd) =>
          loop(
            i + 1,
            IO.succeedNow(rnd >> 8),
            n - 1,
            acc.map((_) => _.prepend(rnd)),
          ),
        );
      } else {
        return loop(i, this.nextInt, Math.min(length - i, 4), acc);
      }
    };

    return loop(0, this.randomInt, Math.min(length, 4), IO.succeedNow(List.empty())).map((list) =>
      Array.from(list),
    );
  };

  private randomIntBounded = (n: number) => {
    if (n <= 0) {
      return IO.haltNow(
        new IllegalArgumentError("n must be positive", "TestRandom.randomIntBounded"),
      );
    } else if ((n & -n) === n) {
      return this.randomBits(31).map((_) => _ >> Math.clz32(n));
    } else {
      const loop: UIO<number> = this.randomBits(31).chain((i) => {
        const value = i % n;
        if (i - value + (n - 1) < 0) return loop;
        else return IO.succeedNow(value);
      });
      return loop;
    }
  };

  private randomLong: UIO<bigint> = this.randomBits(32).chain((i1) =>
    this.randomBits(32).chain((i2) => IO.succeedNow(BigInt(i1 << 32) + BigInt(i2))),
  );

  private randomInt = this.randomBits(32);

  private randomDouble = this.randomBits(26).chain((i1) =>
    this.randomBits(27).map((i2) => (i1 * (1 << 27) + i2) / (1 << 53)),
  );

  private random = this.randomBits(26);

  get nextInt(): UIO<number> {
    return this.getOrElse(this.bufferedInt, this.randomInt);
  }

  get nextBoolean(): UIO<boolean> {
    return this.getOrElse(this.bufferedBoolean, this.randomBoolean);
  }

  get nextDouble(): UIO<number> {
    return this.getOrElse(this.bufferedDouble, this.randomDouble);
  }

  get next(): UIO<number> {
    return this.getOrElse(this.bufferedDouble, this.random);
  }

  nextBigIntBetween(low: bigint, high: bigint): UIO<bigint> {
    return this.randomLong.repeatUntil((n) => low <= n && n < high);
  }

  nextIntBetween(low: number, high: number): UIO<number> {
    return nextIntBetweenWith(low, high, this.randomInt, this.randomIntBounded);
  }

  nextRange(low: number, high: number): UIO<number> {
    return this.next.map((n) => (high - low + 1) * n + low);
  }

  nextArrayIntBetween(low: ArrayInt, high: ArrayInt): UIO<ArrayInt> {
    const self = this;
    return IO.gen(function* (_) {
      const rangeSize = trimArrayIntInplace(
        addOneToPositiveArrayInt(substractArrayIntToNew(high, low)),
      );
      const rangeLength        = rangeSize.data.length;
      const out: Array<number> = [];
      while (true) {
        for (let index = 0; index !== rangeLength; ++index) {
          const indexRangeSize = index === 0 ? rangeSize.data[0]! + 1 : 0x100000000;
          const g              = yield* _(self.randomIntBounded(indexRangeSize));
          out[index]           = g;
        }
        for (let index = 0; index !== rangeLength; ++index) {
          const current        = out[index]!;
          const currentInRange = rangeSize.data[index]!;
          if (current < currentInRange) {
            return out;
          } else if (current > currentInRange) {
            break;
          }
        }
      }
    }).map((ns) => trimArrayIntInplace(addArrayIntToNew({ sign: 1, data: ns }, low)));
  }
}

/**
 * @internal
 */
function nextIntBetweenWith(
  min: number,
  max: number,
  nextInt: UIO<number>,
  nextIntBounded: (_: number) => UIO<number>,
): UIO<number> {
  if (min >= max) {
    return IO.haltNow(new IllegalArgumentError("invalid bounds", "TestRandom.nextIntBetweenWith"));
  } else {
    const difference = max - min;
    if (difference > 0) return nextIntBounded(difference).map((n) => n + min);
    else return nextInt.repeatUntil((n) => min <= n && n < max);
  }
}

export class Data {
  constructor(
    readonly seed1: number,
    readonly seed2: number,
    readonly nextNextGaussians: ImmutableQueue<number> = ImmutableQueue.empty(),
  ) {}
}

export class Buffer {
  constructor(
    readonly booleans: Vector<boolean> = Vector.empty(),
    readonly bytes: Vector<ReadonlyArray<Byte>> = Vector.empty(),
    readonly chars: Vector<string> = Vector.empty(),
    readonly doubles: Vector<number> = Vector.empty(),
    readonly integers: Vector<number> = Vector.empty(),
    readonly strings: Vector<string> = Vector.empty(),
  ) {}

  copy(_: Partial<Buffer>): Buffer {
    return new Buffer(
      _.booleans ?? this.booleans,
      _.bytes ?? this.bytes,
      _.chars ?? this.chars,
      _.doubles ?? this.doubles,
      _.integers ?? this.integers,
      _.strings ?? this.strings,
    );
  }
}

/** @internal */
function isStrictlySmaller(dataA: number[], dataB: number[]): boolean {
  const maxLength = Math.max(dataA.length, dataB.length);
  for (let index = 0; index < maxLength; ++index) {
    const indexA = index + dataA.length - maxLength;
    const indexB = index + dataB.length - maxLength;
    const vA     = indexA >= 0 ? dataA[indexA]! : 0;
    const vB     = indexB >= 0 ? dataB[indexB]! : 0;
    if (vA < vB) return true;
    if (vA > vB) return false;
  }
  return false;
}

export function substractArrayIntToNew(arrayIntA: ArrayInt, arrayIntB: ArrayInt): ArrayInt {
  if (arrayIntA.sign !== arrayIntB.sign) {
    return addArrayIntToNew(arrayIntA, { sign: -arrayIntB.sign as -1 | 1, data: arrayIntB.data });
  }
  const dataA = arrayIntA.data;
  const dataB = arrayIntB.data;
  if (isStrictlySmaller(dataA, dataB)) {
    const out = substractArrayIntToNew(arrayIntB, arrayIntA);
    out.sign  = -out.sign as -1 | 1;
    return out;
  }
  const data: number[] = [];
  let reminder         = 0;
  for (
    let indexA = dataA.length - 1, indexB = dataB.length - 1;
    indexA >= 0 || indexB >= 0;
    --indexA, --indexB
  ) {
    const vA      = indexA >= 0 ? dataA[indexA]! : 0;
    const vB      = indexB >= 0 ? dataB[indexB]! : 0;
    const current = vA - vB - reminder;
    data.push(current >>> 0);
    reminder = current < 0 ? 1 : 0;
  }
  return { sign: arrayIntA.sign, data: data.reverse() };
}

/**
 * Trim uneeded zeros in ArrayInt
 * and uniform notation for zero: {sign: 1, data: [0]}
 */
export function trimArrayIntInplace(arrayInt: ArrayInt) {
  const data       = arrayInt.data;
  let firstNonZero = 0;
  // eslint-disable-next-line no-empty
  for (; firstNonZero !== data.length && data[firstNonZero] === 0; ++firstNonZero) {}
  if (firstNonZero === data.length) {
    // only zeros
    arrayInt.sign = 1;
    arrayInt.data = [0];
    return arrayInt;
  }
  data.splice(0, firstNonZero);
  return arrayInt;
  /* eslint-enable */
}

/**
 * Add two ArrayInt
 * @internal
 */
export function addArrayIntToNew(arrayIntA: ArrayInt, arrayIntB: ArrayInt): ArrayInt {
  if (arrayIntA.sign !== arrayIntB.sign) {
    return substractArrayIntToNew(arrayIntA, {
      sign: -arrayIntB.sign as -1 | 1,
      data: arrayIntB.data,
    });
  }
  const data: number[] = [];
  let reminder         = 0;
  const dataA          = arrayIntA.data;
  const dataB          = arrayIntB.data;
  for (
    let indexA = dataA.length - 1, indexB = dataB.length - 1;
    indexA >= 0 || indexB >= 0;
    --indexA, --indexB
  ) {
    const vA      = indexA >= 0 ? dataA[indexA]! : 0;
    const vB      = indexB >= 0 ? dataB[indexB]! : 0;
    const current = vA + vB + reminder;
    data.push(current >>> 0);
    reminder = ~~(current / 0x100000000);
  }
  if (reminder !== 0) {
    data.push(reminder);
  }
  return { sign: arrayIntA.sign, data: data.reverse() };
}

/**
 * Add one to a given positive ArrayInt
 * @internal
 */
export function addOneToPositiveArrayInt(arrayInt: ArrayInt): ArrayInt {
  arrayInt.sign = 1; // handling case { sign: -1, data: [0,...,0] }
  const data    = arrayInt.data;
  for (let index = data.length - 1; index >= 0; --index) {
    if (data[index] === 0xffffffff) {
      data[index] = 0;
    } else {
      data[index] += 1;
      return arrayInt;
    }
  }
  data.unshift(1);
  return arrayInt;
  /* eslint-enable */
}

function Mash() {
  let n = 0xefc8249d;

  const mash = function (data: string) {
    for (let i = 0; i < data.length; i++) {
      n    += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n     = h >>> 0;
      h    -= n;
      h    *= n;
      n     = h >>> 0;
      h    -= n;
      n    += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}
