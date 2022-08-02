import type { NextFunction, Request, Response } from "express";

export type ExitHandler<R> = (req: Request, res: Response, next: NextFunction) => (cause: Cause<never>) => URIO<R, any>;

export type ErasedExitHandler = ExitHandler<any>;

export function defaultExitHandler(
  _req: Request,
  _res: Response,
  _next: NextFunction,
): (cause: Cause<never>) => URIO<never, void> {
  return (cause) =>
    IO.succeed(() => {
      if (cause.halted) {
        console.error(cause.prettyPrint);
      }
      _res.status(500).end();
    });
}
