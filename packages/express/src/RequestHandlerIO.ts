import type { NextFunction, Request, Response } from "express";
import type { RouteParameters } from "express-serve-static-core";
import type qs from "qs";

export interface RequestHandlerIO<
  R,
  Route extends string = any,
  P = RouteParameters<Route>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = qs.ParsedQs,
  Locals extends Record<string, any> = Record<string, any>,
> {
  (
    req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
    res: Response<ResBody, Locals>,
    next: NextFunction,
  ): URIO<R, void>;
}

export type ErasedRequestHandlerIO<R> = RequestHandlerIO<R, any, any, any, any, any, any>;

export type RequestHandlerRouteIO<R = never, Route extends string = any> = RequestHandlerIO<
  R,
  Route,
  RouteParameters<Route>
>;
