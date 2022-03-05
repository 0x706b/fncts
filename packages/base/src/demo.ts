import { ReadonlyArray } from "./collection/Array";
import { Conc } from "./collection/immutable/Conc";
import { IO } from "./control/IO";
import { Z } from "./control/Z";
import { showWithOptions } from "./prelude/Showable";

const x = {
  a: "hello",
  b: 1,
  c: true,
  d: ReadonlyArray.range(1, 1000),
  e: Conc.range(1, 1000),
  f: Z.succeedNow(1),
  g: IO.succeed(1),
  h: {
    i: {
      j: "deep object",
    },
  },
};

// @ts-expect-error
x.h.i.circular = x;

console.log(showWithOptions(x, { colors: true, depth: 100 }));
