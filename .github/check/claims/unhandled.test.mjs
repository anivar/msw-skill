// The unhandled-request strategy. Corrected in 1.2.1: rules/test-unhandled-request.md,
// references/server-api.md, references/migration-v2-to-v3.md.
import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import { setupServer } from "msw/node";
import { captureConsole, startReal } from "./real.mjs";

const server = setupServer();
let real;
before(async () => {
  real = await startReal();
});
afterEach(() => server.close());
after(() => real.close());

test("the default 'warn' prints a warning and lets the request reach the network", async (t) => {
  const lines = captureConsole(t);
  server.listen();
  const res = await fetch(`${real.base}/api`);
  assert.equal((await res.json()).from, "real");
  assert.deepEqual(lines, ["warn: [MSW] Warning: intercepted a request without a matching request handler:"]);
});

test("'error' prints an error and rejects the request with a TypeError; it does not throw into the test", async (t) => {
  const lines = captureConsole(t);
  server.listen({ onUnhandledFrame: "error" });
  await assert.rejects(fetch(`${real.base}/api`), TypeError);
  assert.deepEqual(lines, ["error: [MSW] Error: intercepted a request without a matching request handler:"]);
});

test("a custom callback gets one { frame, defaults } object", async (t) => {
  captureConsole(t);
  const calls = [];
  server.listen({ onUnhandledFrame: (...args) => calls.push(args) });
  await fetch(`${real.base}/api`);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].length, 1);
  assert.deepEqual(Object.keys(calls[0][0]).sort(), ["defaults", "frame"]);
});

test("a leftover v2 onUnhandledRequest is ignored: the default 'warn' applies", async (t) => {
  const lines = captureConsole(t);
  server.listen({ onUnhandledRequest: "error" });
  const res = await fetch(`${real.base}/api`);
  assert.equal((await res.json()).from, "real");
  assert.deepEqual(lines, ["warn: [MSW] Warning: intercepted a request without a matching request handler:"]);
});
