import { Bench } from "tinybench";

const bench = new Bench();

const array = Array.range(0, 1000);

bench.add("100", () => Eval.forEach(array, (n) => Eval.now(n.toString())));

const fac = (n: number): Eval<number> =>
  Eval.defer(() => {
    if (n === 0) {
      return Eval.now(0);
    }
    if (n === 1) {
      return Eval.now(1);
    }
    return fac(n - 1).map((n0) => n * n0);
  });
// Eval.gen(function* (_) {
//   if (n === 0) {
//     return 0;
//   }

//   if (n === 1) {
//     return 1;
//   }

//   const n0 = yield* _(fib(n - 1));
//   const n1 = yield* _(fib(n - 2));

//   return n0 + n1;
// });

await bench.run();
console.table(bench.table());
