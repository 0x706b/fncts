import * as Express from "./index.js";

const route = Express.get("/", (_, res) => IO.succeed(res.send("Hello, world!")));

const app = Express.LiveExpress("localhost", 3000);

(route.provideSomeLayer(app) > IO.never).unsafeRunAsyncWith((exit) => console.log(exit));
