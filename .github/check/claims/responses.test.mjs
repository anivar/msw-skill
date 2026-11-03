// Responses and life-cycle events in Node.js. Corrected in 1.2.1: rules/response-use-httpresponse.md,
// references/response-api.md, rules/request-clone-events.md.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { http, HttpResponse } from "msw/http";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("https://api.test/native-cookie", () => new Response("{}", { headers: { "Set-Cookie": "session=native; Path=/" } })),
  http.get("https://api.test/native-error", () => Response.error()),
  http.get("https://api.test/msw-error", () => HttpResponse.error()),
  http.post("https://api.test/echo", async ({ request }) => HttpResponse.json({ got: await request.text() })),
);
before(() => server.listen({ onUnhandledFrame: "error" }));
after(() => server.close());

test("Node.js keeps Set-Cookie on a native Response", async () => {
  const res = await fetch("https://api.test/native-cookie");
  assert.deepEqual(res.headers.getSetCookie(), ["session=native; Path=/"]);
});

test("Response.error() and HttpResponse.error() both reject with a TypeError", async () => {
  await assert.rejects(fetch("https://api.test/native-error"), TypeError);
  await assert.rejects(fetch("https://api.test/msw-error"), TypeError);
});

test("reading the body in request:start without clone() gives the client a 500", async () => {
  const listener = async ({ request }) => {
    await request.json();
  };
  server.events.on("request:start", listener);
  try {
    const res = await fetch("https://api.test/echo", { method: "POST", body: JSON.stringify({ a: 1 }) });
    assert.equal(res.status, 500);
  } finally {
    server.events.removeListener("request:start", listener);
  }
});

test("reading request.clone() in request:start leaves the body for the handler", async () => {
  const listener = async ({ request }) => {
    await request.clone().json();
  };
  server.events.on("request:start", listener);
  try {
    const res = await fetch("https://api.test/echo", { method: "POST", body: JSON.stringify({ a: 1 }) });
    assert.deepEqual(await res.json(), { got: '{"a":1}' });
  } finally {
    server.events.removeListener("request:start", listener);
  }
});
