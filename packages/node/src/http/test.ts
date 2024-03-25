import { get, Router } from "@fncts/http/Router";
import { Server } from "@fncts/http/Server";
import { ServerRequest } from "@fncts/http/ServerRequest";
import { ServerResponse } from "@fncts/http/ServerResponse";
import { make, makeHandler } from "@fncts/node/http/Server";
import * as Http from "node:http";

const server = make(new Http.Server(), { port: 8085 });

const route = get(
  "/",
  IO.service(ServerRequest.Tag)
    .flatMap((req) => IO(console.log(req.headers.backing.toArray)))
    .flatMap(() => ServerResponse.json({ hello: "world!" })),
);

const router = route(Router.empty);

const serve = router.httpApp.serveIO();

const io = server.flatMap((server) => serve.provideService(server, Server.Tag)).flatMap(() => IO.never).scoped;

const fiber = io.unsafeRunFiber();

fiber.addObserver((exit) =>
  exit.match(
    (cause) => console.log(cause.prettyPrint),
    () => {},
  ),
);
