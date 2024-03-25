import type { HttpApp } from "@fncts/http/HttpApp";

/**
 * @tsplus type fncts.http.Middleware
 */
export interface Middleware {
  <R, E>(self: HttpApp.Default<R, E>): HttpApp.Default<any, any>;
}

/**
 * @tsplus type fncts.http.MiddlewareOps
 */
export interface MiddlewareOps {}

export const Middleware: MiddlewareOps = {};

export declare namespace Middleware {
  export interface Applied<R, E, A extends HttpApp.Default<any, any>> {
    (self: HttpApp.Default<R, E>): A;
  }
}

/**
 * @tsplus static fncts.http.MiddlewareOps __call
 * @tsplus static fncts.http.MiddlewareOps make
 */
export function make<M extends Middleware>(middleware: M): M {
  return middleware;
}
