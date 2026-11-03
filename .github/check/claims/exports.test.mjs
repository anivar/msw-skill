// Entrypoints. Corrected in 1.2.1: rules/setup-import-paths.md, references/handler-api.md,
// references/migration-v2-to-v3.md.
import assert from "node:assert/strict";
import { test } from "node:test";

test("msw/http exports http, HttpResponse, HttpHandler and HttpMethods only", async () => {
  assert.deepEqual(Object.keys(await import("msw/http")).sort(), ["HttpHandler", "HttpMethods", "HttpResponse", "http"]);
});

test("matchRequestUrl comes from the root module", async () => {
  assert.equal(typeof (await import("msw")).matchRequestUrl, "function");
});

test("the root module does not re-export graphql, setupServer or setupWorker", async () => {
  const root = await import("msw");
  for (const name of ["graphql", "setupServer", "setupWorker"]) assert.equal(name in root, false, name);
});
