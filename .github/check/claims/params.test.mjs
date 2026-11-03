// Path matching on msw 3 (@msw/url). Corrected in 1.2.1 and 1.2.2: references/handler-api.md,
// references/migration-v2-to-v3.md.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { http, HttpResponse } from "msw/http";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("https://api.test/settings/:segments+", ({ params }) => HttpResponse.json(params)),
  http.get("https://api.test/files/:path*", ({ params }) => HttpResponse.json(params)),
  http.get("https://api.test/token/:id(\\d+)", ({ params }) => HttpResponse.json(params)),
  http.get(/\/user\/(\d+)$/, ({ params }) => HttpResponse.json({ id: params["0"] })),
);
before(() => server.listen({ onUnhandledFrame: "error" }));
after(() => server.close());

const json = async (url) => (await fetch(url)).json();

test("a repeating parameter (:segments+) is one string", async () => {
  assert.deepEqual(await json("https://api.test/settings/user/privacy"), { segments: "user/privacy" });
});

test("an optional repeating parameter (:path*) is one string", async () => {
  assert.deepEqual(await json("https://api.test/files/a/b/c.txt"), { path: "a/b/c.txt" });
});

test("a RegExp token in a string predicate matches no request", async () => {
  await assert.rejects(fetch("https://api.test/token/123"), TypeError);
});

test("a RegExp predicate gives its capture groups by index", async () => {
  assert.deepEqual(await json("https://api.test/user/123"), { id: "123" });
});
