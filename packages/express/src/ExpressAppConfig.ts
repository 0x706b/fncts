import type { ExitHandler } from "./ExitHandler.js";

export interface ExpressAppConfig {
  readonly port: number;
  readonly host: string;
  readonly exitHandler: ExitHandler<never>;
}

export const ExpressAppConfigTag = Tag<ExpressAppConfig>();

export function LiveExpressAppConfig<R>(
  host: string,
  port: number,
  exitHandler: ExitHandler<R>,
): Layer<R, never, ExpressAppConfig> {
  return Layer.fromIO(
    IO.environmentWith((r: Environment<R>) => ({
      host,
      port,
      exitHandler: (req, res, next) => (cause) => exitHandler(req, res, next)(cause).provideEnvironment(r),
    })),
    ExpressAppConfigTag,
  );
}
