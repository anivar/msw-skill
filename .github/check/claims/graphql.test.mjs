// GraphQL operations live on a link in msw 3. Corrected in 1.2.1: rules/graphql-response-shape.md,
// rules/graphql-scope-with-link.md.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { graphql } from "msw/graphql";
import { HttpResponse } from "msw/http";
import { setupServer } from "msw/node";

const github = graphql.link("https://api.github.test/graphql");
const internal = graphql.link("http://app.test/graphql");
const server = setupServer(
  github.query("GetUser", () => HttpResponse.json({ data: { user: { id: "github" } } })),
  internal.query("GetUser", () => HttpResponse.json({ data: { user: { id: "internal" } } }), { once: true }),
);
before(() => server.listen({ onUnhandledFrame: "error" }));
after(() => server.close());

const getUser = (url) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "query GetUser { user { id } }" }),
  });

test("the graphql namespace has no query() in v3", () => {
  assert.equal("query" in graphql, false);
});

test("each link answers only its own endpoint, and { once: true } answers once", async () => {
  assert.deepEqual(await (await getUser("http://app.test/graphql")).json(), { data: { user: { id: "internal" } } });
  assert.deepEqual(await (await getUser("https://api.github.test/graphql")).json(), { data: { user: { id: "github" } } });
  await assert.rejects(getUser("http://app.test/graphql"), TypeError);
});
