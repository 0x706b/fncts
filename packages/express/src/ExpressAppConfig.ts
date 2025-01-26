import type { ExitHandler } from "./ExitHandler.js";

export class ExpressAppConfig extends IO.Tag<
  ExpressAppConfig,
  {
    readonly port: number;
    readonly host: string;
    readonly exitHandler: ExitHandler<never>;
  }
>() {}

export function LiveExpressAppConfig<R>(
  host: string,
  port: number,
  exitHandler: ExitHandler<R>,
): Layer<R, never, ExpressAppConfig> {
  return Layer.fromIO(
    IO.environmentWith(
      (r: Environment<R>): Tag.Value<ExpressAppConfig> => ({
        host,
        port,
        exitHandler: (req, res, next) => (cause) => exitHandler(req, res, next)(cause).provideEnvironment(r),
      }),
    ),
    ExpressAppConfig,
  );
}
