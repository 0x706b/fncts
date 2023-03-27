import { CompletablePromise } from "@fncts/base/control/CompletablePromise";

const promise = CompletablePromise<number>();

promise.resolve(42069)

/*
 * setTimeout(() => {
 *   promise.resolve(42069)
 * }, 1000)
 */

await promise.then((value) => {
  console.log(value)
})
