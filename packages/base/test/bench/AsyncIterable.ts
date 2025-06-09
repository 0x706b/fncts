import { setTimeout } from "node:timers/promises";

const iter = AsyncIterable(async function* () {
  let i = 0;
  while (i < 99) {
    yield i++;
  }
}).foldLeftWithIndex(0, (_, sum, v) => setTimeout(100, sum + v));

iter.then((n) => console.log(n));
